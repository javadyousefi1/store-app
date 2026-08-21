import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { Payment } from '../../entities/payment.entity';
import { OrderModule } from '../order/order.module';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';
import { StorageModule } from '../../services/storage/storage.module';
import { SmsModule } from '../../services/sms/sms.module';
import { RestockNotificationModule } from '../restock-notification/restock-notification.module';
import { PaymentController } from './payment.controller';
import { AdminPaymentController } from './admin-payment.controller';
import { PaymentService } from './payment.service';
import { PaymentExpiryService } from './payment-expiry.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Payment]),
    OrderModule,
    PaymentGatewayModule,
    StorageModule,
    SmsModule,
    RestockNotificationModule,
  ],
  controllers: [PaymentController, AdminPaymentController],
  providers: [PaymentService, PaymentExpiryService, RateLimitGuard],
  exports: [PaymentService],
})
export class PaymentModule {}
