import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const PRODUCT_SORT_VALUES = [
  'newest',
  'price_asc',
  'price_desc',
] as const;

export type ProductSort = (typeof PRODUCT_SORT_VALUES)[number];

export class GetProductsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by one category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple category UUIDs, comma-separated',
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.filter(Boolean);
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ enum: PRODUCT_SORT_VALUES, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_VALUES)
  sort: ProductSort = 'newest';

  @ApiPropertyOptional({ minimum: 0, description: 'Minimum price in toman' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Maximum price in toman' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Search product name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
