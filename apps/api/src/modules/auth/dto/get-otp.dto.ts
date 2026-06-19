import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetOtpDto {
  @ApiProperty({ example: '09128989900', description: 'Iranian mobile number in format 09XXXXXXXXX' })
  @IsString()
  @Matches(/^09[0-9]{9}$/, { message: 'شماره موبایل باید با فرمت 09XXXXXXXXX وارد شود' })
  phone: string;
}
