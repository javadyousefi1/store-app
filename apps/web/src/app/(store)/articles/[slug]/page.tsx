import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ImageIcon,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/lib/server-fetch";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ArticleCard } from "@/components/store/article-card";
import { ArticleScrollProgress } from "@/components/store/article-scroll-progress";
import type { Article, PaginatedResponse } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

/**
 * Next 16 dynamic segments are inconsistent for non-ASCII slugs — sometimes
 * `params.slug` arrives decoded ("راهنمای-…"), sometimes still percent-
 * encoded ("%D8%B1%D8%A7…") depending on how the route was reached
 * (generateMetadata vs client navigation vs direct load). Blindly running
 * encodeURIComponent double-encodes the already-encoded case and yields
 * a URL that doesn't match anything in the DB. Decode first to normalise.
 */
function normaliseSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function getArticle(slug: string): Promise<Article | null> {
  const canonical = normaliseSlug(slug);
  try {
    return await apiFetch<Article>(
      `/articles/${encodeURIComponent(canonical)}`,
      { revalidate: 3600 },
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "مقاله یافت نشد",
      robots: { index: false, follow: false },
    };
  }

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt;
  const encodedSlug = encodeURIComponent(article.slug);
  const url = `${siteUrl}/articles/${encodedSlug}`;

  // Article-specific hero image for social/search cards. Falls back to the
  // first uploaded body-image when the admin forgot a cover, then to null.
  // Never inherit the layout OG image (site logo) — Google Search was
  // picking that up on cover-less articles.
  const heroImage =
    article.coverUrl ??
    article.media?.find((m) => m.url)?.url ??
    null;
  const heroAlt = article.coverAlt || article.title;

  // Admin-provided metaTitle usually already carries the brand, and article
  // titles are long enough that the "| الینا" template suffix pushes past
  // Google's snippet limit. Use `absolute` for either case.
  return {
    title: { absolute: title },
    description,
    keywords: article.keywords?.length ? article.keywords : undefined,
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    alternates: {
      canonical: `/articles/${encodedSlug}`,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "الینا",
      locale: "fa_IR",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category?.name,
      tags: article.keywords,
      // Setting an empty array on the cover-less path prevents the parent
      // layout's logo image from being inherited as this article's card.
      images: heroImage ? [{ url: heroImage, alt: heroAlt }] : [],
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  // Fetch a few related articles from the same category (excluding this one).
  const relatedRes = article.category?.slug
    ? await apiFetch<PaginatedResponse<Article>>(
        `/articles?categorySlug=${encodeURIComponent(
          article.category.slug,
        )}&limit=4`,
        { revalidate: 600 },
      ).catch(() => null)
    : null;
  const related = (relatedRes?.data ?? [])
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  const url = `${siteUrl}/articles/${encodeURIComponent(article.slug)}`;
  const coverAlt = article.coverAlt || article.title;

  const featured = article.featuredProduct;
  const featuredUrl = featured
    ? `${siteUrl}/products/${encodeURIComponent(featured.slug)}`
    : null;

  // Ordered image list for BlogPosting JSON-LD. Cover first, then body
  // images. Google prefers article-specific imagery over the site logo when
  // rendering rich search cards. Dedupe by URL.
  const articleImages = Array.from(
    new Set(
      [article.coverUrl, ...(article.media ?? []).map((m) => m.url)].filter(
        (u): u is string => !!u,
      ),
    ),
  );

  // BlogPosting JSON-LD — the primary schema Google uses to render rich
  // article results (headline, author, date, image, publisher).
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: articleImages.length ? articleImages : undefined,
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "الینا",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/elina/elina-logo-full.png`,
      },
    },
    articleSection: article.category?.name,
    keywords: article.keywords?.length ? article.keywords.join(", ") : undefined,
    wordCount: article.readTimeMinutes * 200,
    inLanguage: "fa-IR",
    // Featured product surfaces as a `mentions` node — Google reads this
    // as a topical signal that this article is about this product (no
    // interstitial penalty; the card renders inline in the body).
    mentions: featured && featuredUrl
      ? {
          "@type": "Product",
          "@id": featuredUrl,
          name: featured.name,
          url: featuredUrl,
          image: featured.coverUrl ?? undefined,
          offers: featured.minPrice != null
            ? {
                "@type": "Offer",
                price: featured.minPrice,
                priceCurrency: "IRR",
                availability: "https://schema.org/InStock",
                url: featuredUrl,
              }
            : undefined,
        }
      : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "مجله",
        item: `${siteUrl}/articles`,
      },
      ...(article.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: article.category.name,
              item: `${siteUrl}/articles?category=${article.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: article.category ? 4 : 3,
        name: article.title,
        item: url,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <ArticleScrollProgress />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav
        aria-label="مسیر ناوبری"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm"
      >
        <Link
          href="/articles"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          مجله
        </Link>
        {article.category && (
          <>
            <span>/</span>
            <Link
              href={`/articles?category=${article.category.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {article.category.name}
            </Link>
          </>
        )}
      </nav>

      <article className="space-y-6">
        <header className="space-y-4">
          {article.category && (
            <Badge variant="secondary" className="text-xs">
              {article.category.name}
            </Badge>
          )}

          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {article.title}
          </h1>

          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {article.authorName}
            </span>
            {article.publishedAt && (
              <time
                dateTime={article.publishedAt}
                className="inline-flex items-center gap-1.5"
              >
                <CalendarDays className="h-4 w-4" />
                {formatDate(article.publishedAt)}
              </time>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readTimeMinutes.toLocaleString("fa-IR")} دقیقه مطالعه
            </span>
          </div>
        </header>

        {article.coverUrl ? (
          <figure className="overflow-hidden rounded-2xl border bg-muted/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverUrl}
              alt={coverAlt}
              className="h-auto w-full object-cover"
              loading="eager"
              // @ts-expect-error fetchPriority is valid but not typed on some React versions
              fetchpriority="high"
              decoding="async"
            />
            {article.coverAlt && (
              <figcaption className="px-4 py-2 text-center text-xs text-muted-foreground">
                {article.coverAlt}
              </figcaption>
            )}
          </figure>
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border bg-muted/50">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        <div
          className="article-content text-[15px] leading-8 text-foreground sm:text-base sm:leading-9"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {featured && (
          <aside
            aria-label="محصول پیشنهادی"
            className="not-prose relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-l from-brand-50 via-white to-white p-4 shadow-[0_10px_28px_rgba(45,32,67,0.05)] sm:p-5"
          >
            <p className="mb-3 text-[11px] font-medium tracking-[0.18em] text-brand-700">
              محصول پیشنهادی
            </p>
            <Link
              href={`/products/${featured.slug}`}
              className="group flex items-stretch gap-4"
            >
              <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
                {featured.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.coverUrl}
                    alt={featured.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                  <h3 className="line-clamp-2 text-sm font-bold text-brand-800 transition-colors group-hover:text-brand-600 sm:text-base">
                    {featured.name}
                  </h3>
                  {featured.category?.name && (
                    <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                      {featured.category.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  {featured.minPrice != null ? (
                    <p className="text-sm font-bold text-primary sm:text-base">
                      {featured.minPrice.toLocaleString("fa-IR")}
                      <span className="mr-1 text-[10px] font-normal text-muted-foreground">
                        ریال
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-transform duration-300 group-hover:-translate-x-1 sm:text-sm">
                    مشاهده محصول
                    <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </aside>
        )}

        {article.keywords?.length > 0 && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <span className="text-xs font-semibold text-muted-foreground">
              برچسب‌ها:
            </span>
            {article.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="text-[11px] font-normal"
              >
                {keyword}
              </Badge>
            ))}
          </footer>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-14 space-y-4 border-t border-border pt-8">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            مقالات مرتبط
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
