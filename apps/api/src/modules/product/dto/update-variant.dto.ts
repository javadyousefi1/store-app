import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateVariantDto {
  @ApiPropertyOptional({ example: 'IPH-16P-BLK-512' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sku?: string;

  @ApiPropertyOptional({ example: 69900000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: { color: 'white', storage: '512GB' },
    description: 'Each key/value must exist in AttributeOption table',
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}
