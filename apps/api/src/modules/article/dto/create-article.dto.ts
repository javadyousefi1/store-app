import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString,
  IsUrl, IsUUID, Length, Matches, MaxLength,
} from 'class-validator';
import { SLUG_PATTERN } from './create-article-category.dto';

export class CreateArticleDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'how-to-choose-summer-manto', description: 'URL-safe slug — this becomes /articles/<slug>' })
  @IsString()
  @Length(2, 200)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug: string;

  @ApiProperty({ example: 'راهنمای انتخاب مانتوی تابستانی' })
  @IsString()
  @Length(2, 200)
  title: string;

  @ApiProperty({ example: 'در این مقاله راهنمای کاملی برای انتخاب مانتو تابستانی ارائه می‌دهیم.' })
  @IsString()
  @Length(20, 300)
  excerpt: string;

  @ApiProperty({ description: 'Raw HTML body of the article' })
  @IsString()
  @Length(50, 200_000)
  content: string;

  @ApiPropertyOptional({ description: 'Public URL for cover image' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'Alt text for cover — improves accessibility + image SEO' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  coverAlt?: string;

  @ApiPropertyOptional({ example: 'تیم الینا' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  authorName?: string;

  @ApiPropertyOptional({ description: 'SEO title override — falls back to `title` when omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description — falls back to `excerpt` when omitted' })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String], description: 'SEO keywords' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({
    description:
      'ISO timestamp. Present = published (visible on public endpoints). Omit for draft.',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
