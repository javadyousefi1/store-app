import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { OrderService } from '../order/order.service';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { VerifyPaymentDto, VerifyPaymentStatus } from './dto/verify-payment.dto';
import { PaymentGatewayRegistry } from '../payment-gateway/payment-gateway.registry';
import { StorageService } from '../../services/storage/storage.service';
import { SmsService } from '../../services/sms/sms.service';
import { RestockNotificationService } from '../restock-notification/restock-notification.service';

/** How long an INITIATED online-gateway payment can sit before we auto-cancel and release stock. */
export const ONLINE_PAYMENT_TIMEOUT_MINUTES = 20;

export interface CheckoutResult {
  order: Order;
  /** Present only for online_gateway checkouts. */
  redirectUrl?: string;
  /** Present only for online_gateway checkouts. */
  authority?: string;
  /** Which provider handled this checkout (online_gateway only). */
  gatewayName?: string;
}

export interface VerifyResult {
  status: 'success' | 'failed';
  orderId: string;
  paymentId: string;
  refId: string | null;
  gatewayCode: number | null;
  gatewayMessage: string | null;
}

/**
 * Central payment lifecycle service. Every payment side effect — creation,
 * gateway roundtrip, receipt upload, admin approval, expiry sweep — flows
 * through here. Order ↔ Payment is strictly 1:1 in this flow: a failed
 * payment is terminal for both records and a retry means a brand-new
 * (Order, Payment) pair.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly registry: PaymentGatewayRegistry,
    private readonly orderService: OrderService,
    private readonly storageService: StorageService,
    private readonly smsService: SmsService,
    private readonly restockService: RestockNotificationService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  // ── Checkout ────────────────────────────────────────────────────────────

  /**
   * Unified pay-click entry point. Creates the order (reserving stock),
   * then either:
   *   - card_to_card:    returns the order, shopper uploads a receipt next.
   *   - online_gateway:  initiates the gateway session and returns a
   *                      redirectUrl. If the gateway rejects our request the
   *                      order is rolled back and stock released, so we never
   *                      leave dangling reservations.
   */
  async checkout(userId: string, dto: CreateOrderDto): Promise<CheckoutResult> {
    // Validate the gateway slug up front so cart validation + order creation
    // don't run for nothing when the client picked an unknown provider.
    if (dto.paymentMethod === PaymentMethod.ONLINE_GATEWAY) {
      this.registry.resolveByOptionalSlug(dto.gatewayName);
    }

    const order = await this.orderService.createOrder(userId, dto);

    if (dto.paymentMethod === PaymentMethod.CARD_TO_CARD) {
      return { order };
    }

    try {
      const { redirectUrl, authority, gatewayName } = await this.initiateFor(order, dto.gatewayName);
      return { order, redirectUrl, authority, gatewayName };
    } catch (err) {
      // Roll back the order so reserved stock is released. Swallow rollback
      // errors — we still want to surface the ORIGINAL gateway failure.
      await this.orderService.cancelOrder(userId, order.id).catch((rollbackErr) => {
        this.logger.error(
          `Failed to rollback order ${order.id} after gateway initiate failure: ${rollbackErr?.message ?? rollbackErr}`,
        );
      });
      throw err;
    }
  }

  // ── Verify (frontend → backend after gateway callback) ──────────────────

  /**
   * Called by the storefront's `/payment/callback` page after the shopper
   * returns from the gateway. Contract:
   *   - status="OK"  → verify with the provider. code 100 = captured; code
   *     101 = idempotent success (already verified previously); anything
   *     else = fail.
   *   - status="NOK" → shopper aborted or bank declined. DO NOT verify.
   *
   * State transitions run inside a transaction with a row lock on the
   * payment so a duplicate call (double-click, tab replay) can never
   * double-fulfill or double-release stock.
   */
  async verify(dto: VerifyPaymentDto): Promise<VerifyResult> {
    if (!dto.authority) throw new BadRequestException('authority is required');

    // We capture the notification payload inside the transaction so we can
    // fire the SMS *after* commit — never for a rolled-back order.
    let notifyPayload: { phone: string; trackingNumber: string } | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      // Authority is gateway-issued and effectively globally unique, so a
      // single-column lookup gives us both the payment AND the provider slug
      // it was initiated on — no need to trust a client-supplied gatewayName.
      const payment = await manager
        .createQueryBuilder(Payment, 'p')
        .where('p.authority = :a', { a: dto.authority })
        .setLock('pessimistic_write')
        .getOne();

      if (!payment) throw new NotFoundException('Payment not found for this authority');
      if (!payment.gatewayName) {
        throw new BadRequestException('Payment has no gateway associated — not verifiable');
      }

      const provider = this.registry.resolveBySlug(payment.gatewayName);

      const order = await manager.findOne(Order, {
        where: { id: payment.orderId },
        relations: ['items', 'user'],
      });
      if (!order) throw new NotFoundException('Order not found');

      // Already-terminal payment — return the last outcome without touching state.
      if (payment.status === PaymentStatus.CONFIRMED) {
        return this.buildVerifyResult('success', order, payment);
      }
      if (
        payment.status === PaymentStatus.FAILED ||
        payment.status === PaymentStatus.REJECTED
      ) {
        return this.buildVerifyResult('failed', order, payment);
      }

      // NOK: shopper cancelled or the bank declined. Do NOT call verify —
      // ZarinPal docs explicitly forbid it. Fail + cancel the order.
      if (dto.status !== VerifyPaymentStatus.OK) {
        await this.failAndCancel(manager, order, payment, 'shopper aborted (Status=NOK)');
        return this.buildVerifyResult('failed', order, payment);
      }

      // OK: verify with the provider. amount MUST match what we sent originally.
      const amount = this.toGatewayAmount(order.totalAmount);
      const result = await provider.verifyPayment({ authority: dto.authority, amount });

      payment.gatewayCode    = result.gatewayCode;
      payment.gatewayMessage = result.gatewayMessage;

      if (!result.success) {
        await this.failAndCancel(manager, order, payment, result.gatewayMessage);
        return this.buildVerifyResult('failed', order, payment);
      }

      payment.refId    = result.refId ?? null;
      payment.cardPan  = result.cardPan ?? null;
      payment.cardHash = result.cardHash ?? null;
      payment.fee      = result.fee ?? payment.fee;
      payment.feeType  = result.feeType ?? payment.feeType;
      payment.paidAt   = new Date();
      payment.status   = PaymentStatus.CONFIRMED;
      await manager.save(payment);

      if (order.status !== OrderStatus.CONFIRMED) {
        await this.fulfillOrder(manager, order);
      }

      // Payment just transitioned to CONFIRMED (idempotent replays return
      // early at line above and never reach here). Queue the notification
      // for after-commit. Ships order.orderNumber — same value the shopper
      // sees on the order page — NOT refId (which is a bank-side ref).
      if (order.user?.phone) {
        notifyPayload = {
          phone: order.user.phone,
          trackingNumber: order.orderNumber,
        };
      }

      this.logger.log(
        `[${provider.slug}] verified order=${order.id} refId=${payment.refId} alreadyVerified=${result.alreadyVerified}`,
      );

      return this.buildVerifyResult('success', order, payment);
    });

    if (notifyPayload) {
      this.notifyOrderCreated(notifyPayload.phone, notifyPayload.trackingNumber);
    }

    return result;
  }

  // ── Card-to-card: shopper uploads receipt ───────────────────────────────

  async uploadReceipt(
    userId: string,
    orderId: string,
    file: Express.Multer.File,
  ): Promise<Payment> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['payment', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.payment?.method !== PaymentMethod.CARD_TO_CARD) {
      throw new BadRequestException('Receipt upload is only supported for card_to_card orders');
    }
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

    // Notify the shopper — fire-and-forget so a Kavenegar hiccup doesn't
    // fail an otherwise-successful upload. Ships order.orderNumber (same
    // value shown on the order page).
    this.notifyOrderCreated(order.user?.phone, order.orderNumber);

    return order.payment;
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  async adminConfirm(orderId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'payment', 'user'],
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.payment?.method !== PaymentMethod.CARD_TO_CARD) {
        throw new BadRequestException('Only card_to_card payments require admin confirmation');
      }
      if (order.status !== OrderStatus.PAYMENT_UPLOADED) {
        throw new BadRequestException('Order is not awaiting payment confirmation');
      }

      await this.fulfillOrder(manager, order);
      order.payment.status = PaymentStatus.CONFIRMED;
      order.payment.paidAt = new Date();
      await manager.save(order.payment);

      await this.orderService.attachItemImageUrls(order);
      return order;
    });
  }

  async adminReject(orderId: string, dto: RejectPaymentDto): Promise<Order> {
    const order = await this.dataSource.transaction(async (manager) => {
      const o = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'payment', 'user'],
      });
      if (!o) throw new NotFoundException('Order not found');
      if (o.payment?.method !== PaymentMethod.CARD_TO_CARD) {
        throw new BadRequestException('Only card_to_card payments can be rejected here');
      }
      if (o.status !== OrderStatus.PAYMENT_UPLOADED) {
        throw new BadRequestException('Order is not awaiting payment confirmation');
      }

      await this.releaseReservations(manager, o.items);

      o.payment.status = PaymentStatus.REJECTED;
      if (dto.adminNote) o.payment.adminNote = dto.adminNote;
      await manager.save(o.payment);

      o.status = OrderStatus.CANCELLED;
      await manager.save(o);

      await this.orderService.attachItemImageUrls(o);
      return o;
    });

    const variantIds = [...new Set(order.items.map((i) => i.variantId).filter(Boolean))];
    variantIds.forEach((id) => this.restockService.checkAndNotify(id).catch(() => {}));

    return order;
  }

  // ── Expiry sweep ────────────────────────────────────────────────────────

  /**
   * Called by PaymentExpiryService on a timer. Cancels online-gateway
   * payments that were initiated but never verified within the window —
   * the shopper closed the tab, the gateway page timed out, etc. Runs
   * one transaction per stale payment so a single locked row doesn't
   * block the whole sweep.
   */
  async expireStalePayments(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - ONLINE_PAYMENT_TIMEOUT_MINUTES * 60_000);

    const stale = await this.paymentRepo.find({
      where: {
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.INITIATED,
        initiatedAt: LessThan(cutoff),
      },
      select: ['id'],
      take: 100,
    });

    if (!stale.length) return 0;

    let expired = 0;
    for (const { id } of stale) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const payment = await manager
            .createQueryBuilder(Payment, 'p')
            .where('p.id = :id', { id })
            .setLock('pessimistic_write')
            .getOne();

          // Someone (verify callback) may have won the race and moved this
          // payment to a terminal state between our SELECT and the lock.
          if (!payment || payment.status !== PaymentStatus.INITIATED) return;
          if (!payment.initiatedAt || payment.initiatedAt >= cutoff) return;

          const order = await manager.findOne(Order, {
            where: { id: payment.orderId },
            relations: ['items'],
          });
          if (!order) return;

          await this.failAndCancel(
            manager,
            order,
            payment,
            `expired after ${ONLINE_PAYMENT_TIMEOUT_MINUTES} minutes without verification`,
          );
          expired++;
        });
      } catch (err: any) {
        this.logger.error(`Failed to expire payment ${id}: ${err?.message ?? err}`);
      }
    }

    if (expired > 0) {
      this.logger.log(`Expired ${expired} stale online-gateway payment(s)`);
    }
    return expired;
  }

  // ── Private: gateway initiate ───────────────────────────────────────────

  private async initiateFor(
    order: Order,
    requestedSlug: string | undefined,
  ): Promise<{ redirectUrl: string; authority: string; gatewayName: string }> {
    const payment = order.payment;
    if (!payment) throw new BadRequestException('Order has no payment record');

    const provider = this.registry.resolveByOptionalSlug(requestedSlug);
    const amount   = this.toGatewayAmount(order.totalAmount);

    if (amount <= 0) {
      throw new BadRequestException('Order total is zero — no gateway charge needed');
    }

    const created = await provider.createPayment({
      orderId: order.id,
      amount,
      description: this.buildDescription(order),
      callbackUrl: this.buildCallbackUrl(),
      metadata: {
        mobile: order.user?.phone,
        orderId: order.id,
      },
    });

    payment.gatewayName    = provider.slug;
    payment.authority      = created.authority;
    payment.status         = PaymentStatus.INITIATED;
    payment.initiatedAt    = new Date();
    payment.fee            = created.fee ?? null;
    payment.feeType        = created.feeType ?? null;
    payment.gatewayCode    = created.gatewayCode;
    payment.gatewayMessage = created.gatewayMessage ?? null;

    await this.paymentRepo.save(payment);

    this.logger.log(
      `[${provider.slug}] initiated order=${order.id} authority=${created.authority} amount=${amount}`,
    );

    return { redirectUrl: created.redirectUrl, authority: created.authority, gatewayName: provider.slug };
  }

  // ── Private: state transitions ──────────────────────────────────────────

  private async fulfillOrder(manager: EntityManager, order: Order): Promise<void> {
    for (const item of order.items ?? []) {
      if (!item.variantId) continue;
      await manager.decrement(ProductVariant, { id: item.variantId }, 'stock',    item.quantity);
      await manager.decrement(ProductVariant, { id: item.variantId }, 'reserved', item.quantity);
    }
    order.status = OrderStatus.CONFIRMED;
    await manager.save(order);
  }

  private async failAndCancel(
    manager: EntityManager,
    order: Order,
    payment: Payment,
    reason: string,
  ): Promise<void> {
    payment.status         = PaymentStatus.FAILED;
    payment.gatewayMessage = reason;
    await manager.save(payment);

    await this.releaseReservations(manager, order.items ?? []);
    order.status = OrderStatus.CANCELLED;
    await manager.save(order);
  }

  private async releaseReservations(manager: EntityManager, items: OrderItem[]): Promise<void> {
    for (const item of items) {
      if (!item.variantId) continue;
      await manager.decrement(ProductVariant, { id: item.variantId }, 'reserved', item.quantity);
    }
  }

  // ── URL + amount helpers ────────────────────────────────────────────────

  private toGatewayAmount(total: number | string): number {
    // Order totals are decimals in Toman. Gateways want an integer.
    const n = Number(total);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n);
  }

  /**
   * Callback lands on the storefront (WEB_URL/payment/callback). The
   * storefront relays Authority + Status to POST /payments/verify — the
   * gateway never touches our backend directly.
   */
  private buildCallbackUrl(): string {
    const base = String(this.config.get<string>('webUrl') ?? '').replace(/\/+$/, '');
    return `${base}/payment/callback`;
  }

  private buildDescription(order: Order): string {
    return `پرداخت سفارش ${order.id}`;
  }

  private buildVerifyResult(
    status: 'success' | 'failed',
    order: Order,
    payment: Payment,
  ): VerifyResult {
    return {
      status,
      orderId: order.id,
      paymentId: payment.id,
      refId: payment.refId ?? null,
      gatewayCode: payment.gatewayCode ?? null,
      gatewayMessage: payment.gatewayMessage ?? null,
    };
  }

  /**
   * Fire-and-forget order-created SMS. Never blocks the caller and never
   * throws: a Kavenegar hiccup must not fail a payment we already saved.
   */
  private notifyOrderCreated(phone: string | null | undefined, trackingNumber: string): void {
    if (!phone) return;
    this.smsService.sendOrderCreated(phone, trackingNumber).catch((err) =>
      this.logger.warn(
        `order-created SMS failed phone=${phone} tracking=${trackingNumber}: ${err?.message ?? err}`,
      ),
    );
  }
}
