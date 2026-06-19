import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Mobile Phones' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
}
