import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum ImageAction {
  PRESIGN = 'presign',
  CONFIRM = 'confirm',
  REMOVE = 'remove',
}

export enum ImageVariant {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

export class SliderImageActionDto {
  @ApiProperty({ enum: ImageAction })
  @IsEnum(ImageAction)
  action: ImageAction;

  @ApiProperty({ enum: ImageVariant, description: 'Which slot to modify: desktop or mobile image.' })
  @IsEnum(ImageVariant)
  variant: ImageVariant;

  @ApiPropertyOptional({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @ValidateIf((o) => o.action === ImageAction.PRESIGN)
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.action === ImageAction.CONFIRM)
  @IsString()
  mediaKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}
