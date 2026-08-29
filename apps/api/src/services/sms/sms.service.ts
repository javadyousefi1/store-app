import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KavenegarResponse {
  return?: { status: number; message: string };
  entries?: unknown;
}

interface LookupParams {
  template: string;
  token: string;
  token2?: string;
  token3?: string;
  /** token10/token20 accept longer content in Kavenegar (Persian names etc). */
  token10?: string;
  token20?: string;
}

/**
 * SMS provider adapter (currently Kavenegar). Templates are pre-registered
 * in the Kavenegar panel; we only pass the template name and tokens.
 *
 * Keep this file provider-specific — if we ever swap providers, expose the
 * same public methods so callers don't change.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Send an OTP via a Kavenegar lookup template. Blocks the auth flow on
   * failure so the shopper immediately retries instead of waiting for a
   * code that never arrives.
   */
  async sendOtp(phone: string, code: string, template?: string): Promise<void> {
    const tpl = template ?? this.config.get<string>('kavenegar.otpTemplate');
    return this.sendLookup(phone, { template: tpl, token: code });
  }

  /**
   * "Order placed" notification. Non-critical — callers should fire-and-forget
   * so a Kavenegar hiccup doesn't take down the order flow. Template variable
   * `%token` = tracking number (bank refId for online, short order id for
   * card-to-card).
   */
  async sendOrderCreated(phone: string, trackingNumber: string): Promise<void> {
    const tpl = this.config.get<string>('kavenegar.orderCreatedTemplate');
    return this.sendLookup(phone, { template: tpl, token: trackingNumber });
  }

  /**
   * "Product is back in stock" notification. Sent when a variant a
   * shopper subscribed to becomes available again. Template variable
   * is passed through Kavenegar's `token10` slot because a URL contains
   * `:` and `/`, which the plain `token` slot rejects. IMPORTANT —
   * the Kavenegar template (`restock-elina`) must reference `%token10`,
   * not `%token`, or Kavenegar will drop the URL.
   *
   * Non-critical — callers should fire-and-forget so a Kavenegar hiccup
   * doesn't take down the restock sweep.
   */
  async sendRestockNotification(phone: string, productUrl: string): Promise<void> {
    const tpl = this.config.get<string>('kavenegar.restockTemplate');
    // `token` still needs to be non-empty (Kavenegar validation), so we
    // pass a placeholder — the actual variable used in the template is
    // `%token10`.
    return this.sendLookup(phone, {
      template: tpl,
      token: '_',
      token10: productUrl,
    });
  }

  /**
   * Low-level Kavenegar `/verify/lookup.json` call. Throws
   * BadRequestException on any failure. Empty API key = dev mode: skip the
   * HTTP call and log instead (so devs can develop without an account).
   */
  private async sendLookup(phone: string, params: LookupParams): Promise<void> {
    const apiKey = this.config.get<string>('kavenegar.apiKey');

    if (!apiKey) {
      this.logger.warn(`[dev] KAVENEGAR_API_KEY not set — skipping SMS. phone=${phone} template=${params.template} token=${params.token}`);
      return;
    }

    const url = new URL(`https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`);
    url.searchParams.set('receptor', phone);
    url.searchParams.set('template', params.template);
    url.searchParams.set('token', params.token);
    if (params.token2)  url.searchParams.set('token2',  params.token2);
    if (params.token3)  url.searchParams.set('token3',  params.token3);
    if (params.token10) url.searchParams.set('token10', params.token10);
    if (params.token20) url.searchParams.set('token20', params.token20);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url.toString(), { signal: controller.signal }).finally(() => clearTimeout(timeout));

      const text = await res.text();
      let body: KavenegarResponse | null = null;
      try { body = JSON.parse(text); } catch { /* non-JSON */ }

      // Kavenegar returns 200 with `return.status` on both success (200) and
      // most errors (non-200 codes). Treat anything other than 200 as failure.
      const status = body?.return?.status;
      const message = body?.return?.message ?? text.slice(0, 200);

      if (!res.ok || status !== 200) {
        this.logger.error(`Kavenegar lookup failed phone=${phone} template=${params.template} httpStatus=${res.status} apiStatus=${status} message=${message}`);
        throw new BadRequestException('ارسال پیامک با خطا مواجه شد');
      }

      this.logger.log(`Kavenegar lookup ok phone=${phone} template=${params.template}`);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // Network-level (DNS, TLS, timeout, abort) or unexpected error.
      const cause = err?.cause;
      const detail = [err?.message, cause?.code && `code=${cause.code}`].filter(Boolean).join(' ');
      this.logger.error(`Kavenegar lookup network error phone=${phone} template=${params.template}: ${detail}`);
      throw new BadRequestException('ارسال پیامک با خطا مواجه شد');
    }
  }
}
