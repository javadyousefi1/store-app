import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentGatewayProvider } from './interfaces/payment-gateway-provider.interface';
import { ZarinPalProvider } from './providers/zarinpal.provider';

/**
 * Resolves an online-gateway slug (e.g. "zarinpal") to a concrete provider.
 *
 * Since we collapsed PaymentMethod to CARD_TO_CARD | ONLINE_GATEWAY, every
 * online provider shares the same enum value — the slug alone identifies
 * which upstream API to talk to. Adding a new gateway = new @Injectable
 * provider + register it below.
 */
@Injectable()
export class PaymentGatewayRegistry {
  private readonly bySlug = new Map<string, PaymentGatewayProvider>();
  private readonly defaultSlug: string;

  constructor(zarinpal: ZarinPalProvider) {
    this.register(zarinpal);
    this.defaultSlug = zarinpal.slug;
  }

  private register(provider: PaymentGatewayProvider): void {
    this.bySlug.set(provider.slug, provider);
  }

  /** Resolve a provider by the slug the client (or DB row) specified. */
  resolveBySlug(slug: string): PaymentGatewayProvider {
    const p = this.bySlug.get(slug);
    if (!p) throw new NotFoundException(`Unknown gateway "${slug}"`);
    return p;
  }

  /**
   * Resolve the slug the caller asked for, or fall back to the default one
   * when the client didn't specify (single-gateway deployments). Throws
   * BadRequest if the requested slug is unknown so misconfig fails loudly.
   */
  resolveByOptionalSlug(slug: string | undefined): PaymentGatewayProvider {
    const s = (slug ?? this.defaultSlug).trim();
    const p = this.bySlug.get(s);
    if (!p) throw new BadRequestException(`Unknown gateway "${s}"`);
    return p;
  }
}
