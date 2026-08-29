import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestockNotification } from '../../entities/restock-notification.entity';
import { RestockNotificationController } from './restock-notification.controller';
import { RestockNotificationService } from './restock-notification.service';
import { SmsModule } from '../../services/sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([RestockNotification]), SmsModule],
  controllers: [RestockNotificationController],
  providers: [RestockNotificationService],
  exports: [RestockNotificationService],
})
export class RestockNotificationModule {}
