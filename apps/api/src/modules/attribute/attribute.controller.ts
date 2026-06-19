import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttributeService } from './attribute.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Attributes')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('attributes')
export class AttributeController {
  constructor(private readonly service: AttributeService) {}

  @Get()
  @ApiOperation({ summary: 'List all attributes with their values', description: '**Admin only.**' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create attribute', description: '**Admin only.** Name must be unique.' })
  @ApiResponse({ status: 409, description: 'Attribute already exists.' })
  create(@Body() dto: CreateAttributeDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete attribute and all its values', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Attribute not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/values')
  @ApiOperation({ summary: 'Add value to attribute', description: '**Admin only.**' })
  @ApiResponse({ status: 409, description: 'Value already exists for this attribute.' })
  @ApiResponse({ status: 404, description: 'Attribute not found.' })
  addValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAttributeValueDto,
  ) {
    return this.service.addValue(id, dto);
  }

  @Delete(':id/values/:valueId')
  @ApiOperation({ summary: 'Soft delete a value', description: '**Admin only.**' })
  @ApiResponse({ status: 404, description: 'Value not found.' })
  removeValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
  ) {
    return this.service.removeValue(id, valueId);
  }
}
