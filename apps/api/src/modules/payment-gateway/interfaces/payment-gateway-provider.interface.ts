import { PaymentMethod } from '../../../entities/payment.entity';

export interface CreatePaymentInput {
  orderId: string;
  amount: number;          // amount in the currency the provider expects (Toman for us)
  description: string;
  callbackUrl: string;     // absolute URL — where the gateway will redirect the shopper
  metadata?: {
    mobile?: string;
    email?: string;
    orderId?: string;
  };
}

export interface CreatePaymentResult {
  authority: string;       // provider session token
  redirectUrl: string;     // absolute URL to send the shopper to
  feeType?: string | null;
  fee?: number | null;
  gatewayCode: number;
  gatewayMessage?: string | null;
  rawResponse: unknown;
}

export interface VerifyPaymentInput {
  authority: string;
  amount: number;          // MUST match the amount originally sent — providers reject mismatches
}

export interface VerifyPaymentResult {
  /** True when the gateway confirms funds were captured. */
  success: boolean;
  /**
   * True when the provider reports this authority was verified in a previous
   * call (e.g. ZarinPal code 101). Callers should treat this as a successful
   * payment but MUST NOT re-fulfill the order (idempotency).
   */
  alreadyVerified: boolean;
  refId?: string | null;
  cardPan?: string | null;
  cardHash?: string | null;
  fee?: number | null;
  feeType?: string | null;
  gatewayCode: number;
  gatewayMessage: string;
  rawResponse: unknown;
}

/**
 * Contract every payment gateway integration implements. Adding a new gateway
 * = a new @Injectable class exposing this shape + registering it in the
 * PaymentGatewayModule providers list.
 *
 * Providers MUST be pure adapters: no DB writes, no order-state changes. They
 * only translate to/from the upstream HTTP API and return typed results.
 */
export interface PaymentGatewayProvider {
  readonly method: PaymentMethod;
  readonly slug: string;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
