import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { MediaService } from '../media/media.service';
import { SyncCartDto } from './dto/upsert-cart-item.dto';

const CART_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    private mediaService: MediaService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getCart(userId: string): Promise<Cart | null> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.variant'],
    });

    if (!cart) return null;

    if (this.isExpired(cart)) {
      await this.cartRepo.delete(cart.id);
      return null;
    }

    await this.attachVariantImageUrls(cart);
    return cart;
  }

  async syncCart(userId: string, dto: SyncCartDto): Promise<Cart> {
    if (dto.items.length > 0) {
      const variantIds = dto.items.map((i) => i.variantId);
      const found = await this.variantRepo
        .createQueryBuilder('v')
        .where('v.id IN (:...ids)', { ids: variantIds })
        .getMany();

      const notFound = variantIds.filter((id) => !found.find((v) => v.id === id));
      if (notFound.length > 0) {
        throw new NotFoundException(`Variants not found: ${notFound.join(', ')}`);
      }

      for (const item of dto.items) {
        const variant = found.find((v) => v.id === item.variantId);
        const available = variant.stock - variant.reserved;
        if (item.quantity > available) {
          throw new BadRequestException(
            `Insufficient stock for variant ${variant.sku}: requested ${item.quantity}, available ${available}`,
          );
        }
      }
    }

    const cartId = await this.dataSource.transaction(async (manager) => {
      let cart = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .where('cart.userId = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!cart || this.isExpired(cart)) {
        if (cart) await manager.delete(Cart, cart.id);
        cart = await manager.save(Cart, manager.create(Cart, { userId }));
      }

      await manager.delete(CartItem, { cartId: cart.id });

      if (dto.items.length > 0) {
        await manager.save(
          CartItem,
          dto.items.map((item) =>
            manager.create(CartItem, {
              cartId: cart.id,
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          ),
        );
      }

      // Refresh TTL: measure 1-hour window from last sync, not cart creation
      await manager.update(Cart, cart.id, { updatedAt: new Date() });
      return cart.id;
    });

    const updated = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['items', 'items.variant'],
    });
    await this.attachVariantImageUrls(updated);
    return updated;
  }

  private isExpired(cart: Cart): boolean {
    return Date.now() - new Date(cart.updatedAt).getTime() > CART_TTL_MS;
  }

  private async attachVariantImageUrls(cart: Cart | null): Promise<void> {
    if (!cart?.items?.length) return;

    const allMediaIds = [
      ...new Set(cart.items.flatMap((item) => item.variant?.imageIds ?? [])),
    ];
    if (!allMediaIds.length) return;

    const mediaList = await this.mediaService.findManyByIds(allMediaIds);
    const urlMap = new Map(
      await Promise.all(mediaList.map(async (m) => [m.id, await this.mediaService.getUrl(m)] as [string, string])),
    );

    for (const item of cart.items) {
      if (item.variant) {
        (item.variant as any).imageUrls = (item.variant.imageIds ?? [])
          .map((id) => urlMap.get(id))
          .filter(Boolean);
      }
    }
  }
}
