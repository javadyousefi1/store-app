import {
  Body, Controller, DefaultValuePipe, Get, Param, ParseBoolPipe, ParseIntPipe, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Admin - Coupon')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/coupons')
export class AdminCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @ApiOperation({
    summary: 'Create coupon',
    description:
      '**Admin only.** `code` is normalised to upper-case and must be unique. `scopeId` must reference an existing product or category according to `scopeType`. All amounts in Toman.',
  })
  @ApiResponse({ status: 201, description: 'Coupon created.' })
  @ApiResponse({ status: 404, description: 'Scope product/category not found.' })
  @ApiResponse({ status: 409, description: 'Code already exists.' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiOperation({ summary: 'List coupons', description: '**Admin only.**' })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isActive', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    return this.couponService.listCoupons(page, limit, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Coupon not found.' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponService.getCoupon(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update coupon',
    description:
      '**Admin only.** `code`, `scopeType` and `scopeId` cannot be changed (they are part of every order snapshot). `quantity` must remain ≥ `usedCount`. Deletion is not supported — toggle `isActive=false` to retire a code.',
  })
  @ApiResponse({ status: 400, description: 'quantity below usedCount.' })
  @ApiResponse({ status: 404, description: 'Coupon not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.updateCoupon(id, dto);
  }
}
