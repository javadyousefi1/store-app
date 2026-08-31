import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsSpecialSaleToProducts1749470033000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "isSpecialSale" boolean NOT NULL DEFAULT false`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isSpecialSale"`);
  }
}
