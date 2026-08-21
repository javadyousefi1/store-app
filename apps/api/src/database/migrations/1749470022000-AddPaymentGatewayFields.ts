import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentGatewayFields1749470022000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend payment_method enum
    await queryRunner.query(`ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'zarinpal'`);

    // Extend payment_status enum with the two states the gateway flow needs:
    //   initiated — authority obtained, waiting for shopper to return
    //   failed    — verification came back negative (or shopper aborted)
    await queryRunner.query(`ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'initiated'`);
    await queryRunner.query(`ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'failed'`);

    // Gateway-agnostic columns. Every gateway records the same shape:
    // a provider-issued token (authority), a reference we can show the user
    // (refId), some optional card metadata, and the raw response fields we
    // may want to audit later (code, message, fee).
    await queryRunner.query(`
      ALTER TABLE "payments"
        ADD COLUMN "gatewayName"    varchar(50)  NULL,
        ADD COLUMN "authority"      varchar(100) NULL,
        ADD COLUMN "refId"          varchar(100) NULL,
        ADD COLUMN "cardPan"        varchar(50)  NULL,
        ADD COLUMN "cardHash"       varchar(128) NULL,
        ADD COLUMN "fee"            decimal(15,2) NULL,
        ADD COLUMN "feeType"        varchar(50)  NULL,
        ADD COLUMN "gatewayCode"    integer      NULL,
        ADD COLUMN "gatewayMessage" text         NULL,
        ADD COLUMN "initiatedAt"    timestamp    NULL,
        ADD COLUMN "paidAt"         timestamp    NULL
    `);

    // The callback lookup keys off (gatewayName, authority) so it must be
    // unique. Partial index skips rows where we haven't initiated a gateway
    // payment yet (card_to_card orders).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payments_gateway_authority"
      ON "payments" ("gatewayName", "authority")
      WHERE "authority" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_payments_gateway_authority"`);
    await queryRunner.query(`
      ALTER TABLE "payments"
        DROP COLUMN IF EXISTS "paidAt",
        DROP COLUMN IF EXISTS "initiatedAt",
        DROP COLUMN IF EXISTS "gatewayMessage",
        DROP COLUMN IF EXISTS "gatewayCode",
        DROP COLUMN IF EXISTS "feeType",
        DROP COLUMN IF EXISTS "fee",
        DROP COLUMN IF EXISTS "cardHash",
        DROP COLUMN IF EXISTS "cardPan",
        DROP COLUMN IF EXISTS "refId",
        DROP COLUMN IF EXISTS "authority",
        DROP COLUMN IF EXISTS "gatewayName"
    `);
    // Postgres cannot drop a single enum value in-place. Leaving the extra
    // enum members is safe — unused enum labels have no runtime cost.
  }
}
