import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a human-friendly `orderNumber` to every order — a short unique
 * identifier the shopper actually sees in SMS, on the order page, and
 * quotes to support. Independent of the internal UUID (which stays in URLs)
 * and independent of the gateway's refId (bank-side reference).
 *
 * Migration is split into three safe steps so it runs cleanly against a
 * production DB with existing rows:
 *   1. Add nullable column (no lock on existing rows).
 *   2. Backfill with an 8-digit unique value per row — uses ROW_NUMBER over
 *      a random shuffle so the ordering looks arbitrary but the numbers are
 *      guaranteed unique.
 *   3. Add UNIQUE index and NOT NULL constraint now that every row has a
 *      value.
 *
 * Numbers start at 10_000_000 so they're always 8 digits — consistent
 * display width, no leading-zero surprises.
 */
export class AddOrderNumber1749470024000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add column, nullable for now.
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "orderNumber" varchar(20)`);

    // 2. Backfill existing rows with unique 8-digit numbers. ROW_NUMBER()
    //    over `ORDER BY random()` guarantees uniqueness even under any
    //    createdAt collisions.
    await queryRunner.query(`
      WITH numbered AS (
        SELECT id, (10000000 + ROW_NUMBER() OVER (ORDER BY random()))::text AS n
        FROM "orders"
      )
      UPDATE "orders" o
      SET "orderNumber" = numbered.n
      FROM numbered
      WHERE o.id = numbered.id
    `);

    // 3. Lock in the invariants now that every row has a value.
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_orders_orderNumber" ON "orders" ("orderNumber")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_orderNumber"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "orderNumber"`);
  }
}
