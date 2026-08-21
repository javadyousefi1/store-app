import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { SLUG_PATTERN } from '../../article/dto/create-article-category.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'iPhone 16 Pro' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiProperty({ example: 'iphone-16-pro', description: 'URL-safe slug — this becomes /products/<slug>' })
  @IsString()
  @Length(2, 200)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug: string;

  @ApiPropertyOptional({ example: 'Latest Apple flagship smartphone.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
