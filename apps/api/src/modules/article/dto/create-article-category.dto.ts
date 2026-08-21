import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsUrl, Length, Matches, MaxLength,
} from 'class-validator';

/**
 * Slug must be URL-safe. We allow both ASCII (`style-guides`) and Persian
 * (`راهنماها`) since Google indexes both cleanly. Spaces and most punctuation
 * are rejected — the value goes straight into the URL.
 */
export const SLUG_PATTERN = /^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/i;

export class CreateArticleCategoryDto {
  @ApiProperty({ example: 'راهنمای انتخاب لباس' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'style-guides', description: 'URL-safe slug' })
  @IsString()
  @Length(2, 160)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Public URL of the cover image (get one via POST /admin/articles/media/upload)' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverUrl?: string;
}
