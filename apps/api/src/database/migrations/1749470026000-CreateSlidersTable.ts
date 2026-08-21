import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSlidersTable1749470026000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sliders" (
        "id"              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title"           varchar(200) NOT NULL,
        "linkUrl"         varchar(500) NULL,
        "desktopImageId"  uuid NULL,
        "mobileImageId"   uuid NULL,
        "isActive"        boolean NOT NULL DEFAULT true,
        "sortOrder"       integer NOT NULL DEFAULT 0,
        "createdAt"       timestamp NOT NULL DEFAULT now(),
        "updatedAt"       timestamp NOT NULL DEFAULT now(),
        "deletedAt"       timestamp NULL,
        CONSTRAINT "FK_sliders_desktop_media"
          FOREIGN KEY ("desktopImageId") REFERENCES "media"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sliders_mobile_media"
          FOREIGN KEY ("mobileImageId") REFERENCES "media"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sliders_active_sort" ON "sliders" ("isActive", "sortOrder") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sliders"`);
  }
}
