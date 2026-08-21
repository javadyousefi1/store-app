import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Iran Post shipping to orders.
 *
 *   - deliveryType enum gains 'iran_post'.
 *   - shipmentStatus enum tracks Cod24 lifecycle (pending → created →
 *     ready → barcoded, or failed).
 *   - New columns hold the recipient's mobile + national code, the
 *     Cod24 city/state ids + human-readable snapshot, shipping cost
 *     (added to totalAmount), and the post-office identifiers we get
 *     back after Cod24 processes the shipment.
 *
 * Existing rows keep deliveryType='in_person' and all shipping columns
 * NULL / 0 — the frontend continues to treat them as pickup orders.
 */
export class AddShippingToOrders1749470028000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums — add iran_post to deliveryType, create shipmentStatus enum.
    // NB: the original delivery-type enum was created as `order_delivery_type_enum`
    // in migration 1749470011000, NOT TypeORM's default `orders_deliverytype_enum`.
    await queryRunner.query(
      `ALTER TYPE "order_delivery_type_enum" ADD VALUE IF NOT EXISTS 'iran_post'`,
    );
    await queryRunner.query(
      `CREATE TYPE "order_shipment_status_enum" AS ENUM ('pending', 'created', 'ready', 'barcoded', 'failed')`,
    );

    // Columns.
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "mobile"              varchar(15)  NULL,
        ADD COLUMN "nationalCode"        varchar(10)  NULL,
        ADD COLUMN "stateCode"           integer      NULL,
        ADD COLUMN "cityCode"            integer      NULL,
        ADD COLUMN "stateName"           varchar(100) NULL,
        ADD COLUMN "cityName"            varchar(100) NULL,
        ADD COLUMN "shippingCost"        numeric(15,2) NOT NULL DEFAULT 0,
        ADD COLUMN "shipmentSerial"      bigint       NULL,
        ADD COLUMN "shipmentPostBarcode" varchar(50)  NULL,
        ADD COLUMN "shipmentStatus"      "order_shipment_status_enum" NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "shipmentStatus",
        DROP COLUMN IF EXISTS "shipmentPostBarcode",
        DROP COLUMN IF EXISTS "shipmentSerial",
        DROP COLUMN IF EXISTS "shippingCost",
        DROP COLUMN IF EXISTS "cityName",
        DROP COLUMN IF EXISTS "stateName",
        DROP COLUMN IF EXISTS "cityCode",
        DROP COLUMN IF EXISTS "stateCode",
        DROP COLUMN IF EXISTS "nationalCode",
        DROP COLUMN IF EXISTS "mobile"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_shipment_status_enum"`);
    // Note: Postgres can't drop an enum value cleanly; leaving 'iran_post'
    // in place is harmless on rollback.
  }
}
