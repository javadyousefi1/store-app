import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/server-fetch";
import type { Article, ArticleCategory, PaginatedResponse, Product } from "@/types";

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
  const limit = 50; // must respect the backend Max(50) validator
  for (let page = 1; page <= 10; page += 1) {
    try {
      const res = await apiFetch<PaginatedResponse<Article>>(
        `/articles?page=${page}&limit=${limit}`,
        { revalidate: 3600 },
      );
      all.push(...res.data);
      if (page >= res.totalPages) break;
    } catch {
      break;
    }
  }
  return all;
}

async function fetchArticleCategories(): Promise<ArticleCategory[]> {
  try {
    return await apiFetch<ArticleCategory[]>("/article-categories", {
      revalidate: 3600,
    });
  } catch {
    return [];
  }
}

/**
 * Pull every active product for the sitemap. Same pattern as articles —
 * page through the public listing (50 max per hit) so Google can crawl a
 * URL per product for indexing.
 */
async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  const limit = 50;
  for (let page = 1; page <= 20; page += 1) {
    try {
      const res = await apiFetch<PaginatedResponse<Product>>(
        `/products?page=${page}&limit=${limit}`,
        { revalidate: 3600 },
      );
      all.push(...res.data);
      if (page >= res.totalPages) break;
    } catch {
      break;
    }
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [articles, categories, products] = await Promise.all([
    fetchAllPublishedArticles(),
    fetchArticleCategories(),
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

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/articles?category=${category.slug}`,
    lastModified: category.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: article.updatedAt ?? article.publishedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.7,
    images: article.coverUrl ? [article.coverUrl] : undefined,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: product.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.8,
    images: product.coverUrl ? [product.coverUrl] : undefined,
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...productEntries];
}
