import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RestockNotification } from '../../entities/restock-notification.entity';

@Injectable()
export class RestockNotificationService {
  private readonly logger = new Logger(RestockNotificationService.name);

  constructor(
    @InjectRepository(RestockNotification)
    private repo: Repository<RestockNotification>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async register(userId: string, variantId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, variantId } });
    if (existing) {
      if (existing.notifiedAt === null) throw new ConflictException('Already registered for this variant');
      // previously notified — allow re-registration
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

  async checkAndNotify(variantId: string): Promise<void> {
    const [row] = await this.dataSource.query<{ available: number }[]>(
      `SELECT (stock - reserved) AS available
       FROM product_variants
       WHERE id = $1 AND "deletedAt" IS NULL`,
      [variantId],
    );

    if (!row || row.available <= 0) return;

    const pending = await this.dataSource.query<{ id: string; userId: string; phone: string }[]>(
      `SELECT rn.id, rn."userId", u.phone
       FROM restock_notifications rn
       JOIN users u ON u.id = rn."userId"
       WHERE rn."variantId" = $1
         AND rn."notifiedAt" IS NULL
         AND u."deletedAt" IS NULL`,
      [variantId],
    );

    if (!pending.length) return;

    for (const n of pending) {
      // TODO: replace with real SMS service
      this.logger.log(`[SMS] variant ${variantId} is back in stock — notify user ${n.userId} at ${n.phone}`);
    }

    const ids = pending.map((n) => n.id);
    await this.dataSource.query(
      `UPDATE restock_notifications SET "notifiedAt" = NOW() WHERE id = ANY($1::uuid[])`,
      [ids],
    );

    this.logger.log(`Restock notifications sent for variant ${variantId}: ${pending.length} user(s)`);
  }
}
