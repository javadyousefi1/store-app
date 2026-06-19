import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateAttributeOptionDto {
  @ApiProperty({ example: 'color', description: 'Attribute key' })
  @IsString()
  @Length(1, 100)
  attribute: string;

  @ApiProperty({ example: 'red', description: 'Attribute value' })
  @IsString()
  @Length(1, 200)
  value: string;
}
