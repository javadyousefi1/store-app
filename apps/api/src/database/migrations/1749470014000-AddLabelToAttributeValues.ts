import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLabelToAttributeValues1749470014000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attribute_values" ADD COLUMN "label" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attribute_values" DROP COLUMN "label"`,
    );
  }
}
