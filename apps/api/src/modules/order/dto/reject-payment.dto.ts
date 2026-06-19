import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPaymentDto {
  @ApiProperty({ example: 'مبلغ واریزی مغایرت دارد', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
