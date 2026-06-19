import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { MediaModule } from '../media/media.module';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RestockNotificationModule } from '../restock-notification/restock-notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Payment]), MediaModule, RestockNotificationModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, RateLimitGuard],
})
export class OrderModule {}
