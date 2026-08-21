import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { CouponScopeType } from '../../../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Case-insensitive; stored upper-case.' })
  @IsString()
  @Length(3, 64)
  code: string;

  @ApiProperty({ example: 20, description: 'Discount percentage (1-100).' })
  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;

  @ApiProperty({ example: 100000, description: 'Maximum discount in Toman.' })
  @IsNumber()
  @Min(0)
  maxDiscountAmount: number;

  @ApiProperty({ example: 100, description: 'Total uses allowed across all users.' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: CouponScopeType })
  @IsEnum(CouponScopeType)
  scopeType: CouponScopeType;

  @ApiProperty({ description: 'Product UUID when scopeType=product, Category UUID when scopeType=category.' })
  @IsUUID()
  scopeId: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
