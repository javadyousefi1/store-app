import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { ArticleCategoryService } from './article-category.service';
import { GetPublicArticlesDto } from './dto/get-articles.dto';

/**
 * Public read-only surface for the blog. Everything here is intentionally
 * SEO-friendly: no auth, no cookies required, cacheable, indexable.
 */
@ApiTags('Articles')
@Controller()
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: ArticleCategoryService,
  ) {}

  @Get('articles')
  @ApiOperation({ summary: 'List published articles (paginated)' })
  list(@Query() dto: GetPublicArticlesDto) {
    return this.articleService.listPublished(dto);
  }

  @Get('articles/:slug')
  @ApiOperation({ summary: 'Get a single published article by slug' })
  bySlug(@Param('slug') slug: string) {
    return this.articleService.findPublishedBySlug(slug);
  }

  @Get('article-categories')
  @ApiOperation({ summary: 'List all article categories' })
  categories() {
    return this.categoryService.listAll();
  }

  @Get('article-categories/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  categoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }
}
