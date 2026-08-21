import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export enum VerifyPaymentStatus {
  OK  = 'OK',
  NOK = 'NOK',
}

/**
 * The shopper's browser lands on the storefront's callback page with
 * `?Authority=…&Status=OK|NOK` query params (ZarinPal spec). The storefront
 * relays them here so the backend can verify with the gateway.
 *
 * We look the payment (and therefore its gateway) up by authority — the
 * client never has to know which provider handled the transaction.
 */
export class VerifyPaymentDto {
  @ApiProperty({ example: 'A0000000000000000000000000000wwOGYpd' })
  @IsString()
  @MaxLength(100)
  authority: string;

  @ApiProperty({
    enum: VerifyPaymentStatus,
    example: VerifyPaymentStatus.OK,
    description: 'OK = shopper completed on the gateway. NOK = shopper aborted or bank declined.',
  })
  @IsEnum(VerifyPaymentStatus)
  status: VerifyPaymentStatus;
}
