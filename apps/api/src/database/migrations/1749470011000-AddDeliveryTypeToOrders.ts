import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeliveryTypeToOrders1749470011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE order_delivery_type_enum AS ENUM ('in_person')`);
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'deliveryType',
        type: 'enum',
        enum: ['in_person'],
        enumName: 'order_delivery_type_enum',
        default: `'in_person'`,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'deliveryType');
    await queryRunner.query(`DROP TYPE order_delivery_type_enum`);
  }
}
