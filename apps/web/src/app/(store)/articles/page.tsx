import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  ArticleCard,
  ArticleCardSkeleton,
} from "@/components/store/article-card";
import { ArticleCategoryFilter } from "@/components/store/article-category-filter";
import { apiFetch } from "@/lib/server-fetch";
import { cn } from "@/lib/utils";
import type { Article, ArticleCategory, PaginatedResponse } from "@/types";

interface PageProps {
  searchParams: Promise<{
    page?: string | string[];
    category?: string | string[];
    search?: string | string[];
  }>;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

export const metadata: Metadata = {
  title: { absolute: "مجله الینا | مقالات و راهنمای استایل" },
  description:
    "مجله الینا؛ راهنمای انتخاب استایل، ترندهای مد زنانه و مقالات آموزشی درباره پوشاک، جنس پارچه و مراقبت از لباس.",
  keywords: [
    "مجله الینا",
    "مقاله پوشاک",
    "راهنمای استایل",
    "مد زنانه",
    "مانتو",
    "استایل ایرانی",
  ],
  alternates: {
    canonical: "/articles",
    types: {
      "application/rss+xml": [
        { url: "/articles/feed.xml", title: "مجله الینا — RSS" },
      ],
    },
  },
  openGraph: {
    type: "website",
    title: "مجله الینا | مقالات و راهنمای استایل",
    description:
      "مجله الینا؛ راهنمای انتخاب استایل، ترندهای مد زنانه و مقالات آموزشی درباره پوشاک.",
    url: `${siteUrl}/articles`,
    siteName: "الینا",
    locale: "fa_IR",
  },
  twitter: {
    card: "summary_large_image",
    title: "مجله الینا | مقالات و راهنمای استایل",
    description:
      "مجله الینا؛ راهنمای انتخاب استایل، ترندهای مد زنانه و مقالات آموزشی درباره پوشاک.",
  },
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const page = first(rawParams.page) ?? "1";
  const categorySlug = first(rawParams.category);
  const search = first(rawParams.search);
  const pageNum = Math.max(1, Number(page) || 1);

  const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
  if (categorySlug) params.set("categorySlug", categorySlug);
  if (search) params.set("search", search);

  // ISR — cache the listing for 5 minutes. New articles appear within
  // that window; Googlebot gets a fast HTML response and the backend
  // isn't hit on every crawl.
  const [articles, categories] = await Promise.all([
    apiFetch<PaginatedResponse<Article>>(`/articles?${params}`, {
      revalidate: 300,
    }).catch(() => ({
      data: [] as Article[],
      total: 0,
      page: pageNum,
      limit: 12,
      totalPages: 0,
    })),
    apiFetch<ArticleCategory[]>("/article-categories", {
      revalidate: 3600,
    }).catch(() => [] as ArticleCategory[]),
  ]);

  const buildUrl = (nextPage: number) => {
    const query = new URLSearchParams(params);
    query.delete("limit");
    query.set("page", String(nextPage));
    return `/articles?${query}`;
  };

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  // Breadcrumb JSON-LD — surfaces trail in Google search results.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "خانه",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "مجله",
        item: `${siteUrl}/articles`,
      },
      ...(activeCategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: activeCategory.name,
              item: `${siteUrl}/articles?category=${activeCategory.slug}`,
            },
          ]
        : []),
    ],
  };

  // Blog schema — tells Google this is a blog hub and links every post
  // on the current page. Improves eligibility for the article carousel
  // and the "Blog" sitelinks in search results.
  const blogUrl = activeCategory
    ? `${siteUrl}/articles?category=${activeCategory.slug}`
    : `${siteUrl}/articles`;
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${blogUrl}#blog`,
    name: activeCategory ? `${activeCategory.name} | مجله الینا` : "مجله الینا",
    description:
      activeCategory?.description ||
      "راهنمای انتخاب استایل، ترندهای مد و آموزش‌های کاربردی درباره پوشاک زنانه.",
    url: blogUrl,
    inLanguage: "fa-IR",
    publisher: {
      "@type": "Organization",
      name: "الینا",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/elina/elina-logo-full.png`,
      },
    },
    blogPost: articles.data.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      url: `${siteUrl}/articles/${article.slug}`,
      image: article.coverUrl || undefined,
      datePublished: article.publishedAt ?? article.createdAt,
      dateModified: article.updatedAt,
      author: { "@type": "Person", name: article.authorName },
      articleSection: article.category?.name,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {activeCategory ? activeCategory.name : "مجله الینا"}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          {activeCategory?.description ||
            "راهنمای انتخاب استایل، ترندهای مد و آموزش‌های کاربردی درباره پوشاک زنانه."}
        </p>
      </header>

      {categories.length > 0 && (
        <Suspense fallback={null}>
          <ArticleCategoryFilter
            categories={categories}
            activeSlug={categorySlug}
          />
        </Suspense>
      )}

      <p className="text-sm text-muted-foreground">
        {articles.total.toLocaleString("fa-IR")} مقاله
      </p>

      {articles.data.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          فعلاً مقاله‌ای در این بخش منتشر نشده است.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {articles.data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {articles.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <Link
            href={buildUrl(pageNum - 1)}
            className={cn(
              "rounded-lg border p-2 transition-colors",
              pageNum === 1
                ? "pointer-events-none border-transparent opacity-40"
                : "border-border hover:bg-muted",
            )}
            aria-disabled={pageNum === 1}
            aria-label="صفحه قبلی"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {Array.from({ length: articles.totalPages }, (_, index) => index + 1)
            .filter(
              (item) =>
                Math.abs(item - pageNum) <= 2 ||
                item === 1 ||
                item === articles.totalPages,
            )
            .reduce<(number | "…")[]>((items, item, index, allItems) => {
              if (index > 0 && item - allItems[index - 1] > 1) items.push("…");
              items.push(item);
              return items;
            }, [])
            .map((item, index) =>
              item === "…" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={buildUrl(item)}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    item === pageNum
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                  aria-label={`صفحه ${item.toLocaleString("fa-IR")}`}
                  aria-current={item === pageNum ? "page" : undefined}
                >
                  {item.toLocaleString("fa-IR")}
                </Link>
              ),
            )}

          <Link
            href={buildUrl(pageNum + 1)}
            className={cn(
              "rounded-lg border p-2 transition-colors",
              pageNum === articles.totalPages
                ? "pointer-events-none border-transparent opacity-40"
                : "border-border hover:bg-muted",
            )}
            aria-disabled={pageNum === articles.totalPages}
            aria-label="صفحه بعدی"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
