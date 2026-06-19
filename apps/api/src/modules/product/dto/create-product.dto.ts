import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'iPhone 16 Pro' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: 'Latest Apple flagship smartphone.' })
  @IsOptional()
  @IsString()
  description?: string;
}
