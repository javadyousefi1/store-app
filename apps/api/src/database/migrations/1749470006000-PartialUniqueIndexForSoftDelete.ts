import { MigrationInterface, QueryRunner } from 'typeorm';

export class PartialUniqueIndexForSoftDelete1749470006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_attributes_name"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_attributes_name_active"
      ON "attributes"("name")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_attribute_values"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_attribute_values_active"
      ON "attribute_values"("attributeId", "value")
      WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_attributes_name_active"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_attributes_name" ON "attributes"("name")`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_attribute_values_active"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_attribute_values" ON "attribute_values"("attributeId", "value")`);
  }
}
