import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSettingsTable1749470012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, default: '1' },
          { name: 'tokenBaleBot', type: 'text', isNullable: true },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.query(`INSERT INTO settings (id) VALUES (1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings', true);
  }
}
