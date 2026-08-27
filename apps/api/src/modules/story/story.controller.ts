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
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { StoryImageActionDto } from './dto/image-action.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Story')
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  @ApiOperation({ summary: 'List active stories (public)' })
  findAllActive() {
    return this.storyService.findAllActive();
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all stories (admin)' })
  findAllAdmin() {
    return this.storyService.findAllAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create story' })
  create(@Body() dto: CreateStoryDto) {
    return this.storyService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update story' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStoryDto) {
    return this.storyService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete story' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storyService.remove(id);
  }

  @Post(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manage story image',
    description:
      'Action-typed endpoint. `presign` → returns upload URL. `confirm` → finalises upload. `remove` → drops image.',
  })
  image(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StoryImageActionDto) {
    return this.storyService.handleImageAction(id, dto);
  }
}
