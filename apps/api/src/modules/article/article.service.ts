import {
  BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, ILike, IsNull, Not, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Article, ArticleMediaItem } from '../../entities/article.entity';
import { ArticleCategory } from '../../entities/article-category.entity';
import { paginate } from '../../common/helpers/paginate.helper';
import { PaginateResult } from '../../common/interfaces/paginate-result.interface';
import { StorageService } from '../../services/storage/storage.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetAdminArticlesDto, GetPublicArticlesDto } from './dto/get-articles.dto';
import { ArticleCategoryService } from './article-category.service';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Rough words-per-minute for Persian reading. */
const READ_SPEED_WPM = 200;

@Injectable()
export class ArticleService implements OnModuleInit {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    @InjectRepository(Article) private readonly repo: Repository<Article>,
    private readonly categoryService: ArticleCategoryService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * On boot, make sure the `articles/*` prefix is anonymously readable —
   * article images are embedded in HTML that Google crawls; signed URLs
   * would 403 or expire. Idempotent, safe if the policy is already set.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.storageService.setPublicReadPrefix('articles');
    } catch (err: any) {
      this.logger.warn(
        `couldn't auto-configure MinIO public read for "articles/*" — set it manually with ` +
          `\`mc anonymous set download myminio/<bucket>/articles\`. reason: ${err?.message ?? err}`,
      );
    }
  }

  // ── Public (frontend) ──────────────────────────────────────────────────

  /** Published articles only, newest first. Optionally filtered by category or search. */
  async listPublished(dto: GetPublicArticlesDto): Promise<PaginateResult<Article>> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.category', 'c')
      .where('a.publishedAt IS NOT NULL')
      .andWhere('a.publishedAt <= NOW()')
      .orderBy('a.publishedAt', 'DESC');

    if (dto.categorySlug) {
      qb.andWhere('c.slug = :cSlug', { cSlug: dto.categorySlug });
    }
    if (dto.search?.trim()) {
      const q = `%${dto.search.trim()}%`;
      qb.andWhere(
        new Brackets((sub) =>
          sub
            .where('a.title ILIKE :q', { q })
            .orWhere('a.excerpt ILIKE :q', { q }),
        ),
      );
    }

    const [data, total] = await qb
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  async findPublishedBySlug(slug: string): Promise<Article> {
    const article = await this.repo.findOne({
      where: { slug, publishedAt: Not(IsNull()) },
      relations: ['category'],
    });
    if (!article) throw new NotFoundException('Article not found');
    // Fire-and-forget view count bump — never fails the read.
    this.repo.increment({ id: article.id }, 'viewCount', 1).catch(() => {});
    return article;
  }

  // ── Admin ──────────────────────────────────────────────────────────────

  async listAdmin(dto: GetAdminArticlesDto): Promise<PaginateResult<Article>> {
    const where: Record<string, unknown> = {};
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.status === 'published') where.publishedAt = Not(IsNull());
    if (dto.status === 'draft')     where.publishedAt = IsNull();
    if (dto.search?.trim()) where.title = ILike(`%${dto.search.trim()}%`);

    return paginate(this.repo, dto.page, dto.limit, {
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Article> {
    const article = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    await this.categoryService.findById(dto.categoryId); // 404 if bad
    await this.assertSlugFree(dto.slug);

    const article = this.repo.create({
      ...dto,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      readTimeMinutes: this.computeReadTime(dto.content),
      keywords: dto.keywords ?? [],
      media: [],
    });
    return this.repo.save(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.findById(id);

    if (dto.categoryId && dto.categoryId !== article.categoryId) {
      await this.categoryService.findById(dto.categoryId);
    }
    if (dto.slug && dto.slug !== article.slug) {
      await this.assertSlugFree(dto.slug);
    }

    Object.assign(article, {
      ...dto,
      publishedAt: dto.publishedAt !== undefined
        ? (dto.publishedAt ? new Date(dto.publishedAt) : null)
        : article.publishedAt,
    });
    if (dto.content !== undefined) {
      article.readTimeMinutes = this.computeReadTime(dto.content);
    }

    return this.repo.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findById(id);

    // Remove every uploaded media object from MinIO so we don't leak storage.
    await Promise.all(
      (article.media ?? []).map((m) =>
        this.storageService
          .delete(m.key)
          .catch((err) =>
            this.logger.warn(`failed to delete article media ${m.key}: ${err?.message ?? err}`),
          ),
      ),
    );

    await this.repo.softDelete(id);
  }

  // ── Media upload (attached to a specific article) ──────────────────────

  /**
   * Upload an image, put it in MinIO under `articles/<articleId>/...` (which
   * MUST be configured for public read in MinIO), append to `article.media`,
   * return the permanent public URL for the admin to paste into the HTML.
   */
  async uploadMedia(
    articleId: string,
    file: Express.Multer.File,
    alt?: string,
  ): Promise<ArticleMediaItem> {
    const article = await this.findById(articleId);

    if (!file) throw new BadRequestException('file is required');
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `فرمت پشتیبانی نمی‌شود. مجاز: ${[...ALLOWED_IMAGE_MIME].join(', ')}`,
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException(`حجم فایل نباید بیشتر از ${MAX_IMAGE_BYTES} بایت باشد`);
    }

    const key = `articles/${articleId}/${randomUUID()}${extname(file.originalname)}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);
    const url = this.storageService.publicUrl(key);

    const item: ArticleMediaItem = {
      key,
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      alt: alt?.trim() || null,
    };

    article.media = [...(article.media ?? []), item];
    await this.repo.save(article);

    return item;
  }

  /** Delete an uploaded media by MinIO key. Removes from the array + from S3. */
  async deleteMedia(articleId: string, key: string): Promise<void> {
    const article = await this.findById(articleId);
    const before = article.media?.length ?? 0;
    article.media = (article.media ?? []).filter((m) => m.key !== key);
    if (article.media.length === before) {
      throw new NotFoundException('Media not found on this article');
    }
    await this.storageService.delete(key).catch((err) =>
      this.logger.warn(`failed to delete article media ${key}: ${err?.message ?? err}`),
    );
    await this.repo.save(article);
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async assertSlugFree(slug: string): Promise<void> {
    const exists = await this.repo.findOne({
      where: { slug, deletedAt: IsNull() },
      select: ['id'],
    });
    if (exists) throw new BadRequestException(`مقاله با slug «${slug}» قبلاً وجود دارد`);
  }

  /**
   * Word-count based estimate. We strip HTML tags first — otherwise a
   * heavy media article would look artificially long.
   */
  private computeReadTime(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / READ_SPEED_WPM));
  }
}
