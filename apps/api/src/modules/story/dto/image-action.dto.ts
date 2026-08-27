import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum StoryImageAction {
  PRESIGN = 'presign',
  CONFIRM = 'confirm',
  REMOVE = 'remove',
}

export class StoryImageActionDto {
  @ApiProperty({ enum: StoryImageAction })
  @IsEnum(StoryImageAction)
  action: StoryImageAction;

  @ApiPropertyOptional({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @ValidateIf((o) => o.action === StoryImageAction.PRESIGN)
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimeType?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.action === StoryImageAction.CONFIRM)
  @IsString()
  mediaKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}
