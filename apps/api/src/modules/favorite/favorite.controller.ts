import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorite')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({
    summary: 'List my favorite products',
    description:
      'Returns favorites for the authenticated user, newest first. Favorites whose underlying product no longer exists are silently skipped.',
  })
  @ApiResponse({ status: 200, description: 'Favorite list with product summary and `coverUrl`.' })
  list(@CurrentUser('id') userId: string) {
    return this.favoriteService.list(userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Add product to my favorites',
    description: 'Idempotent — adding the same productId twice returns the existing favorite.',
  })
  @ApiResponse({ status: 201, description: 'Favorite created (or existing one returned).' })
  add(@CurrentUser('id') userId: string, @Body() dto: AddFavoriteDto) {
    return this.favoriteService.add(userId, dto.productId);
  }

  @Delete(':productId')
  @ApiOperation({
    summary: 'Remove a product from my favorites',
    description: 'Returns `{ removed: false }` if it wasn\'t in favorites.',
  })
  @ApiResponse({ status: 200, schema: { example: { removed: true } } })
  remove(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.favoriteService.remove(userId, productId);
  }
}
