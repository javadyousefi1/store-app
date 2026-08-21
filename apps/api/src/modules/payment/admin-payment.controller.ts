import {
  Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Admin — Payments')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard, RateLimitGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Patch(':orderId/confirm')
  @RateLimit({ ttl: 60, limit: 20, keyPrefix: 'rl:admin:payments:confirm' })
  @ApiOperation({
    summary: 'Confirm a card-to-card payment — deducts stock',
    description: '**Admin only.** Online-gateway payments are confirmed automatically by /payments/verify and cannot be confirmed here.',
  })
  @ApiResponse({ status: 400, description: 'Order is not awaiting card_to_card confirmation.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  confirm(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentService.adminConfirm(orderId);
  }

  @Patch(':orderId/reject')
  @RateLimit({ ttl: 60, limit: 20, keyPrefix: 'rl:admin:payments:reject' })
  @ApiOperation({
    summary: 'Reject a card-to-card payment — cancels order and releases stock',
    description: '**Admin only.**',
  })
  @ApiResponse({ status: 400, description: 'Order is not awaiting card_to_card confirmation.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  reject(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: RejectPaymentDto,
  ) {
    return this.paymentService.adminReject(orderId, dto);
  }
}
