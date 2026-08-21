import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from '../../entities/coupon.entity';
import { CouponRedemption } from '../../entities/coupon-redemption.entity';
import { Cart } from '../../entities/cart.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { AdminCouponController } from './admin-coupon.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponRedemption, Cart, ProductVariant, Product, Category]),
  ],
  controllers: [CouponController, AdminCouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
