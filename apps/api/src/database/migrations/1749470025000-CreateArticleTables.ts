import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Blog / articles tables. Optimized for SEO — the whole point of this
 * feature is organic traffic, so every column that Google cares about
 * has an index or a well-picked type:
 *
 *   - slug UNIQUE (both tables) — the URL segment, single source of truth
 *   - publishedAt index — most queries filter to "published only, latest first"
 *   - keywords text[] — SEO keywords, queried with GIN if we ever add search
 *   - jsonb media[] — array of {key, url, size, mimeType, ...} for images
 *     embedded in the HTML body; kept alongside the article so cleanup on
 *     delete removes orphan MinIO objects too.
 *
 * `content` is TEXT holding raw HTML. Admin pastes it directly, we do NOT
 * sanitize — admin is trusted, no user-generated content in play.
 */
export class CreateArticleTables1749470025000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Categories ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "article_categories" (
        "id"          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name"        varchar(120) NOT NULL,
        "slug"        varchar(160) NOT NULL,
        "description" text NULL,
        "coverUrl"    text NULL,
        "createdAt"   timestamp NOT NULL DEFAULT now(),
        "updatedAt"   timestamp NOT NULL DEFAULT now(),
        "deletedAt"   timestamp NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_article_categories_slug" ON "article_categories" ("slug") WHERE "deletedAt" IS NULL`,
    );

    // ── Articles ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id"               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "categoryId"       uuid NOT NULL,
        "slug"             varchar(200) NOT NULL,
        "title"            varchar(200) NOT NULL,
        "excerpt"          varchar(300) NOT NULL,
        "content"          text NOT NULL,
        "coverUrl"         text NULL,
        "coverAlt"         varchar(200) NULL,
        "authorName"       varchar(120) NOT NULL DEFAULT 'تیم الینا',
        "metaTitle"        varchar(160) NULL,
        "metaDescription"  varchar(320) NULL,
        "keywords"         text[] NOT NULL DEFAULT '{}',
        "media"            jsonb NOT NULL DEFAULT '[]',
        "readTimeMinutes"  integer NOT NULL DEFAULT 1,
        "viewCount"        integer NOT NULL DEFAULT 0,
        "publishedAt"      timestamp NULL,
        "createdAt"        timestamp NOT NULL DEFAULT now(),
        "updatedAt"        timestamp NOT NULL DEFAULT now(),
        "deletedAt"        timestamp NULL,
        CONSTRAINT "FK_articles_category"
          FOREIGN KEY ("categoryId") REFERENCES "article_categories"("id")
          ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_articles_slug" ON "articles" ("slug") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_categoryId" ON "articles" ("categoryId")`,
    );
    // Published-only listings order by publishedAt DESC — index the exact shape.
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_publishedAt" ON "articles" ("publishedAt" DESC NULLS LAST)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "articles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "article_categories"`);
  }
}
