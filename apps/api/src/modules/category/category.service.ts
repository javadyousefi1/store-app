import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CoverAction, CoverActionDto } from './dto/cover-action.dto';
import { MediaService, PresignedUpload } from '../media/media.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private mediaService: MediaService,
  ) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.repo.find({
      order: { name: 'ASC' },
      relations: ['cover'],
    });
    return Promise.all(categories.map((c) => this.attachCoverUrl(c)));
  }

  async findOneOrFail(id: string): Promise<Category> {
    const category = await this.repo.findOne({ where: { id }, relations: ['cover'] });
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

  // ── Cover image (action-dispatched) ───────────────────────────────────────

  async handleCoverAction(
    id: string,
    dto: CoverActionDto,
  ): Promise<PresignedUpload | Category | { removed: true }> {
    switch (dto.action) {
      case CoverAction.PRESIGN:
        return this.presignCover(id, dto.mimeType!);
      case CoverAction.CONFIRM:
        return this.confirmCover(id, dto.mediaKey!, dto.originalName);
      case CoverAction.REMOVE:
        await this.removeCover(id);
        return { removed: true };
    }
  }

  private async presignCover(id: string, mimeType: string): Promise<PresignedUpload> {
    await this.findOneOrFail(id);
    return this.mediaService.presignImageUpload(`categories/${id}/cover`, mimeType);
  }

  private async confirmCover(id: string, mediaKey: string, originalName?: string): Promise<Category> {
    const category = await this.findOneOrFail(id);

    if (!mediaKey.startsWith(`categories/${id}/cover/`)) {
      throw new BadRequestException('mediaKey does not belong to this category');
    }

    const previousCoverId = category.coverId;
    const media = await this.mediaService.confirmImageUpload(mediaKey, originalName);

    category.coverId = media.id;
    category.cover = media;
    await this.repo.save(category);

    if (previousCoverId && previousCoverId !== media.id) {
      await this.mediaService.delete(previousCoverId).catch(() => {});
    }

    return this.attachCoverUrl(category);
  }

  private async removeCover(id: string): Promise<void> {
    const category = await this.findOneOrFail(id);
    if (!category.coverId) return;

    const oldId = category.coverId;
    category.coverId = null;
    category.cover = null;
    await this.repo.save(category);
    await this.mediaService.delete(oldId).catch(() => {});
  }

  private async attachCoverUrl(category: Category): Promise<Category> {
    if (category.cover) {
      (category as any).coverUrl = await this.mediaService.getUrl(category.cover);
    }
    return category;
  }
}
