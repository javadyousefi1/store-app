import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum CoverAction {
  PRESIGN = 'presign',
  CONFIRM = 'confirm',
  REMOVE = 'remove',
}

export class CoverActionDto {
  @ApiProperty({
    enum: CoverAction,
    description:
      '`presign` → returns a one-time upload URL. `confirm` → finalises a completed upload. `remove` → drops the existing cover.',
  })
  @IsEnum(CoverAction)
  action: CoverAction;

  @ApiPropertyOptional({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'Required when `action=presign`. Mime type of the file to be uploaded.',
  })
  @ValidateIf((o) => o.action === CoverAction.PRESIGN)
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType?: string;

  @ApiPropertyOptional({
    example: 'categories/3f0a.../cover/8e1b....jpg',
    description: 'Required when `action=confirm`. The `mediaKey` returned by the `presign` call.',
  })
  @ValidateIf((o) => o.action === CoverAction.CONFIRM)
  @IsString()
  mediaKey?: string;

  @ApiPropertyOptional({
    example: 'electronics-cover.jpg',
    description: 'Optional. Original file name, stored for reference only.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}
