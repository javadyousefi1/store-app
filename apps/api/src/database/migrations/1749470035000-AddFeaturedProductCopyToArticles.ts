import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturedProductCopyToArticles1749470035000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE "articles"
        ADD COLUMN IF NOT EXISTS "featuredProductTitle"       varchar(200) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "featuredProductDescription" varchar(300) DEFAULT NULL
    `);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE "articles"
        DROP COLUMN IF EXISTS "featuredProductTitle",
        DROP COLUMN IF EXISTS "featuredProductDescription"
    `);
  }
}
