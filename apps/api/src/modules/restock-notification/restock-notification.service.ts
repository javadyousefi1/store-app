import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RestockNotification } from '../../entities/restock-notification.entity';
import { SmsService } from '../../services/sms/sms.service';

interface ClaimedRow {
  phone: string;
  slug: string;
  name: string;
}

@Injectable()
export class RestockNotificationService {
  private readonly logger = new Logger(RestockNotificationService.name);

  constructor(
    @InjectRepository(RestockNotification)
    private repo: Repository<RestockNotification>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  async register(userId: string, variantId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, variantId } });
    if (existing) {
      if (existing.notifiedAt === null) throw new ConflictException('Already registered for this variant');
      // Previously notified — allow re-registration (subscribe again the
      // next time the variant sells out and restocks).
      await this.repo.update(existing.id, { notifiedAt: null });
      return;
    }
    await this.repo.save(this.repo.create({ userId, variantId }));
  }

  async cancel(userId: string, variantId: string): Promise<void> {
    await this.repo.delete({ userId, variantId });
  }

  async isRegistered(userId: string, variantId: string): Promise<boolean> {
    return this.repo.exists({ where: { userId, variantId, notifiedAt: null } });
  }

  /**
   * Called whenever a variant's available quantity might have grown
   * (admin bumped stock, order got cancelled, coupon refund, etc).
   *
   * Flow:
   *  1. Fast-path: bail out if the variant still has zero available.
   *  2. Atomic claim + fetch — a single `UPDATE ... RETURNING` picks
   *     every unnotified subscription, stamps `notifiedAt = NOW()`,
   *     and returns the phone + product slug/name needed to compose
   *     the SMS. This is the race-safe part: two concurrent calls
   *     for the same variant can't hand the same shopper the same
   *     SMS twice, because the second call's UPDATE finds no rows
   *     with `notifiedAt IS NULL` to claim.
   *  3. Fire the SMS per-user via Kavenegar — non-blocking, one
   *     failure per shopper doesn't hurt the others. If the SMS
   *     dispatch itself fails we log and move on; we deliberately do
   *     NOT revert `notifiedAt` because a retry loop is out of scope
   *     and would re-notify anyone whose SMS actually landed.
   */
  async checkAndNotify(variantId: string): Promise<void> {
    // 1) Cheap availability probe — no reason to lock the notifications
    // table if the variant is still oversold.
    const [avail] = await this.dataSource.query<{ available: number }[]>(
      `SELECT (stock - reserved) AS available
       FROM product_variants
       WHERE id = $1 AND "deletedAt" IS NULL`,
      [variantId],
    );
    if (!avail || Number(avail.available) <= 0) return;

    // 2) Claim + fetch in a single statement. Joining users +
    // product_variants + products inside the UPDATE gives us both the
    // atomic claim AND the data needed for the SMS body in one round
    // trip, and naturally excludes rows where the user was soft-deleted
    // or the underlying product/variant vanished.
    const claimed: ClaimedRow[] = await this.dataSource.query(
      `UPDATE restock_notifications rn
       SET "notifiedAt" = NOW()
       FROM users u, product_variants pv, products p
       WHERE rn."variantId" = $1
         AND rn."notifiedAt" IS NULL
         AND u.id = rn."userId"
         AND u."deletedAt" IS NULL
         AND pv.id = rn."variantId"
         AND pv."deletedAt" IS NULL
         AND p.id = pv."productId"
         AND p."deletedAt" IS NULL
       RETURNING u.phone, p.slug, p.name`,
      [variantId],
    );

    if (!claimed.length) return;

    // 3) Send SMS per shopper. `webUrl` is the public storefront
    // origin — with the product slug this yields the exact PDP URL
    // the SMS should link to.
    const webUrl = this.config.get<string>('webUrl') ?? '';
    const base = webUrl.replace(/\/$/, '');

    let sent = 0;
    for (const row of claimed) {
      const productUrl = `${base}/products/${encodeURIComponent(row.slug)}`;
      try {
        await this.sms.sendRestockNotification(row.phone, productUrl);
        sent++;
      } catch (err: any) {
        this.logger.warn(
          `restock SMS failed for ${row.phone} (variant=${variantId}): ${err?.message ?? err}`,
        );
      }
    }

    this.logger.log(
      `Restock notifications for variant ${variantId}: claimed=${claimed.length} sent=${sent}`,
    );
  }
}
