import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingForeignKeyIndexes1749470015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_variants_productId" ON "product_variants" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_categoryId" ON "products" ("categoryId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_variants_productId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_categoryId"`);
  }
}
