import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * Public quote request. The frontend hits this while the shopper is on
 * the checkout page — after they pick a city and before they submit.
 *
 * We derive weight + goods amount from the shopper's cart on the server
 * (so they can't lie their way to a cheaper quote), so the client only
 * needs to tell us WHICH city to ship to.
 */
export class QuoteShippingDto {
  @ApiProperty({ example: 1035, description: 'Cod24 city code' })
  @IsInt()
  @Min(1)
  cityCode: number;
}
