import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Favorite } from '../../entities/favorite.entity';
import { Product } from '../../entities/product.entity';
import { MediaService } from '../media/media.service';

export interface FavoriteItem {
  favoriteId: string;
  productId: string;
  product: {
    id: string;
    slug: string;
    name: string;
    coverUrl: string | null;
  };
  createdAt: Date;
}

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite) private repo: Repository<Favorite>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private mediaService: MediaService,
  ) {}

  async add(userId: string, productId: string): Promise<Favorite> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ userId, productId }));
  }

  async remove(userId: string, productId: string): Promise<{ removed: boolean }> {
    const result = await this.repo.delete({ userId, productId });
    return { removed: (result.affected ?? 0) > 0 };
  }

  async list(userId: string): Promise<FavoriteItem[]> {
    const favorites = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!favorites.length) return [];

    const products = await this.productRepo.find({
      where: { id: In(favorites.map((f) => f.productId)) },
      relations: ['cover'],
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: FavoriteItem[] = [];
    for (const favorite of favorites) {
      const product = productMap.get(favorite.productId);
      if (!product) continue;

      items.push({
        favoriteId: favorite.id,
        productId: favorite.productId,
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          coverUrl: product.cover ? await this.mediaService.getUrl(product.cover) : null,
        },
        createdAt: favorite.createdAt,
      });
    }

    return items;
  }
}
