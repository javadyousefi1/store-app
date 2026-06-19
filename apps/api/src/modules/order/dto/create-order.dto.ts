import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
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

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD_TO_CARD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'لطفاً زودتر ارسال شود', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
