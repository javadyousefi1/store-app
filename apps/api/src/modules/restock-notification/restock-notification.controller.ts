import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestockNotificationService } from './restock-notification.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Restock Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('variants/:variantId/notify-me')
export class RestockNotificationController {
  constructor(private readonly service: RestockNotificationService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register to be notified when variant is back in stock' })
  register(
    @CurrentUser('id') userId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.service.register(userId, variantId);
  }

  @Get()
  @ApiOperation({ summary: 'Check if current user is registered for this variant' })
  isRegistered(
    @CurrentUser('id') userId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.service.isRegistered(userId, variantId).then((registered) => ({ registered }));
  }
}
