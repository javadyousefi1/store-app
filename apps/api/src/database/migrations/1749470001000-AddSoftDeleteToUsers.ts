import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsers1749470001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deletedAt"`);
  }
}
