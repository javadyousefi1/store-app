import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class ReplaceAttributeOptionWithAttributeValue1749470004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('attribute_options', true);

    await queryRunner.createTable(
      new Table({
        name: 'attributes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'attributes',
      new TableIndex({ name: 'UQ_attributes_name', columnNames: ['name'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'attribute_values',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'attributeId', type: 'uuid' },
          { name: 'value', type: 'varchar', length: '200' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'attribute_values',
      new TableIndex({
        name: 'UQ_attribute_values',
        columnNames: ['attributeId', 'value'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'attribute_values',
      new TableForeignKey({
        columnNames: ['attributeId'],
        referencedTableName: 'attributes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('attribute_values', true);
    await queryRunner.dropTable('attributes', true);
  }
}
