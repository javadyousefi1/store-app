import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Product } from '../../entities/product.entity';
import { Media } from '../../entities/media.entity';
import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { StorageService } from '../../services/storage/storage.service';
import { MediaService } from '../media/media.service';
import { RestockNotificationService } from '../restock-notification/restock-notification.service';
import { paginate } from '../../common/helpers/paginate.helper';
import { PaginateResult } from '../../common/interfaces/paginate-result.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { GetOrdersDto, GetMyOrdersDto } from './dto/get-orders.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private storageService: StorageService,
    private mediaService: MediaService,
    private restockService: RestockNotificationService,
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

      const totalAmount = cart.items.reduce((sum, item) => {
        const v = variants.find((v) => v.id === item.variantId)!;
        return sum + Number(v.price) * item.quantity;
      }, 0);

      const order = await manager.save(
        manager.create(Order, { userId, ...dto, totalAmount, status: OrderStatus.PENDING_PAYMENT }),
      );

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

  async getMyOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'payment', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.attachItemImageUrls(order);
    return order;
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

  async uploadReceipt(
    userId: string,
    orderId: string,
    file: Express.Multer.File,
  ): Promise<Payment> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['payment'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Receipt can only be uploaded for pending_payment orders');
    }

    const key = `orders/${orderId}/receipts/${randomUUID()}${extname(file.originalname)}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    order.payment.receiptKey = key;
    order.payment.status = PaymentStatus.UPLOADED;
    await this.paymentRepo.save(order.payment);

    order.status = OrderStatus.PAYMENT_UPLOADED;
    await this.orderRepo.save(order);

    return order.payment;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAllOrders(dto: GetOrdersDto): Promise<PaginateResult<Order>> {
    return paginate(this.orderRepo, dto.page, dto.limit, {
      where: dto.status ? { status: dto.status } : {},
      relations: ['items', 'payment', 'user'],
      order: { createdAt: 'DESC' },
    });
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

  async confirmPayment(orderId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'payment', 'user'],
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PAYMENT_UPLOADED) {
        throw new BadRequestException('Order is not awaiting payment confirmation');
      }

      // Deduct stock and release reservation atomically
      for (const item of order.items) {
        if (item.variantId) {
          await manager.decrement(ProductVariant, { id: item.variantId }, 'stock', item.quantity);
          await manager.decrement(ProductVariant, { id: item.variantId }, 'reserved', item.quantity);
        }
      }

      order.payment.status = PaymentStatus.CONFIRMED;
      await manager.save(order.payment);

      order.status = OrderStatus.CONFIRMED;
      await manager.save(order);

      await this.attachItemImageUrls(order);
      return order;
    });
  }

  async rejectPayment(orderId: string, dto: RejectPaymentDto): Promise<Order> {
    const order = await this.dataSource.transaction(async (manager) => {
      const o = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'payment', 'user'],
      });
      if (!o) throw new NotFoundException('Order not found');
      if (o.status !== OrderStatus.PAYMENT_UPLOADED) {
        throw new BadRequestException('Order is not awaiting payment confirmation');
      }

      await this.releaseReservations(manager, o.items);

      o.payment.status = PaymentStatus.REJECTED;
      if (dto.adminNote) o.payment.adminNote = dto.adminNote;
      await manager.save(o.payment);

      o.status = OrderStatus.CANCELLED;
      await manager.save(o);

      await this.attachItemImageUrls(o);
      return o;
    });

    const variantIds = [...new Set(order.items.map((i) => i.variantId).filter(Boolean))];
    variantIds.forEach((id) => this.restockService.checkAndNotify(id).catch(() => {}));

    return order;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async attachItemImageUrls(order: Order): Promise<void> {
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
}
