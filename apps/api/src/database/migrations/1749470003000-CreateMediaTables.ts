import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMediaTables1749470003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'media',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'key', type: 'varchar' },
          { name: 'bucket', type: 'varchar' },
          { name: 'originalName', type: 'varchar' },
          { name: 'mimeType', type: 'varchar' },
          { name: 'size', type: 'int' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // product cover FK
    await queryRunner.addColumn('products', {
      name: 'coverId',
      type: 'uuid',
      isNullable: true,
    } as any);

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['coverId'],
        referencedTableName: 'media',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // product_variant_images junction
    await queryRunner.createTable(
      new Table({
        name: 'product_variant_images',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'variantId', type: 'uuid' },
          { name: 'mediaId', type: 'uuid' },
          { name: 'order', type: 'int', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'product_variant_images',
      new TableForeignKey({
        columnNames: ['variantId'],
        referencedTableName: 'product_variants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'product_variant_images',
      new TableForeignKey({
        columnNames: ['mediaId'],
        referencedTableName: 'media',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_variant_images', true);

    const table = await queryRunner.getTable('products');
    const fk = table.foreignKeys.find((fk) => fk.columnNames.includes('coverId'));
    if (fk) await queryRunner.dropForeignKey('products', fk);
    await queryRunner.dropColumn('products', 'coverId');

    await queryRunner.dropTable('media', true);
  }
}
