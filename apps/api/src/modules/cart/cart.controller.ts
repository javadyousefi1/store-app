import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { SyncCartDto } from './dto/upsert-cart-item.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get my cart' })
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Sync cart',
    description: 'Replaces entire cart with the provided items. Send empty array to clear.',
  })
  @ApiResponse({ status: 200, description: 'Updated cart.' })
  @ApiResponse({ status: 404, description: 'One or more variants not found.' })
  syncCart(@CurrentUser() user: User, @Body() dto: SyncCartDto) {
    return this.cartService.syncCart(user.id, dto);
  }
}
