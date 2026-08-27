import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { SLUG_PATTERN } from '../../article/dto/create-article-category.dto';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'electronics', description: 'URL-safe slug — this becomes /categories/<slug>' })
  @IsString()
  @Length(2, 160)
  @Matches(SLUG_PATTERN, { message: 'slug باید حروف/اعداد و - باشد (بدون فاصله)' })
  slug: string;
}
