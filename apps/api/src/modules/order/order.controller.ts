import {
  Body, Controller, Delete, Get, Param, ParseFilePipe, ParseUUIDPipe,
  Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetMyOrdersDto } from './dto/get-orders.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { imageMulterOptions } from '../../common/config/multer.config';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Place an order from current cart' })
  @ApiResponse({ status: 400, description: 'Cart empty or insufficient stock.' })
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(userId, dto);
  }

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

  @Post(':id/receipt')
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload card-to-card receipt image' })
  @ApiResponse({ status: 400, description: 'Order is not in pending_payment status.' })
  uploadReceipt(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.orderService.uploadReceipt(userId, orderId, file);
  }
}
