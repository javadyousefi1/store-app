import {
  Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
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

  // ── Cod24 shipment lifecycle — one endpoint per Cod24 step ──────────────

  @Post(':id/shipment/create')
  @ApiOperation({
    summary: 'Register the Cod24 shipment (addOrder)',
    description: '**Admin only.** Cod24 returns a `serial` we persist on the order.',
  })
  createShipment(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.orderService.createShipment(orderId);
  }

  @Post(':id/shipment/confirm')
  @ApiOperation({
    summary: 'Mark shipment ready-to-send (suspendOrder)',
    description: '**Admin only.** Requires the shipment to already have a Cod24 serial.',
  })
  confirmShipment(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.orderService.confirmShipment(orderId);
  }

  @Post(':id/shipment/barcode')
  @ApiOperation({
    summary: 'Fetch the post-office barcode (getBarcodes)',
    description: '**Admin only.** Persists postBarcode and marks shipment BARCODED.',
  })
  fetchShipmentBarcode(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.orderService.fetchShipmentBarcode(orderId);
  }
}
