import {
  BadRequestException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { DeliveryType, Order, OrderStatus, ShipmentStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Product } from '../../entities/product.entity';
import { Media } from '../../entities/media.entity';
import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { StorageService } from '../../services/storage/storage.service';
import { CartLine, CouponService } from '../coupon/coupon.service';
import { CouponScopeType } from '../../entities/coupon.entity';
import { paginate } from '../../common/helpers/paginate.helper';
import { PaginateResult } from '../../common/interfaces/paginate-result.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto, GetMyOrdersDto } from './dto/get-orders.dto';
import { Cod24Service } from '../../services/cod24/cod24.service';
import { Cod24CartonType } from '../../services/cod24/cod24.constants';

/**
 * Rough per-item shipping defaults. We don't (yet) track per-variant weight
 * or carton size, so pick a size that covers typical apparel — one shirt or
 * a folded manto — and let admin override later if a category needs more.
 */
const SHIPPING_DEFAULTS = {
  weightGramsPerUnit: 500,
  cartonType: Cod24CartonType.SIZE_3,
  contentFa: 'پوشاک',
  /** Origin (shop) city code — Tehran. */
  sourceCityCode: 1,
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private storageService: StorageService,
    private couponService: CouponService,
    private readonly cod24: Cod24Service,
  ) {}

  // ── User ──────────────────────────────────────────────────────────────────

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { userId },
        relations: ['items'],
      });
      if (!cart?.items?.length) throw new BadRequestException('Cart is empty');

      const variantIds = cart.items.map((i) => i.variantId);

      // Pessimistic lock to prevent race conditions on stock reservation
      const variants = await manager
        .createQueryBuilder(ProductVariant, 'v')
        .where('v.id IN (:...ids)', { ids: variantIds })
        .setLock('pessimistic_write')
        .getMany();

      // Collect all unavailable items before throwing
      const unavailable: string[] = [];
      for (const item of cart.items) {
        const v = variants.find((v) => v.id === item.variantId);
        if (!v || v.stock - v.reserved < item.quantity) {
          unavailable.push(v ? `${v.sku} (available: ${v.stock - v.reserved})` : item.variantId);
        }
      }
      if (unavailable.length > 0) {
        throw new BadRequestException(`Insufficient stock for: ${unavailable.join(', ')}`);
      }

      // Snapshot first image key for each variant
      const firstImageIds = variants
        .filter((v) => v.imageIds?.length > 0)
        .map((v) => ({ variantId: v.id, mediaId: v.imageIds[0] }));
      const mediaList = firstImageIds.length
        ? await manager.find(Media, { where: { id: In(firstImageIds.map((x) => x.mediaId)) } })
        : [];
      const mediaKeyMap = new Map(mediaList.map((m) => [m.id, m.key]));
      const variantImageKeyMap = new Map(
        firstImageIds.map((x) => [x.variantId, mediaKeyMap.get(x.mediaId) ?? null]),
      );

      // Load product names for snapshot
      const productIds = [...new Set(variants.map((v) => v.productId))];
      const products = await manager
        .createQueryBuilder(Product, 'p')
        .where('p.id IN (:...ids)', { ids: productIds })
        .getMany();
      const productMap = new Map(products.map((p) => [p.id, p]));

      const subtotalAmount = cart.items.reduce((sum, item) => {
        const v = variants.find((v) => v.id === item.variantId)!;
        return sum + Number(v.price) * item.quantity;
      }, 0);

      let discountAmount = 0;
      let couponId: string | null = null;
      let couponSnapshot: Order['couponSnapshot'] = null;

      if (dto.couponCode?.trim()) {
        const lines: CartLine[] = cart.items.map((item) => {
          const v = variants.find((v) => v.id === item.variantId)!;
          return {
            variantId: item.variantId,
            productId: v.productId,
            categoryId: productMap.get(v.productId)?.categoryId ?? '',
            price: Number(v.price),
            quantity: item.quantity,
          };
        });

        const applied = await this.couponService.applyForOrder(
          manager,
          userId,
          dto.couponCode.trim(),
          lines,
        );

        discountAmount = applied.discountAmount;
        couponId = applied.coupon.id;
        couponSnapshot = {
          id: applied.coupon.id,
          code: applied.coupon.code,
          percentage: applied.coupon.percentage,
          maxDiscountAmount: Number(applied.coupon.maxDiscountAmount),
          scope: {
            type: applied.coupon.scopeType === CouponScopeType.PRODUCT ? 'product' : 'category',
            id: applied.coupon.scopeId,
          },
          eligibleItemIds: applied.eligibleVariantIds,
          computedDiscountAmount: applied.discountAmount,
        };
      }

      const goodsAmount = subtotalAmount - discountAmount;

      // ── Shipping quote for iran_post ────────────────────────────────
      let shippingCost = 0;
      let shipmentStatus: ShipmentStatus | null = null;
      if (dto.deliveryType === DeliveryType.IRAN_POST) {
        if (!dto.cityCode) {
          throw new BadRequestException('cityCode is required for iran_post');
        }
        const totalItemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        const totalWeightGrams = totalItemCount * SHIPPING_DEFAULTS.weightGramsPerUnit;

        try {
          const quote = await this.cod24.quotePostage({
            cityCode: dto.cityCode,
            sourceCityCode: SHIPPING_DEFAULTS.sourceCityCode,
            weightGrams: totalWeightGrams,
            productPriceRial: goodsAmount,
            cartonType: SHIPPING_DEFAULTS.cartonType,
          });
          shippingCost = quote.totalRial;
          shipmentStatus = ShipmentStatus.PENDING;
        } catch (err: any) {
          this.logger.error(`shipping quote failed for city=${dto.cityCode}: ${err?.message ?? err}`);
          throw new BadRequestException('محاسبه هزینه ارسال با خطا مواجه شد. لطفاً بعداً تلاش کنید.');
        }
      }

      const totalAmount = goodsAmount + shippingCost;
      const orderNumber = await this.generateUniqueOrderNumber(manager);

      const { couponCode: _omit, ...orderFields } = dto;
      const order = await manager.save(
        manager.create(Order, {
          userId,
          ...orderFields,
          orderNumber,
          subtotalAmount,
          discountAmount,
          shippingCost,
          totalAmount,
          couponId,
          couponSnapshot,
          shipmentStatus,
          status: OrderStatus.PENDING_PAYMENT,
        }),
      );

      if (couponId) {
        await this.couponService.recordRedemption(manager, couponId, userId, order.id);
      }

      await manager.save(
        cart.items.map((item) => {
          const v = variants.find((v) => v.id === item.variantId)!;
          return manager.create(OrderItem, {
            orderId: order.id,
            variantId: item.variantId,
            productName: productMap.get(v.productId)?.name ?? 'Unknown',
            variantSku: v.sku,
            variantAttributes: v.attributes,
            price: v.price,
            quantity: item.quantity,
            variantImageKey: variantImageKeyMap.get(item.variantId) ?? null,
          });
        }),
      );

      // Reserve stock for each variant
      for (const item of cart.items) {
        await manager.increment(ProductVariant, { id: item.variantId }, 'reserved', item.quantity);
      }

      await manager.save(
        manager.create(Payment, {
          orderId: order.id,
          method: dto.paymentMethod,
          status: PaymentStatus.PENDING,
        }),
      );

      // Reset cart immediately
      await manager.delete(CartItem, { cartId: cart.id });
      await manager.delete(Cart, { id: cart.id });

      const created = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'payment', 'user'],
      });
      await this.attachItemImageUrls(created);
      return created;
    });
  }

  async getMyOrders(userId: string, dto: GetMyOrdersDto): Promise<PaginateResult<Order>> {
    const result = await paginate(this.orderRepo, dto.page, dto.limit, {
      where: { userId },
      relations: ['items', 'payment', 'user'],
      order: { createdAt: 'DESC' },
    });
    await Promise.all(result.data.map((o) => this.attachItemImageUrls(o)));
    return result;
  }

  async getMyOrder(userId: string, orderId: string): Promise<Order & { receiptUrl?: string }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'payment', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // Presign the receipt so shoppers can see the card_to_card image they
    // uploaded (support asks "did my receipt actually upload?" a lot).
    const result = order as Order & { receiptUrl?: string };
    if (order.payment?.receiptKey) {
      result.receiptUrl = await this.storageService.presignedGetUrl(order.payment.receiptKey);
    }
    await this.attachItemImageUrls(order);
    return result;
  }

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, userId },
        relations: ['items'],
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException('Only orders awaiting payment can be cancelled');
      }

      await this.releaseReservations(manager, order.items);

      order.status = OrderStatus.CANCELLED;
      await manager.save(order);
    });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAllOrders(dto: GetOrdersDto): Promise<PaginateResult<Order>> {
    const search = dto.search?.trim();

    // Fast path: no free-text search — reuse the standard helper.
    if (!search) {
      return paginate(this.orderRepo, dto.page, dto.limit, {
        where: dto.status ? { status: dto.status } : {},
        relations: ['items', 'payment', 'user'],
        order: { createdAt: 'DESC' },
      });
    }

    // Search path: hand-rolled QueryBuilder so we can OR across an order
    // column (orderNumber, firstName, lastName) AND the joined user's phone.
    // ILIKE is Postgres-specific — matches the rest of this codebase.
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payment', 'payment')
      .leftJoinAndSelect('o.user', 'user')
      .where(
        `(o."orderNumber" ILIKE :q
          OR o."firstName" ILIKE :q
          OR o."lastName"  ILIKE :q
          OR user.phone    ILIKE :q)`,
        { q: `%${search}%` },
      )
      .orderBy('o.createdAt', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    if (dto.status) qb.andWhere('o.status = :status', { status: dto.status });

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  async getOrder(orderId: string): Promise<Order & { receiptUrl?: string }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'payment', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const result = order as Order & { receiptUrl?: string };
    if (order.payment?.receiptKey) {
      result.receiptUrl = await this.storageService.presignedGetUrl(order.payment.receiptKey);
    }
    await this.attachItemImageUrls(order);
    return result;
  }

  // ── Shipment (Cod24) — admin-triggered lifecycle ─────────────────────────
  //
  // Flow the admin runs from the panel:
  //   1. createShipment    → Cod24 addOrder     → get serial (status=CREATED)
  //   2. confirmShipment   → Cod24 suspendOrder → status=READY
  //   3. fetchShipmentBarcode → Cod24 getBarcodes → post barcode (status=BARCODED)

  async createShipment(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryType !== DeliveryType.IRAN_POST) {
      throw new BadRequestException('Order is not an iran_post delivery');
    }
    if (order.shipmentSerial) {
      return order; // already created
    }
    if (!order.cityCode || !order.mobile) {
      throw new BadRequestException('Order missing shipping recipient info');
    }

    const totalItemCount = (order.items ?? []).reduce((sum, i) => sum + i.quantity, 0);
    const totalWeightGrams = totalItemCount * SHIPPING_DEFAULTS.weightGramsPerUnit;

    try {
      const result = await this.cod24.createOrder({
        externalOrderId: order.orderNumber,
        recipient: {
          firstName: order.firstName,
          lastName: order.lastName,
          mobile: order.mobile,
          postalCode: order.postalCode,
          nationalCode: order.nationalCode ?? '',
          address: order.address,
          cityCode: order.cityCode,
        },
        totalWeightGrams,
        finalPayAmountCustomerRial: Number(order.totalAmount),
        contentsFa: SHIPPING_DEFAULTS.contentFa,
        products: (order.items ?? []).map((item) => ({
          externalId: item.id,
          name: item.productName,
          weightGrams: SHIPPING_DEFAULTS.weightGramsPerUnit,
          count: item.quantity,
          finalPayAmountRial: Number(item.price) * item.quantity,
        })),
        cartonType: SHIPPING_DEFAULTS.cartonType,
        description: order.note ?? undefined,
      });

      order.shipmentSerial = String(result.serial);
      order.shipmentStatus = ShipmentStatus.CREATED;
      return this.orderRepo.save(order);
    } catch (err: any) {
      this.logger.error(`cod24 createOrder failed order=${order.id}: ${err?.message ?? err}`);
      order.shipmentStatus = ShipmentStatus.FAILED;
      await this.orderRepo.save(order);
      throw err;
    }
  }

  /** Move Cod24 shipment to "ready to send" (suspendOrder). */
  async confirmShipment(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.shipmentSerial) {
      throw new BadRequestException('Shipment has not been created yet');
    }

    const [result] = await this.cod24.confirmOrder([
      { serial: Number(order.shipmentSerial), externalOrderId: order.orderNumber },
    ]);
    if (!result?.isSuccess) {
      throw new BadRequestException(result?.message ?? 'cod24 suspendOrder failed');
    }

    order.shipmentStatus = ShipmentStatus.READY;
    return this.orderRepo.save(order);
  }

  /** Fetch the post-office barcode for a ready shipment (getBarcodes). */
  async fetchShipmentBarcode(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.shipmentSerial) {
      throw new BadRequestException('Shipment has not been created yet');
    }

    const [result] = await this.cod24.getBarcodes([
      { serial: Number(order.shipmentSerial), externalOrderId: order.orderNumber },
    ]);
    if (!result?.isSuccess || !result.postBarcode) {
      throw new BadRequestException(result?.message ?? 'cod24 getBarcodes returned no barcode yet');
    }

    order.shipmentPostBarcode = result.postBarcode;
    order.shipmentStatus = ShipmentStatus.BARCODED;
    return this.orderRepo.save(order);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async attachItemImageUrls(order: Order): Promise<void> {
    if (!order?.items?.length) return;
    await Promise.all(
      order.items.map(async (item) => {
        (item as any).variantImageUrl = item.variantImageKey
          ? await this.storageService.presignedGetUrl(item.variantImageKey)
          : null;
      }),
    );
  }

  private async releaseReservations(manager: EntityManager, items: OrderItem[]): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await manager.decrement(ProductVariant, { id: item.variantId }, 'reserved', item.quantity);
      }
    }
  }

  /**
   * 8-digit shopper-facing order number. Random within the 10_000_000-
   * 99_999_999 range, retried on the rare DB collision. Runs inside the
   * caller's transaction so a concurrent insert can't sneak the same
   * number in between our check and our own insert.
   */
  private async generateUniqueOrderNumber(manager: EntityManager): Promise<string> {
    const MAX_ATTEMPTS = 20;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const n = Math.floor(10_000_000 + Math.random() * 90_000_000).toString();
      const exists = await manager.findOne(Order, {
        where: { orderNumber: n },
        select: ['id'],
      });
      if (!exists) return n;
    }
    // 20 collisions in an 8-digit space (~90M slots) means either the DB
    // is unreasonably full or Math.random is misbehaving — either way,
    // fail loudly.
    throw new Error('Failed to generate a unique orderNumber after 20 attempts');
  }
}
