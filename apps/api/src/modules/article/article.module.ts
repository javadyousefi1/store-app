import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../../entities/article.entity';
import { ArticleCategory } from '../../entities/article-category.entity';
import { StorageModule } from '../../services/storage/storage.module';
import { MediaModule } from '../media/media.module';
import { ArticleService } from './article.service';
import { ArticleCategoryService } from './article-category.service';
import { ArticleController } from './article.controller';
import { AdminArticleController } from './admin-article.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleCategory]),
    StorageModule,
    MediaModule,
  ],
  controllers: [ArticleController, AdminArticleController],
  providers: [ArticleService, ArticleCategoryService],
  exports: [ArticleService, ArticleCategoryService],
})
export class ArticleModule {}
