import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cart } from '../../entities/cart.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Cod24Service } from '../../services/cod24/cod24.service';
import { Cod24CartonType } from '../../services/cod24/cod24.constants';
import { Cod24City, Cod24State } from '../../services/cod24/cod24.types';

/** Same defaults as OrderService — keep them in sync. */
const SHIPPING_DEFAULTS = {
  weightGramsPerUnit: 500,
  cartonType: Cod24CartonType.SIZE_3,
  /** Origin (shop) city code — Tehran. */
  sourceCityCode: 1,
};

export interface ShippingQuote {
  /** Postage in Toman (Cod24 quotes Rial internally; we normalize). */
  shippingCost: number;
  /** Goods amount the quote was based on. */
  goodsAmount: number;
  /** Total weight in grams. */
  weightGrams: number;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
    private readonly cod24: Cod24Service,
  ) {}

  listStates(): Promise<Cod24State[]> {
    return this.cod24.listStates();
  }

  listCities(stateCode: number): Promise<Cod24City[]> {
    return this.cod24.listCities(stateCode);
  }

  async quoteForUserCart(userId: string, cityCode: number): Promise<ShippingQuote> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items'],
    });
    if (!cart?.items?.length) throw new BadRequestException('Cart is empty');

    const variants = await this.variantRepo.find({
      where: { id: In(cart.items.map((i) => i.variantId)) },
    });

    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const weightGrams = itemCount * SHIPPING_DEFAULTS.weightGramsPerUnit;
    const goodsAmount = cart.items.reduce((sum, item) => {
      const v = variants.find((v) => v.id === item.variantId);
      return sum + Number(v?.price ?? 0) * item.quantity;
    }, 0);

    // Cod24 works in Toman for us — send/receive Toman without conversion.
    const quote = await this.cod24.quotePostage({
      cityCode,
      sourceCityCode: SHIPPING_DEFAULTS.sourceCityCode,
      weightGrams,
      productPriceRial: goodsAmount,
      cartonType: SHIPPING_DEFAULTS.cartonType,
    });

    return {
      shippingCost: quote.totalRial,
      goodsAmount,
      weightGrams,
    };
  }
}
