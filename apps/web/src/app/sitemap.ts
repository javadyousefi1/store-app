import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/server-fetch";
import type {
  Article,
  Category,
  PaginatedResponse,
  Product,
} from "@/types";

// Regenerate the sitemap every 12 hours at runtime (ISR) so newly published
// articles and products appear without requiring a full redeploy.
export const revalidate = 43200;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

/**
 * Pull every published article for the sitemap. Google needs a URL per
 * article to crawl it — we page through the public listing (200 max per
 * hit) up to 10 pages so this scales while the blog is small without a
 * dedicated sitemap endpoint.
 */
async function fetchAllPublishedArticles(): Promise<Article[]> {
  const all: Article[] = [];
  const limit = 50;
  for (let page = 1; page <= 10; page += 1) {
    try {
      const res = await apiFetch<PaginatedResponse<Article>>(
        `/articles?page=${page}&limit=${limit}`,
        { revalidate: 43200 },
      );
      all.push(...res.data);
      if (page >= res.totalPages) break;
    } catch (err) {
      console.error("[sitemap] articles fetch failed:", err);
      break;
    }
  }
  return all;
}

async function fetchProductCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories", { revalidate: 43200 });
  } catch (err) {
    console.error("[sitemap] categories fetch failed:", err);
    return [];
  }
}

async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  const limit = 50;
  for (let page = 1; page <= 20; page += 1) {
    try {
      const res = await apiFetch<PaginatedResponse<Product>>(
        `/products?page=${page}&limit=${limit}`,
        { revalidate: 43200 },
      );
      all.push(...res.data);
      if (page >= res.totalPages) break;
    } catch (err) {
      console.error("[sitemap] products fetch failed:", err);
      break;
    }
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [articles, productCategories, products] = await Promise.all([
    fetchAllPublishedArticles(),
    fetchProductCategories(),
    fetchAllProducts(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      images: [`${siteUrl}/elina/elina-logo-full.png`],
    },
    {
      url: `${siteUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: articles[0]?.updatedAt ?? now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Article "category" was previously written as a query string
  // (`/articles?category=slug`) — Google devalues query-based URLs. Drop
  // those entries here; introduce a dedicated `/articles/category/[slug]`
  // route if we want them back.

  const productCategoryEntries: MetadataRoute.Sitemap = productCategories.map(
    (category) => ({
      url: `${siteUrl}/category/${encodeURIComponent(category.slug)}`,
      lastModified: category.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: category.coverUrl ? [category.coverUrl] : undefined,
    }),
  );

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${encodeURIComponent(article.slug)}`,
    lastModified: article.updatedAt ?? article.publishedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.7,
    images: article.coverUrl ? [article.coverUrl] : undefined,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
    lastModified: product.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.8,
    images: product.coverUrl ? [product.coverUrl] : undefined,
  }));

  return [
    ...staticEntries,
    ...productCategoryEntries,
    ...articleEntries,
    ...productEntries,
  ];
}
