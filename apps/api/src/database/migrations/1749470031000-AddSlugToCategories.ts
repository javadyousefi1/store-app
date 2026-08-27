import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add SEO-friendly slug to categories. Mirrors the products slug pattern —
 * `/categories/<slug>` on the storefront, unique per category. Existing rows
 * are backfilled with a short id-based slug so admin can update them later
 * to something meaningful without dealing with duplicates.
 */
export class AddSlugToCategories1749470031000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN "slug" varchar(160)`,
    );

    // Backfill: 'c-' + first 12 hex chars of id (dashes stripped) → unique per row.
    await queryRunner.query(
      `UPDATE "categories" SET "slug" = 'c-' || SUBSTRING(REPLACE("id"::text, '-', ''), 1, 12) WHERE "slug" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_categories_slug" ON "categories" ("slug") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_categories_slug"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "slug"`);
  }
}
