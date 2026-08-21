import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add SEO-friendly slug to products. Mirrors the article slug pattern —
 * `/products/<slug>` on the storefront, unique per product. Existing rows
 * are backfilled with a short id-based slug so admin can update them later
 * to something meaningful without dealing with duplicates.
 */
export class AddSlugToProducts1749470027000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "slug" varchar(200)`,
    );

    // Backfill: 'p-' + first 12 hex chars of id (dashes stripped) → unique per row.
    await queryRunner.query(
      `UPDATE "products" SET "slug" = 'p-' || SUBSTRING(REPLACE("id"::text, '-', ''), 1, 12) WHERE "slug" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_products_slug" ON "products" ("slug") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_products_slug"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "slug"`);
  }
}
