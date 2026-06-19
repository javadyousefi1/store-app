import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCatalogTables1749470002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // categories
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    // attribute_options
    await queryRunner.createTable(
      new Table({
        name: 'attribute_options',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'attribute', type: 'varchar', length: '100' },
          { name: 'value', type: 'varchar', length: '200' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'attribute_options',
      new TableIndex({ name: 'UQ_attr_option', columnNames: ['attribute', 'value'], isUnique: true }),
    );

    // products
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'categoryId', type: 'uuid', isNullable: true },
          { name: 'name', type: 'varchar', length: '200' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // product_variants
    await queryRunner.createTable(
      new Table({
        name: 'product_variants',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'productId', type: 'uuid' },
          { name: 'sku', type: 'varchar', length: '100' },
          { name: 'price', type: 'decimal', precision: 15, scale: 2 },
          { name: 'stock', type: 'int', default: 0 },
          { name: 'attributes', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true, default: null },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({ name: 'UQ_variant_sku', columnNames: ['sku'], isUnique: true }),
    );

    await queryRunner.createForeignKey(
      'product_variants',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_variants', true);
    await queryRunner.dropTable('products', true);
    await queryRunner.dropTable('attribute_options', true);
    await queryRunner.dropTable('categories', true);
  }
}
