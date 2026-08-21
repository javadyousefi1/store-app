import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../../../entities/payment.entity';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGatewayProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from '../interfaces/payment-gateway-provider.interface';
import {
  PaymentGatewayConfigError,
  PaymentGatewayError,
} from '../payment-gateway.errors';

// Hosts per ZarinPal docs. Sandbox uses the sandbox subdomain — same request/
// response shape, different merchant id issued by the panel.
const HOST_PROD    = 'https://payment.zarinpal.com';
const HOST_SANDBOX = 'https://sandbox.zarinpal.com';

const REQUEST_PATH  = '/pg/v4/payment/request.json';
const VERIFY_PATH   = '/pg/v4/payment/verify.json';
const STARTPAY_PATH = '/pg/StartPay';

// ZarinPal response codes we branch on. All other non-100 codes are treated
// as failures. Source: https://www.zarinpal.com/docs/paymentGateway/
const CODE_SUCCESS = 100;   // request accepted / verify captured funds
const CODE_ALREADY = 101;   // verify: already verified previously (idempotent success)

type ZarinPalRequestBody = {
  merchant_id: string;
  amount: number;
  currency: 'IRT' | 'IRR';
  description: string;
  callback_url: string;
  metadata?: Record<string, string>;
};

type ZarinPalResponse<T> = {
  data: T | [] | Record<string, never>;
  // ZarinPal returns an empty [] when there are no errors and an object when
  // validation fails (e.g. { code: -9, message, validations: [...] }).
  errors: ZarinPalErrorsField;
};

type ZarinPalErrorsField =
  | []
  | {
      code?: number;
      message?: string;
      validations?: Array<Record<string, string>>;
    }
  | undefined;

type ZarinPalRequestData = {
  code: number;
  message: string;
  authority: string;
  fee_type?: string;
  fee?: number;
};

type ZarinPalVerifyData = {
  code: number;
  message: string;
  ref_id?: number | string;
  card_pan?: string;
  card_hash?: string;
  fee_type?: string;
  fee?: number;
};

@Injectable()
export class ZarinPalProvider implements PaymentGatewayProvider {
  readonly method = PaymentMethod.ONLINE_GATEWAY;
  readonly slug = 'zarinpal';

  private readonly logger = new Logger(ZarinPalProvider.name);

