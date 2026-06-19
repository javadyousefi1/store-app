import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Admin — Orders')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard, RateLimitGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @RateLimit({ ttl: 60, limit: 120, keyPrefix: 'rl:admin:orders:list' })
  @ApiOperation({ summary: 'List all orders. Filter by status.', description: '**Admin only.**' })
  getAllOrders(@Query() dto: GetOrdersDto) {
    return this.orderService.getAllOrders(dto);
  }

  @Get(':id')
  @RateLimit({ ttl: 60, limit: 120, keyPrefix: 'rl:admin:orders:get' })
  @ApiOperation({ summary: 'Get order detail with receipt presigned URL', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  getOrder(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.orderService.getOrder(orderId);
  }

  @Patch(':id/confirm')
  @RateLimit({ ttl: 60, limit: 20, keyPrefix: 'rl:admin:orders:confirm' })
  @ApiOperation({ summary: 'Confirm payment — deducts stock', description: '**Admin only.**' })
  @ApiResponse({ status: 400, description: 'Order is not in payment_uploaded status.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  confirmPayment(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.orderService.confirmPayment(orderId);
  }

  @Patch(':id/reject')
  @RateLimit({ ttl: 60, limit: 20, keyPrefix: 'rl:admin:orders:reject' })
  @ApiOperation({ summary: 'Reject payment — cancels order and releases reserved stock', description: '**Admin only.**' })
  @ApiResponse({ status: 400, description: 'Order is not in payment_uploaded status.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  rejectPayment(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: RejectPaymentDto,
  ) {
    return this.orderService.rejectPayment(orderId, dto);
  }
}
