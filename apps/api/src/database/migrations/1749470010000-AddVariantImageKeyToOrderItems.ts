import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVariantImageKeyToOrderItems1749470010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'order_items',
      new TableColumn({ name: 'variantImageKey', type: 'text', isNullable: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('order_items', 'variantImageKey');
  }
}
