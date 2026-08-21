import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CouponModule } from '../coupon/coupon.module';
import { Cod24Module } from '../../services/cod24/cod24.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Payment]),
    CouponModule,
    Cod24Module,
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, RateLimitGuard],
  exports: [OrderService],
})
export class OrderModule {}
