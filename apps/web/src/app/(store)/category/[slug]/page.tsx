import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { CategoryFilter } from "@/components/store/category-filter";
import { ProductsFilterFab } from "@/components/store/products-filter-fab";
import { apiFetch } from "@/lib/server-fetch";
import { cn } from "@/lib/utils";
import type { Category, PaginatedResponse, Product } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string | string[];
    sort?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
  }>;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await apiFetch<Category>(`/categories/by-slug/${slug}`);
    const title = `${category.name} — خرید آنلاین ${category.name} زنانه`;
    const description = `خرید آنلاین ${category.name} زنانه از فروشگاه الینا با تنوع طرح، رنگ و سایز. ارسال سریع به سراسر ایران و ضمانت بازگشت.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/category/${encodeURIComponent(slug)}`,
      },
      openGraph: {
        type: "website",
        title,
        description,
        url: `/category/${encodeURIComponent(slug)}`,
        images: category.coverUrl ? [{ url: category.coverUrl }] : undefined,
      },
    };
  } catch {
    return {
      title: "دسته‌بندی",
      robots: { index: false, follow: true },
    };
  }
}

export default async function CategoryLandingPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;

  let category: Category;
  try {
    category = await apiFetch<Category>(`/categories/by-slug/${slug}`);
  } catch {
    notFound();
  }

  const page = first(rawParams.page) ?? "1";
  const sort = first(rawParams.sort);
  const minPrice = first(rawParams.minPrice);
  const maxPrice = first(rawParams.maxPrice);
  const pageNum = Math.max(1, Number(page) || 1);

  const query = new URLSearchParams({
    page: String(pageNum),
    limit: "20",
    categoryId: category.id,
  });
  if (sort) query.set("sort", sort);
  if (minPrice) query.set("minPrice", minPrice);
  if (maxPrice) query.set("maxPrice", maxPrice);

  const [products, allCategories] = await Promise.all([
    apiFetch<PaginatedResponse<Product>>(`/products?${query}`),
    apiFetch<Category[]>("/categories").catch(() => [] as Category[]),
  ]);

  const canonicalUrl = `${siteUrl}/category/${encodeURIComponent(slug)}`;
  const buildUrl = (nextPage: number) => {
    const next = new URLSearchParams(query);
    next.delete("limit");
    next.delete("categoryId");
    next.set("page", String(nextPage));
    return `/category/${encodeURIComponent(slug)}?${next}`;
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    name: category.name,
    url: canonicalUrl,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.total,
      itemListElement: products.data.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1 + (pageNum - 1) * 20,
        url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
        name: p.name,
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "محصولات", item: `${siteUrl}/products` },
      { "@type": "ListItem", position: 3, name: category.name, item: canonicalUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c"),
        }}
      />

      <nav
        aria-label="مسیر صفحه"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          خانه
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">
          محصولات
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {category.name} — خرید آنلاین {category.name} زنانه
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
          فروشگاه اینترنتی الینا مجموعه‌ای گسترده از {category.name} زنانه با
          جدیدترین طرح‌ها، دوخت باکیفیت و پارچه‌های اصل عرضه می‌کند. اگر به
          دنبال یک {category.name} زنانه شیک و کاربردی برای استایل روزمره،
          محیط کار یا مهمانی هستید، دسته «{category.name}» الینا تنوعی از
          رنگ‌ها، سایزها و برش‌های مختلف را در اختیار شما قرار می‌دهد. تمامی
          محصولات این بخش قبل از ارسال کنترل کیفیت می‌شوند و همراه با ضمانت
          بازگشت وجه در صورت مغایرت به دست شما می‌رسند. برای مشاهده و مقایسه
          آسان‌تر می‌توانید محصولات را بر اساس قیمت یا جدیدترین‌ها مرتب کنید.
        </p>
      </header>

      <Suspense fallback={null}>
        <CategoryFilter categories={allCategories} active={category.id} />
      </Suspense>

      <p className="text-sm text-muted-foreground">
        {products.total.toLocaleString("fa-IR")} محصول در دسته {category.name}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {products.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.data.length === 0 && (
          <p className="col-span-full py-20 text-center text-muted-foreground">
            محصولی در این دسته یافت نشد
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        <ProductsFilterFab />
      </Suspense>

      {products.totalPages > 1 && (
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

          {Array.from({ length: products.totalPages }, (_, index) => index + 1)
            .filter(
              (item) =>
                Math.abs(item - pageNum) <= 2 ||
                item === 1 ||
                item === products.totalPages,
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
              pageNum === products.totalPages
                ? "pointer-events-none border-transparent opacity-40"
                : "border-border hover:bg-muted",
            )}
            aria-disabled={pageNum === products.totalPages}
            aria-label="صفحه بعدی"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
