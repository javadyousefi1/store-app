import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateAttributeDto {
  @ApiProperty({ example: 'color', description: 'Unique attribute name' })
  @IsString()
  @Length(1, 100)
  name: string;
}
