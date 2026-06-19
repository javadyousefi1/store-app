import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ali', description: 'First name (Persian or English letters only)' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد' })
  @Matches(/^[؀-ۿa-zA-Z\s]+$/, { message: 'نام فقط شامل حروف فارسی یا انگلیسی است' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mohammadi', description: 'Last name (Persian or English letters only)' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد' })
  @Matches(/^[؀-ۿa-zA-Z\s]+$/, { message: 'نام خانوادگی فقط شامل حروف فارسی یا انگلیسی است' })
  lastName?: string;
}
