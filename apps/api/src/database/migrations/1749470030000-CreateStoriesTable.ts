import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoriesTable1749470030000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stories" (
        "id"        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title"     varchar(120) NOT NULL,
        "linkUrl"   varchar(500) NULL,
        "imageId"   uuid NULL,
        "isActive"  boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp NULL,
        CONSTRAINT "FK_stories_media"
          FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_stories_active_sort" ON "stories" ("isActive", "sortOrder") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stories"`);
  }
}
