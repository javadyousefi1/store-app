import {
  Body,
  Controller,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { imageMulterOptions } from '../../common/config/multer.config';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { PaymentService } from './payment.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unified pay-click: create order and (if online) initiate gateway',
    description:
      'Single entry point for both payment methods.\n' +
      '- `card_to_card` → response has `{ order }`; upload receipt via POST /payments/:orderId/receipt.\n' +
      '- `online_gateway` → response has `{ order, redirectUrl, authority, gatewayName }`; redirect the browser to `redirectUrl`. If the gateway rejects our request the order is cancelled and stock is released.',
  })
  @ApiResponse({ status: 400, description: 'Cart empty, stock unavailable, or gateway rejected the request.' })
  async checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentService.checkout(userId, dto);
  }

  @Post(':orderId/receipt')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload card-to-card receipt image' })
  @ApiResponse({ status: 400, description: 'Order is not in pending_payment status or is not a card_to_card order.' })
  uploadReceipt(
    @CurrentUser('id') userId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.paymentService.uploadReceipt(userId, orderId, file);
  }

  /**
   * Called by the storefront after the shopper returns from the gateway
   * (WEB_URL/payment/callback?Authority=…&Status=OK|NOK). The storefront
   * shows a loading state and calls this endpoint. Response is JSON with
   * the final outcome — no redirect. Public (no auth): the authority
   * itself is a gateway-issued secret bound to a specific payment.
   */
  @Post('verify')
  @ApiOperation({
    summary: 'Verify a gateway payment (called from the storefront callback page)',
    description:
      'Idempotent — repeated calls for a payment already in a terminal state return the same outcome without touching state.',
  })
  @ApiResponse({ status: 404, description: 'No payment matches the given authority.' })
  async verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verify(dto);
  }
}
