import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min,
} from 'class-validator';

export class GetPublicArticlesDto {
  @ApiPropertyOptional({ description: 'Filter by category slug' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Return articles that feature this product' })
  @IsOptional()
  @IsUUID()
  featuredProductId?: string;

  @ApiPropertyOptional({ description: 'Free-text search across title/excerpt' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}

export class GetAdminArticlesDto extends GetPublicArticlesDto {
  @ApiPropertyOptional({ enum: ['published', 'draft'] })
  @IsOptional()
  @IsString()
  status?: 'published' | 'draft';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
