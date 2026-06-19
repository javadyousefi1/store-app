import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAttributeValueDto {
  @ApiProperty({ example: 'red' })
  @IsString()
  @Length(1, 200)
  value: string;

  @ApiProperty({ example: 'قرمز', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  label?: string;
}
