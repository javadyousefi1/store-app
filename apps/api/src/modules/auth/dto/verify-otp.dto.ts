import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '09128989900', description: 'Iranian mobile number in format 09XXXXXXXXX' })
  @IsString()
  @Matches(/^09[0-9]{9}$/, { message: 'شماره موبایل باید با فرمت 09XXXXXXXXX وارد شود' })
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code received via SMS' })
  @IsString()
  @Length(6, 6, { message: 'کد OTP باید ۶ رقم باشد' })
  @Matches(/^[0-9]{6}$/, { message: 'کد OTP فقط شامل اعداد است' })
  otp: string;
}
