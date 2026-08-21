import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param,
  ParseFilePipe, ParseUUIDPipe, Patch, Post, Query, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { ArticleCategoryService } from './article-category.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import { GetAdminArticlesDto } from './dto/get-articles.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { imageMulterOptions } from '../../common/config/multer.config';

@ApiTags('Admin — Articles')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: ArticleCategoryService,
  ) {}

  // ── Categories ─────────────────────────────────────────────────────────

  @Get('article-categories')
  @ApiOperation({ summary: 'List article categories' })
  listCategories() {
    return this.categoryService.listAll();
  }

  @Post('article-categories')
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateArticleCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch('article-categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete('article-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category (fails if it still has articles)' })
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }

  // ── Articles ───────────────────────────────────────────────────────────

  @Get('articles')
  @ApiOperation({ summary: 'List articles (drafts + published) with filters' })
  list(@Query() dto: GetAdminArticlesDto) {
    return this.articleService.listAdmin(dto);
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get an article by id' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.findById(id);
  }

  @Post('articles')
  @ApiOperation({ summary: 'Create article (draft unless publishedAt is set)' })
  create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: 'Update article' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, dto);
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete article (soft) and remove its uploaded media from MinIO',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.remove(id);
  }

  // ── Media (per-article) ────────────────────────────────────────────────

  @Post('articles/:id/media')
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt:  { type: 'string', description: 'Optional alt text for accessibility + SEO' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload an image for this article',
    description:
      'Saves the image to MinIO under `articles/<id>/...`, appends it to the article\'s `media` array, and returns the permanent public URL. Paste that URL directly into the article HTML body.',
  })
  uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
    @Body('alt') alt?: string,
  ) {
    return this.articleService.uploadMedia(id, file, alt);
  }

  @Delete('articles/:id/media')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove an uploaded image from this article (also deletes from MinIO)',
    description: 'Pass the MinIO `key` returned when the image was uploaded.',
  })
  deleteMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('key') key: string,
  ) {
    return this.articleService.deleteMedia(id, key);
  }
}
