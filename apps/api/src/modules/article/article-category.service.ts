import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ArticleCategory } from '../../entities/article-category.entity';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';

@Injectable()
export class ArticleCategoryService {
  constructor(
    @InjectRepository(ArticleCategory) private readonly repo: Repository<ArticleCategory>,
  ) {}

  /** All categories, newest first — used by admin panel and category picker. */
  listAll(): Promise<ArticleCategory[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findBySlug(slug: string): Promise<ArticleCategory> {
    const category = await this.repo.findOne({ where: { slug } });
    if (!category) throw new NotFoundException('Article category not found');
    return category;
  }

  async findById(id: string): Promise<ArticleCategory> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Article category not found');
    return category;
  }

  async create(dto: CreateArticleCategoryDto): Promise<ArticleCategory> {
    await this.assertSlugFree(dto.slug);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateArticleCategoryDto): Promise<ArticleCategory> {
    const category = await this.findById(id);
    if (dto.slug && dto.slug !== category.slug) {
      await this.assertSlugFree(dto.slug);
    }
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    // TypeORM's soft delete — Article FK is RESTRICT so this fails cleanly
    // if the category still has articles.
    await this.repo.softDelete(id);
  }

  private async assertSlugFree(slug: string): Promise<void> {
    const exists = await this.repo.findOne({
      where: { slug, deletedAt: IsNull() },
      select: ['id'],
    });
    if (exists) throw new BadRequestException(`دسته‌بندی با slug «${slug}» قبلاً وجود دارد`);
  }
}
