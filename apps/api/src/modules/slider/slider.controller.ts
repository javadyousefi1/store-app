import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SliderService } from './slider.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { SliderImageActionDto } from './dto/image-action.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Slider')
@Controller('sliders')
export class SliderController {
  constructor(private readonly sliderService: SliderService) {}

  @Get()
  @ApiOperation({ summary: 'List active sliders (public)' })
  findAllActive() {
    return this.sliderService.findAllActive();
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all sliders (admin)' })
  findAllAdmin() {
    return this.sliderService.findAllAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create slider' })
  create(@Body() dto: CreateSliderDto) {
    return this.sliderService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update slider' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSliderDto) {
    return this.sliderService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete slider' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sliderService.remove(id);
  }

  @Post(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manage slider image (desktop or mobile)',
    description:
      'Action-typed endpoint. `presign` → returns upload URL. `confirm` → finalises upload. `remove` → drops image.',
  })
  image(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SliderImageActionDto) {
    return this.sliderService.handleImageAction(id, dto);
  }
}
