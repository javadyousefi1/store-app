import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';
import { SLUG_PATTERN } from '../../article/dto/create-article-category.dto';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Mobile Phones' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({ example: 'mobile-phones', description: 'URL-safe slug — this becomes /categories/<slug>' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the category is visible on the storefront' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
