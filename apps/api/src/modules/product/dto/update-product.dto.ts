import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { SLUG_PATTERN } from '../../article/dto/create-article-category.dto';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'iPhone 16 Pro Max' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({ example: 'iphone-16-pro-max', description: 'URL-safe slug' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false, description: 'Set to false to hide product from public listing' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
