import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCouponsAndOrderDiscount1749470021000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "coupons_scopetype_enum" AS ENUM ('product', 'category')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', length: '64' },
          { name: 'percentage', type: 'int' },
          { name: 'maxDiscountAmount', type: 'decimal', precision: 15, scale: 2 },
          { name: 'quantity', type: 'int' },
          { name: 'usedCount', type: 'int', default: 0 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'scopeType', type: 'coupons_scopetype_enum' },
          { name: 'scopeId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'coupons',
      new TableIndex({ name: 'UQ_coupons_code', columnNames: ['code'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'coupon_redemptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'couponId', type: 'uuid' },
          { name: 'userId', type: 'uuid' },
          { name: 'orderId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'coupon_redemptions',
      new TableIndex({ name: 'IDX_coupon_redemptions_couponId', columnNames: ['couponId'] }),
    );

    await queryRunner.createIndex(
      'coupon_redemptions',
      new TableIndex({ name: 'IDX_coupon_redemptions_userId', columnNames: ['userId'] }),
    );

    await queryRunner.createIndex(
      'coupon_redemptions',
      new TableIndex({ name: 'IDX_coupon_redemptions_orderId', columnNames: ['orderId'] }),
    );

    await queryRunner.createIndex(
      'coupon_redemptions',
      new TableIndex({
        name: 'UQ_coupon_redemptions_coupon_user',
        columnNames: ['couponId', 'userId'],
        isUnique: true,
      }),
    );

    await queryRunner.addColumn('orders', new TableColumn({
      name: 'subtotalAmount',
      type: 'decimal',
      precision: 15,
      scale: 2,
      default: 0,
    }));

    await queryRunner.addColumn('orders', new TableColumn({
      name: 'discountAmount',
      type: 'decimal',
      precision: 15,
      scale: 2,
      default: 0,
    }));

    await queryRunner.addColumn('orders', new TableColumn({
      name: 'couponId',
      type: 'uuid',
      isNullable: true,
    }));

    await queryRunner.addColumn('orders', new TableColumn({
      name: 'couponSnapshot',
      type: 'jsonb',
      isNullable: true,
    }));

    // Backfill subtotalAmount = totalAmount for existing orders
    await queryRunner.query(`UPDATE "orders" SET "subtotalAmount" = "totalAmount"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'couponSnapshot');
    await queryRunner.dropColumn('orders', 'couponId');
    await queryRunner.dropColumn('orders', 'discountAmount');
    await queryRunner.dropColumn('orders', 'subtotalAmount');

    await queryRunner.dropTable('coupon_redemptions', true);
    await queryRunner.dropTable('coupons', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "coupons_scopetype_enum"`);
  }
}
