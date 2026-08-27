import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add an optional "featured product" reference to articles. Renders as an
 * inline card at the end of the article body and shows up as `mentions`
 * in the BlogPosting JSON-LD — Google reads that as a topical signal
 * that this article is about this product.
 *
 * ON DELETE SET NULL so removing a product doesn't break articles that
 * once referenced it; the article just quietly loses the recommendation.
 */
export class AddFeaturedProductToArticles1749470029000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ADD COLUMN "featuredProductId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_articles_featuredProduct" ` +
        `FOREIGN KEY ("featuredProductId") REFERENCES "products"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "FK_articles_featuredProduct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP COLUMN IF EXISTS "featuredProductId"`,
    );
  }
}
