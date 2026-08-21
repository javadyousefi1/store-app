import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Collapses the per-provider payment method enum into a generic ONLINE_GATEWAY.
 * The specific provider is stored in the `gatewayName` column, so adding
 * future gateways (Payping, Zibal, …) no longer requires an enum migration.
 *
 * Existing `zarinpal` rows keep their gatewayName='zarinpal'; only the method
 * label changes.
 */
export class RenameZarinpalToOnlineGateway1749470023000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill gatewayName for legacy rows that used method='zarinpal' but
    // never had the column populated (should be none, but cheap to be safe).
    await queryRunner.query(`
      UPDATE "payments"
      SET "gatewayName" = 'zarinpal'
      WHERE method::text = 'zarinpal' AND "gatewayName" IS NULL
    `);

    await queryRunner.query(`ALTER TYPE "payment_method" RENAME VALUE 'zarinpal' TO 'online_gateway'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "payment_method" RENAME VALUE 'online_gateway' TO 'zarinpal'`);
  }
}
