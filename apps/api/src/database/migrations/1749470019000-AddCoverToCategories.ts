import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddCoverToCategories1749470019000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('categories', {
      name: 'coverId',
      type: 'uuid',
      isNullable: true,
    } as any);

    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        columnNames: ['coverId'],
        referencedTableName: 'media',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('categories');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('coverId'));
    if (fk) await queryRunner.dropForeignKey('categories', fk);
    await queryRunner.dropColumn('categories', 'coverId');
  }
}
