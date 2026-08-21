import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Coupon, CouponScopeType } from '../../entities/coupon.entity';
import { CouponRedemption } from '../../entities/coupon-redemption.entity';
import { Cart } from '../../entities/cart.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { paginate } from '../../common/helpers/paginate.helper';
import { PaginateResult } from '../../common/interfaces/paginate-result.interface';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

export interface CartLine {
  variantId: string;
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

export interface QuoteResult {
  valid: boolean;
  reason?: string;
  code?: string;
  percentage?: number;
  maxDiscountAmount?: number;
  subtotal?: number;
  discountAmount?: number;
  total?: number;
  eligibleVariantIds?: string[];
}

export interface AppliedCoupon {
  coupon: Coupon;
  subtotal: number;
  discountAmount: number;
  total: number;
  eligibleVariantIds: string[];
}

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponRedemption) private redemptionRepo: Repository<CouponRedemption>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  // ── Admin (back-office) ──────────────────────────────────────────────────

  async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.couponRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Coupon code "${code}" already exists`);
    }

    await this.assertScopeExists(dto.scopeType, dto.scopeId);

    return this.couponRepo.save(
      this.couponRepo.create({
        ...dto,
        code,
        isActive: dto.isActive ?? true,
        usedCount: 0,
      }),
    );
  }

  async listCoupons(page: number, limit: number, isActive?: boolean): Promise<PaginateResult<Coupon>> {
    return paginate(this.couponRepo, page, limit, {
      where: isActive !== undefined ? { isActive } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async getCoupon(id: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.getCoupon(id);

    if (dto.quantity !== undefined && dto.quantity < coupon.usedCount) {
      throw new BadRequestException(
        `quantity (${dto.quantity}) cannot be less than usedCount (${coupon.usedCount})`,
      );
    }

    Object.assign(coupon, dto);
    return this.couponRepo.save(coupon);
  }

  // ── Storefront (quote) ───────────────────────────────────────────────────

  async quoteForUser(userId: string, rawCode: string): Promise<QuoteResult> {
    const code = rawCode.toUpperCase().trim();
    const coupon = await this.couponRepo.findOne({ where: { code } });
    if (!coupon) return { valid: false, reason: 'کد تخفیف پیدا نشد' };

    const baseInvalid = await this.preflightChecks(coupon, userId);
    if (baseInvalid) return baseInvalid;

    const lines = await this.loadUserCartLines(userId);
    if (!lines.length) return { valid: false, reason: 'سبد خرید خالی است' };

    return this.computeQuote(coupon, lines);
  }

  // ── Order integration (called from OrderService inside its tx) ───────────

  /**
   * Validates + applies a coupon to a list of cart lines atomically.
   *
   * Caller is responsible for:
   *  - running this inside a transaction (pass the manager)
   *  - persisting the returned snapshot/discount/subtotal on the order
   *  - passing the resulting orderId into `recordRedemption` after the order row is saved
   */
  async applyForOrder(
    manager: EntityManager,
    userId: string,
    rawCode: string,
    lines: CartLine[],
  ): Promise<AppliedCoupon> {
    const code = rawCode.toUpperCase().trim();

    const coupon = await manager.findOne(Coupon, { where: { code } });
    if (!coupon) throw new BadRequestException('کد تخفیف پیدا نشد');

    const invalid = await this.preflightChecks(coupon, userId, manager);
    if (invalid) throw new BadRequestException(invalid.reason);

    const result = this.computeQuote(coupon, lines);
    if (!result.valid) throw new BadRequestException(result.reason);

    // Atomic seat reservation: only succeeds if seats remain AND coupon is still active.
    const update = await manager
      .createQueryBuilder()
      .update(Coupon)
      .set({ usedCount: () => '"usedCount" + 1' })
      .where('id = :id AND "usedCount" < quantity AND "isActive" = true', { id: coupon.id })
      .execute();
    if (update.affected === 0) {
      throw new ConflictException('کد تخفیف در همین لحظه به اتمام رسید');
    }

    coupon.usedCount += 1;

    return {
      coupon,
      subtotal: result.subtotal!,
      discountAmount: result.discountAmount!,
      total: result.total!,
      eligibleVariantIds: result.eligibleVariantIds!,
    };
  }

  async recordRedemption(
    manager: EntityManager,
    couponId: string,
    userId: string,
    orderId: string,
  ): Promise<void> {
    try {
      await manager.save(
        manager.create(CouponRedemption, { couponId, userId, orderId }),
      );
    } catch (err: any) {
      // Unique (couponId, userId) — would only fire on a race the preflight didn't catch.
      if (err?.code === '23505') {
        throw new ConflictException('این کد قبلاً توسط شما استفاده شده است');
      }
      throw err;
    }
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async preflightChecks(
    coupon: Coupon,
    userId: string,
    manager?: EntityManager,
  ): Promise<QuoteResult | null> {
    if (!coupon.isActive) return { valid: false, reason: 'کد تخفیف غیرفعال است' };
    if (coupon.usedCount >= coupon.quantity) {
      return { valid: false, reason: 'ظرفیت کد تخفیف به اتمام رسیده است' };
    }

    const repo = manager ? manager.getRepository(CouponRedemption) : this.redemptionRepo;
    const already = await repo.findOne({ where: { couponId: coupon.id, userId } });
    if (already) return { valid: false, reason: 'این کد قبلاً توسط شما استفاده شده است' };

    return null;
  }

  private computeQuote(coupon: Coupon, lines: CartLine[]): QuoteResult {
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

    const eligible = lines.filter((l) =>
      coupon.scopeType === CouponScopeType.PRODUCT
        ? l.productId === coupon.scopeId
        : l.categoryId === coupon.scopeId,
    );

    if (!eligible.length) {
      return { valid: false, reason: 'هیچ کالای مشمول این کد در سبد نیست' };
    }

    const eligibleBase = eligible.reduce((s, l) => s + l.price * l.quantity, 0);
    const rawDiscount = Math.floor((eligibleBase * coupon.percentage) / 100);
    const discountAmount = Math.min(rawDiscount, Number(coupon.maxDiscountAmount));

    return {
      valid: true,
      code: coupon.code,
      percentage: coupon.percentage,
      maxDiscountAmount: Number(coupon.maxDiscountAmount),
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
      eligibleVariantIds: eligible.map((l) => l.variantId),
    };
  }

  private async loadUserCartLines(userId: string): Promise<CartLine[]> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
    if (!cart?.items?.length) return [];

    return cart.items
      .filter((i) => i.variant && i.variant.product)
      .map((i) => ({
        variantId: i.variantId,
        productId: i.variant.productId,
        categoryId: i.variant.product.categoryId,
        price: Number(i.variant.price),
        quantity: i.quantity,
      }));
  }

  private async assertScopeExists(scopeType: CouponScopeType, scopeId: string): Promise<void> {
    if (scopeType === CouponScopeType.PRODUCT) {
      const product = await this.productRepo.findOne({ where: { id: scopeId } });
      if (!product) throw new NotFoundException('محصول مرتبط با اسکوپ پیدا نشد');
    } else {
      const category = await this.categoryRepo.findOne({ where: { id: scopeId } });
      if (!category) throw new NotFoundException('دسته‌بندی مرتبط با اسکوپ پیدا نشد');
    }
  }
}
