import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class QuoteCouponDto {
  @ApiProperty({ example: 'SUMMER25' })
  @IsString()
  @Length(3, 64)
  code: string;
}
