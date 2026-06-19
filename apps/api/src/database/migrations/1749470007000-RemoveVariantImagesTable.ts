import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVariantImagesTable1749470007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD COLUMN IF NOT EXISTS "imageIds" text[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_images" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_variant_images" (
        "id"        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "variantId" uuid NOT NULL,
        "mediaId"   uuid NOT NULL,
        "order"     integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_pvi_variant" FOREIGN KEY ("variantId")
          REFERENCES "product_variants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pvi_media" FOREIGN KEY ("mediaId")
          REFERENCES "media"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "imageIds"`);
  }
}
