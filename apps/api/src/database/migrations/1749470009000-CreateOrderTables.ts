import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOrderTables1749470009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "order_status" AS ENUM ('pending_payment', 'payment_uploaded', 'confirmed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "payment_method" AS ENUM ('card_to_card')`);
    await queryRunner.query(`CREATE TYPE "payment_status" AS ENUM ('pending', 'uploaded', 'confirmed', 'rejected')`);

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id',          type: 'uuid',         isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId',      type: 'uuid',         isNullable: true },
          { name: 'status',      type: 'order_status', default: "'pending_payment'" },
          { name: 'firstName',   type: 'varchar',      length: '100' },
          { name: 'lastName',    type: 'varchar',      length: '100' },
          { name: 'address',     type: 'text' },
          { name: 'postalCode',  type: 'varchar',      length: '10' },
          { name: 'note',        type: 'text',         isNullable: true },
          { name: 'totalAmount', type: 'decimal',      precision: 15, scale: 2 },
          { name: 'createdAt',   type: 'timestamp',    default: 'now()' },
          { name: 'updatedAt',   type: 'timestamp',    default: 'now()' },
          { name: 'deletedAt',   type: 'timestamp',    isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_userId', columnNames: ['userId'] }));
    await queryRunner.createIndex('orders', new TableIndex({ name: 'IDX_orders_status', columnNames: ['status'] }));

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          { name: 'id',                type: 'uuid',    isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'orderId',           type: 'uuid' },
          { name: 'variantId',         type: 'uuid',    isNullable: true },
          { name: 'productName',       type: 'varchar', length: '200' },
          { name: 'variantSku',        type: 'varchar', length: '100' },
          { name: 'variantAttributes', type: 'jsonb',   isNullable: true },
          { name: 'price',             type: 'decimal', precision: 15, scale: 2 },
          { name: 'quantity',          type: 'integer' },
          { name: 'createdAt',         type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          { name: 'id',         type: 'uuid',           isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'orderId',    type: 'uuid',           isUnique: true },
          { name: 'method',     type: 'payment_method', default: "'card_to_card'" },
          { name: 'status',     type: 'payment_status', default: "'pending'" },
          { name: 'receiptKey', type: 'varchar',        isNullable: true },
          { name: 'adminNote',  type: 'text',           isNullable: true },
          { name: 'createdAt',  type: 'timestamp',      default: 'now()' },
          { name: 'updatedAt',  type: 'timestamp',      default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments', true);
    await queryRunner.dropTable('order_items', true);
    await queryRunner.dropTable('orders', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status"`);
  }
}
