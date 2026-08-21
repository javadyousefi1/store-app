import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Article } from './article.entity';

@Entity('article_categories')
export class ArticleCategory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'راهنمای انتخاب لباس' })
  @Column({ length: 120 })
  name: string;

  /** URL segment. Unique (partial index skips soft-deleted). */
  @ApiProperty({ example: 'style-guides' })
  @Column({ length: 160 })
  slug: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Public URL of the category cover image (unsigned, permanent). */
  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  @OneToMany(() => Article, (a) => a.category)
  articles: Article[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
