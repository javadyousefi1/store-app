import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRestockNotificationsTable1749470018000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "restock_notifications" (
        "id"          uuid                NOT NULL DEFAULT gen_random_uuid(),
        "variantId"   uuid                NOT NULL,
        "userId"      uuid                NOT NULL,
        "notifiedAt"  timestamptz,
        "createdAt"   timestamptz         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restock_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_restock_notifications_variant_user" UNIQUE ("variantId", "userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_restock_notifications_variantId" ON "restock_notifications" ("variantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "restock_notifications"`);
  }
}
