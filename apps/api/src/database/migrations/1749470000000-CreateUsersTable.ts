import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1749470000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('admin', 'user')`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '11',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'user_role_enum',
            default: `'user'`,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'UQ_users_phone',
        columnNames: ['phone'],
        isUnique: true,
      }),
    );

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'UQ_users_phone');
    await queryRunner.dropTable('users');
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
