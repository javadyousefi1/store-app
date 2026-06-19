import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BankCardDto {
  @ApiProperty({ example: 'بانک ملت' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: 'علی احمدی' })
  @IsString()
  accountHolder: string;

  @ApiProperty({ example: '6104337812345678', description: '16 digits, no spaces' })
  @IsString()
  @Matches(/^\d{16}$/, { message: 'cardNumber must be exactly 16 digits' })
  cardNumber: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  tokenBaleBot?: string;

  @ApiProperty({ required: false, nullable: true, type: BankCardDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankCardDto)
  bankCard?: BankCardDto | null;
}
