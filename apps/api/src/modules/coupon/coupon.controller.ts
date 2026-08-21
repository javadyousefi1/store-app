import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { QuoteCouponDto } from './dto/quote-coupon.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Coupon')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('quote')
  @ApiOperation({
    summary: 'Validate a coupon against my current cart',
    description:
      'Returns `{ valid: true, subtotal, discountAmount, total, eligibleVariantIds, ... }` if the code is usable, or `{ valid: false, reason }` otherwise. All amounts are in Toman. This call does **not** consume the coupon — actual consumption happens at order creation.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      examples: {
        valid: {
          summary: 'Valid coupon',
          value: {
            valid: true,
            code: 'SUMMER25',
            percentage: 20,
            maxDiscountAmount: 100000,
            subtotal: 850000,
            discountAmount: 100000,
            total: 750000,
            eligibleVariantIds: ['...', '...'],
          },
        },
        invalid: {
          summary: 'Invalid coupon',
          value: { valid: false, reason: 'هیچ کالای مشمول این کد در سبد نیست' },
        },
      },
    },
  })
  quote(@CurrentUser('id') userId: string, @Body() dto: QuoteCouponDto) {
    return this.couponService.quoteForUser(userId, dto.code);
  }
}
