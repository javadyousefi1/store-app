import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOneOrFail(id: string): Promise<Category> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOneOrFail(id);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);

    const productCount = await this.productRepo.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category. It has ${productCount} active product(s) assigned to it.`,
      );
    }

    await this.repo.softDelete(id);
  }
}
