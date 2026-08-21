import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../entities/cart.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { Cod24Module } from '../../services/cod24/cod24.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, ProductVariant]), Cod24Module],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
