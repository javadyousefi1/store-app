import {
  Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { QuoteShippingDto } from './dto/quote-shipping.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Get('states')
  @ApiOperation({
    summary: 'List Iranian provinces (from Cod24 reference data).',
    description: 'Public. Cached ~7 days.',
  })
  listStates() {
    return this.service.listStates();
  }

  @Get('cities')
  @ApiOperation({
    summary: 'List cities for a province.',
    description: 'Public. `stateCode` comes from GET /shipping/states → postCode.',
  })
  listCities(@Query('stateCode', ParseIntPipe) stateCode: number) {
    return this.service.listCities(stateCode);
  }

  @Post('quote')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Quote postage for the signed-in shopper\'s current cart.',
    description:
      'Uses server-side cart + variant prices — the client can only pick the city, ' +
      'not fake the totals. Returns Toman.',
  })
  quote(@CurrentUser('id') userId: string, @Body() dto: QuoteShippingDto) {
    return this.service.quoteForUserCart(userId, dto.cityCode);
  }
}
