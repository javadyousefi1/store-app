import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { imageMulterOptions } from '../../common/config/multer.config';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List products', description: 'Paginated. Supports category, price, search, and sorting filters. Cover image returned as presigned URL.' })
  @ApiResponse({ status: 200, description: 'Paginated product list.' })
  findAll(@Query() dto: GetProductsDto) {
    return this.productService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product with variants and cover URL' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  // ── Admin — product CRUD ──────────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create product', description: '**Admin only.**' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update product', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete product', description: '**Admin only.**' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }

  // ── Admin — cover image ───────────────────────────────────────────────────

  @Post(':id/cover')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload / replace product cover image', description: '**Admin only.** Max 1MB. Replaces existing cover.' })
  @ApiResponse({ status: 201, description: 'Cover set.' })
  setCover(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productService.setCover(id, file);
  }

  @Post(':id/notify')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send Bale notification for product', description: '**Admin only.** Sends photo+caption to all bot subscribers. Sets notified=true on success.' })
  @ApiResponse({ status: 200, schema: { example: { notified: true } } })
  notifyProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.notifyProduct(id);
  }

  @Delete(':id/cover')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove product cover image', description: '**Admin only.** Hard deletes from MinIO and DB.' })
  removeCover(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.removeCover(id);
  }

  // ── Admin — variants ──────────────────────────────────────────────────────

  @Post(':productId/variants')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add variant', description: '**Admin only.** Attributes validated against AttributeOption table.' })
  @ApiResponse({ status: 400, description: 'Invalid attribute options.' })
  @ApiResponse({ status: 409, description: 'Duplicate variant attributes.' })
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productService.createVariant(productId, dto);
  }

  @Patch(':productId/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update variant', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  updateVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productService.updateVariant(productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete variant', description: '**Admin only.**' })
  removeVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.productService.removeVariant(productId, variantId);
  }

  // ── Admin — variant images ────────────────────────────────────────────────

  @Get(':productId/variants/:variantId/images')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get variant images with presigned URLs' })
  getVariantImages(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.productService.getVariantImages(productId, variantId);
  }

  @Post(':productId/variants/:variantId/images')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload image to variant', description: '**Admin only.** Max 1MB.' })
  addVariantImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productService.addVariantImage(productId, variantId, file);
  }

  @Delete(':productId/variants/:variantId/images/:mediaId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove variant image', description: '**Admin only.** Hard deletes from MinIO and DB.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  removeVariantImage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.productService.removeVariantImage(productId, variantId, mediaId);
  }
}
