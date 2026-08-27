import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn,
  ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleCategory } from './article-category.entity';
import { Product } from './product.entity';

/**
 * Item stored inside `Article.media` — one row per image the admin uploaded
 * to be embedded in the HTML body. The URL is a permanent public URL served
 * by the MinIO CDN, so it can be pasted straight into the article content
 * and remain valid indefinitely (Google can crawl it).
 */
export interface ArticleMediaItem {
  key: string;             // MinIO object key
  url: string;             // permanent public URL
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;      // ISO
  /** Optional alt text — copy this into the <img alt="..."> for SEO/accessibility. */
  alt?: string | null;
}

@Entity('articles')
@Index('IDX_articles_publishedAt', ['publishedAt'])
export class Article {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => ArticleCategory, (c) => c.articles, {
    onDelete: 'RESTRICT',
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category: ArticleCategory;

  /** URL segment. `/articles/<slug>` on the storefront. Unique. */
  @ApiProperty({ example: 'how-to-choose-summer-manto' })
  @Column({ length: 200 })
  slug: string;

  @ApiProperty({ example: 'راهنمای انتخاب مانتوی تابستانی' })
  @Column({ length: 200 })
  title: string;

  /**
   * Short summary shown in listings and used as the fallback for meta
   * description in the frontend when `metaDescription` is empty. Keep
   * under ~160 chars for the Google snippet.
   */
  @ApiProperty({ example: 'در این مقاله ...' })
  @Column({ length: 300 })
  excerpt: string;

  /** Raw HTML. Admin-authored, not sanitized (admin is trusted). */
  @ApiProperty()
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  /** Alt text for the cover — used in <img alt="..."> and OG image. */
  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 200, nullable: true })
  coverAlt: string | null;

  @ApiProperty({ example: 'تیم الینا' })
  @Column({ length: 120, default: 'تیم الینا' })
  authorName: string;

  /** SEO overrides — when null, frontend falls back to title/excerpt. */
  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 160, nullable: true })
  metaTitle: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 320, nullable: true })
  metaDescription: string | null;

  /** SEO keywords. Postgres text array. */
  @ApiProperty({ type: [String] })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  keywords: string[];

  /**
   * Every image the admin uploaded for this article. Cleanup on delete
   * removes these from MinIO too — no orphan objects.
   */
  @ApiProperty({ type: 'array' })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  media: ArticleMediaItem[];

  @ApiProperty()
  @Column({ type: 'int', default: 1 })
  readTimeMinutes: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  /** null = draft. Set to a date to publish (visible on public endpoints). */
  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  /**
   * Optional product recommendation embedded inside the article body.
   * Renders as an inline card at the end of the article and appears as
   * `mentions` in the BlogPosting JSON-LD (topical link Google reads
   * as a signal that this article is about this product).
   */
  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  featuredProductId: string | null;

  @ManyToOne(() => Product, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'featuredProductId' })
  featuredProduct: Product | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
