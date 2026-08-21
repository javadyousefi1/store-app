import { BadGatewayException, InternalServerErrorException } from '@nestjs/common';

/**
 * Thrown when the upstream provider rejects our request (returns a non-success
 * response). Maps to HTTP 502 so ops can distinguish "our fault" from "their
 * fault" in logs.
 */
export class PaymentGatewayError extends BadGatewayException {
  constructor(
    public readonly gateway: string,
    public readonly code: number | string,
    public readonly gatewayMessage: string,
    public readonly rawResponse?: unknown,
  ) {
    super(`[${gateway}] ${gatewayMessage} (code=${code})`);
  }
}

/**
 * Thrown when the gateway is misconfigured on our side (missing merchant id,
 * bad currency, etc). Distinct from PaymentGatewayError because retrying
 * won't help.
 */
export class PaymentGatewayConfigError extends InternalServerErrorException {
  constructor(gateway: string, reason: string) {
    super(`[${gateway}] misconfigured: ${reason}`);
  }
}
