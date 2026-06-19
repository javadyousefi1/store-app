import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttributeOptionService } from './attribute-option.service';
import { CreateAttributeOptionDto } from './dto/create-attribute-option.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Attribute Options')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('attribute-options')
export class AttributeOptionController {
  constructor(private readonly service: AttributeOptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all attribute options', description: '**Admin only.**' })
  @ApiResponse({ status: 200, description: 'List of attribute options.' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create attribute option', description: '**Admin only.**' })
  @ApiResponse({ status: 201, description: 'Attribute option created.' })
  create(@Body() dto: CreateAttributeOptionDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete attribute option', description: '**Admin only.**' })
  @ApiResponse({ status: 200, description: 'Attribute option deleted.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
