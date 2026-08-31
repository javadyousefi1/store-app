import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOldPriceToVariants1749470034000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variants" ADD "oldPrice" numeric(15,2) DEFAULT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "oldPrice"`);
  }
}
