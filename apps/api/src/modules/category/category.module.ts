import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product]), MediaModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