  constructor(private readonly config: ConfigService) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const merchantId = this.getMerchantId();
    const currency   = this.getCurrency();
    const host       = this.getHost();

    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new PaymentGatewayConfigError(this.slug, `amount must be a positive integer, got ${input.amount}`);
    }

    const body: ZarinPalRequestBody = {
      merchant_id: merchantId,
      amount: input.amount,
      currency,
      description: input.description,
      callback_url: input.callbackUrl,
      ...(input.metadata && Object.keys(input.metadata).length
        ? { metadata: this.pruneMetadata(input.metadata) }
        : {}),
    };

    this.logger.log(
      `[request] host=${host} amount=${input.amount} ${currency} callback=${input.callbackUrl} orderId=${input.orderId} merchant=${this.maskMerchant(merchantId)}`,
    );

    const res = await this.post<ZarinPalRequestData>(`${host}${REQUEST_PATH}`, body);
    const data = this.pickData(res);

    if (!data || data.code !== CODE_SUCCESS || !data.authority) {
      // ZarinPal puts the real diagnostic on the `errors` object when the
      // request-level validation fails (e.g. -14 callback URL mismatch,
      // -9 validation error, -10 wrong merchant/ip). Surface that.
      const { code, message } = this.pickError(res, data);
      this.logger.error(
        `[request] rejected code=${code} message=${message} — full response: ${JSON.stringify(res)}`,
      );
      throw new PaymentGatewayError(this.slug, code, message, res);
    }

    this.logger.log(`[request] accepted authority=${data.authority} code=${data.code}`);

    return {
      authority: data.authority,
      redirectUrl: `${host}${STARTPAY_PATH}/${data.authority}`,
      feeType: data.fee_type ?? null,
      fee: data.fee ?? null,
      gatewayCode: data.code,
      gatewayMessage: data.message,
      rawResponse: res,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const merchantId = this.getMerchantId();
    const host       = this.getHost();

    if (!input.authority) {
      throw new PaymentGatewayConfigError(this.slug, 'authority is required');
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new PaymentGatewayConfigError(this.slug, `amount must be a positive integer, got ${input.amount}`);
    }

    this.logger.log(
      `[verify] host=${host} amount=${input.amount} authority=${input.authority} merchant=${this.maskMerchant(merchantId)}`,
    );

    const res = await this.post<ZarinPalVerifyData>(`${host}${VERIFY_PATH}`, {
      merchant_id: merchantId,
      amount: input.amount,
      authority: input.authority,
    });

    const data = this.pickData(res);
    if (!data || typeof data.code !== 'number') {
      const { code, message } = this.pickError(res, data);
      this.logger.error(
        `[verify] no data code=${code} message=${message} — full response: ${JSON.stringify(res)}`,
      );
      throw new PaymentGatewayError(this.slug, code, message, res);
    }

    const success        = data.code === CODE_SUCCESS;
    const alreadyVerified = data.code === CODE_ALREADY;

    this.logger.log(
      `[verify] code=${data.code} success=${success} alreadyVerified=${alreadyVerified} refId=${data.ref_id ?? '-'}`,
    );

    return {
      success: success || alreadyVerified,
      alreadyVerified,
      refId: data.ref_id != null ? String(data.ref_id) : null,
      cardPan: data.card_pan ?? null,
      cardHash: data.card_hash ?? null,
      fee: data.fee ?? null,
      feeType: data.fee_type ?? null,
      gatewayCode: data.code,
      gatewayMessage: data.message ?? '',
      rawResponse: res,
    };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private getMerchantId(): string {
    const id = this.config.get<string>('payment.zarinpal.merchantId');
    if (!id) throw new PaymentGatewayConfigError(this.slug, 'ZARINPAL_MERCHANT_ID is not set');
    if (id.length !== 36) {
      throw new PaymentGatewayConfigError(
        this.slug,
        `ZARINPAL_MERCHANT_ID must be 36 chars, got ${id.length}`,
      );
    }
    return id;
  }

  private getCurrency(): 'IRT' | 'IRR' {
    const c = this.config.get<'IRT' | 'IRR'>('payment.zarinpal.currency') ?? 'IRT';
    if (c !== 'IRT' && c !== 'IRR') {
      throw new PaymentGatewayConfigError(this.slug, `unsupported currency "${c}"`);
    }
    return c;
  }

  private getHost(): string {
    return this.config.get<boolean>('payment.zarinpal.sandbox') ? HOST_SANDBOX : HOST_PROD;
  }

  private pruneMetadata(m: NonNullable<CreatePaymentInput['metadata']>): Record<string, string> {
    const out: Record<string, string> = {};
    if (m.mobile)  out.mobile   = m.mobile;
    if (m.email)   out.email    = m.email;
    if (m.orderId) out.order_id = String(m.orderId);
    return out;
  }

  /**
   * ZarinPal returns `data: []` when there's no payload (all the info is in
   * `errors`) and `data: { code, ... }` on success. Normalize to null | T.
   */
  private pickData<T>(res: ZarinPalResponse<T>): T | null {
    const d = res?.data as unknown;
    if (d == null) return null;
    if (Array.isArray(d)) return null;
    if (typeof d === 'object' && Object.keys(d as object).length === 0) return null;
    return d as T;
  }

  /**
   * Extract a diagnostic (code + message) from a failed response. We try
   * `data` first (some codes come back there, e.g. verify's -51/-53), then
   * `errors` (validation errors), then fall back to a generic message.
   */
  private pickError(
    res: ZarinPalResponse<unknown>,
    data: { code?: number; message?: string } | null,
  ): { code: number | string; message: string } {
    if (data && typeof data.code === 'number') {
      return { code: data.code, message: data.message || this.describeCode(data.code) || 'request failed' };
    }
    const errs = res?.errors;
    if (errs && !Array.isArray(errs) && typeof errs === 'object') {
      const e = errs as { code?: number; message?: string; validations?: Array<Record<string, string>> };
      const validationHints = e.validations?.length
        ? ' — ' + e.validations
            .flatMap((v) => Object.entries(v).map(([k, val]) => `${k}: ${val}`))
            .join('; ')
        : '';
      return {
        code:    typeof e.code === 'number' ? e.code : 'unknown',
        message: (e.message || this.describeCode(e.code) || 'request failed') + validationHints,
      };
    }
    return { code: 'unknown', message: 'request failed (empty response body)' };
  }

  /** Persian-friendly hints for the codes we're most likely to see in dev. */
  private describeCode(code: number | undefined): string | null {
    switch (code) {
      case -9:  return 'Validation error — check callback_url, amount, description';
      case -10: return 'Terminal invalid — check merchant_id or IP';
      case -11: return 'Terminal not active — contact ZarinPal support';
      case -14: return 'callback_url domain does not match the domain registered for this merchant';
      case -15: return 'Terminal is suspended — contact ZarinPal support';
      case -41: return 'Amount exceeds maximum (100M Toman)';
      case -50: return 'Verify amount mismatch — must equal the amount sent on request';
      case -51: return 'Payment session not successful';
      case -53: return 'Authority does not belong to this merchant';
      case -54: return 'Invalid authority';
      case -55: return 'Transaction not found';
      default:  return null;
    }
  }

  private maskMerchant(id: string): string {
    if (id.length < 12) return '***';
    return `${id.slice(0, 4)}…${id.slice(-4)}`;
  }

  private async post<T>(url: string, body: unknown): Promise<ZarinPalResponse<T>> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      // Network-level failures (DNS, timeout, TLS) — the gateway is unreachable.
      // Node's undici throws a generic "fetch failed" and hides the real reason
      // under `.cause`. Unwrap it so we can actually diagnose (ENOTFOUND vs
      // ECONNREFUSED vs certificate error vs …).
      const cause = err?.cause;
      const detail = [
        err?.message,
        cause?.code && `code=${cause.code}`,
        cause?.errno && `errno=${cause.errno}`,
        cause?.syscall && `syscall=${cause.syscall}`,
        cause?.hostname && `hostname=${cause.hostname}`,
        cause?.address && `address=${cause.address}`,
        cause?.message && cause.message !== err.message && `cause="${cause.message}"`,
      ].filter(Boolean).join(' ');

      this.logger.error(`ZarinPal ${url} network error → ${detail}`);
      throw new PaymentGatewayError(this.slug, cause?.code ?? 'network', detail || 'network error');
    }

    const text = await response.text();
    let json: ZarinPalResponse<T>;
    try {
      json = JSON.parse(text);
    } catch {
      this.logger.error(`ZarinPal ${url} non-JSON response (${response.status}): ${text.slice(0, 500)}`);
      throw new PaymentGatewayError(
        this.slug,
        response.status,
        `non-JSON response from gateway`,
        text.slice(0, 1000),
      );
    }

    this.logger.debug(`ZarinPal ${url} HTTP ${response.status} → ${text.slice(0, 500)}`);

    // ZarinPal returns 200 with `errors` populated on validation failures. We
    // don't throw on HTTP 4xx/5xx alone — the caller inspects data.code / errors.
    return json;
  }
}
