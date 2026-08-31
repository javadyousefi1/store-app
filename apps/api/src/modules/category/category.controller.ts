import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CoverActionDto } from './dto/cover-action.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories', description: 'Returns categories with a public (non-signed) `coverUrl` when a cover is set. Pass `isActive=true` to return only active categories.' })
  @ApiResponse({ status: 200, description: 'List of categories.' })
  findAll(@Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean) {
    return this.categoryService.findAll(isActive);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get category by slug — SEO storefront lookup', description: 'Public endpoint. Returns the same shape as the list endpoint items.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create category', description: '**Admin only.**' })
  @ApiResponse({ status: 201, description: 'Category created.' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category', description: '**Admin only.**' })
  @ApiResponse({ status: 200, description: 'Category updated.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete category', description: '**Admin only.**' })
  @ApiResponse({ status: 200, description: 'Category deleted.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }

  // ── Cover image (single endpoint, action-typed) ──────────────────────────

  @Post(':id/cover')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manage category cover image',
    description:
      '**Admin only.** Single endpoint for cover lifecycle. Pass `action`:\n\n' +
      '- `presign` (+ `mimeType`) → returns `{ mediaKey, uploadUrl, expiresIn, requiredHeaders }`. PUT the file to `uploadUrl` with the listed headers, then call again with `action=confirm`.\n' +
      '- `confirm` (+ `mediaKey`) → finalises the upload. If a cover already exists it is replaced and the old object deleted.\n' +
      '- `remove` → deletes the current cover.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Shape depends on `action`. `presign` → `{ mediaKey, uploadUrl, expiresIn, requiredHeaders }`. `confirm` → updated category with `coverUrl`. `remove` → `{ removed: true }`.',
  })
  @ApiResponse({ status: 400, description: 'Invalid payload, mime type, or mediaKey.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 422, description: 'On confirm: uploaded object not found on storage.' })
  cover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CoverActionDto,
  ) {
    return this.categoryService.handleCoverAction(id, dto);
  }
}
