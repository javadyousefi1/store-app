import {
  Controller, Delete, Get, Param, ParseUUIDPipe, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { GetMyOrdersDto } from './dto/get-orders.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List my orders' })
  getMyOrders(@CurrentUser('id') userId: string, @Query() dto: GetMyOrdersDto) {
    return this.orderService.getMyOrders(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my order detail' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  getMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.getMyOrder(userId, orderId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel my pending_payment order' })
  @ApiResponse({ status: 400, description: 'Order is not in pending_payment status.' })
  cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.cancelOrder(userId, orderId);
  }
}
