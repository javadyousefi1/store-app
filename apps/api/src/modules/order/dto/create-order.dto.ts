import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';
import { DeliveryType } from '../../../entities/order.entity';
import { PaymentMethod } from '../../../entities/payment.entity';

export class CreateOrderDto {
  @ApiProperty({ example: 'علی' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'محمدی' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'تهران، خیابان ولیعصر، پلاک ۱۲' })
  @IsString()
  address: string;

  @ApiProperty({ example: '1234567890', description: '10-digit Iranian postal code' })
  @Matches(/^\d{10}$/, { message: 'postalCode must be exactly 10 digits' })
  postalCode: string;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.IN_PERSON })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  // ── Iran Post fields (required when deliveryType = IRAN_POST) ────────
  @ApiPropertyOptional({ example: '09121234567', description: 'Required for iran_post.' })
  @ValidateIf((o) => o.deliveryType === DeliveryType.IRAN_POST)
  @Matches(/^09\d{9}$/, { message: 'mobile must be an 11-digit Iranian phone starting with 09' })
  mobile?: string;

  @ApiPropertyOptional({ example: '0012345678', description: '10-digit national code (optional).' })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'nationalCode must be exactly 10 digits' })
  nationalCode?: string;

  @ApiPropertyOptional({ example: 8, description: 'Cod24 state postCode. Required for iran_post.' })
  @ValidateIf((o) => o.deliveryType === DeliveryType.IRAN_POST)
  @IsInt()
  @Min(1)
  stateCode?: number;

  @ApiPropertyOptional({ example: 1035, description: 'Cod24 city code. Required for iran_post.' })
  @ValidateIf((o) => o.deliveryType === DeliveryType.IRAN_POST)
  @IsInt()
  @Min(1)
  cityCode?: number;

  @ApiPropertyOptional({ example: 'اصفهان', description: 'Human-readable state name — persisted as snapshot.' })
  @ValidateIf((o) => o.deliveryType === DeliveryType.IRAN_POST)
  @IsString()
  @MaxLength(100)
  stateName?: string;

  @ApiPropertyOptional({ example: 'اصفهان', description: 'Human-readable city name — persisted as snapshot.' })
  @ValidateIf((o) => o.deliveryType === DeliveryType.IRAN_POST)
  @IsString()
  @MaxLength(100)
  cityName?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.ONLINE_GATEWAY,
    description:
      'card_to_card: shopper uploads a receipt after checkout. online_gateway: response includes a redirectUrl to the provider (see gatewayName).',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'zarinpal',
    required: false,
    description: 'Online-gateway provider slug. Required when paymentMethod=online_gateway. Currently supported: "zarinpal".',
  })
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.ONLINE_GATEWAY)
  @IsString()
  @IsOptional()
  gatewayName?: string;

  @ApiProperty({ example: 'لطفاً زودتر ارسال شود', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: 'SUMMER25', required: false, description: 'Optional coupon code. Re-validated server-side.' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
