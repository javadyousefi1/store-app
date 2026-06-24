import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/store/product-card";
import { CategoryFilter } from "@/components/store/category-filter";
import { apiFetch } from "@/lib/server-fetch";
import { cn } from "@/lib/utils";
import type { Category, PaginatedResponse, Product } from "@/types";

interface PageProps {
  searchParams: Promise<{
    page?: string | string[];
    categoryId?: string | string[];
    categoryIds?: string | string[];
    sort?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    search?: string | string[];
  }>;
}

export const metadata: Metadata = {
  title: "فروشگاه پوشاک زنانه",
  description:
    "مشاهده و خرید آنلاین محصولات زنانه الینا؛ جدیدترین مانتو، تیشرت، ست و شلوار.",
  alternates: {
    canonical: "/products",
  },
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const page = first(rawParams.page) ?? "1";
  const categoryId = first(rawParams.categoryId);
  const categoryIds = first(rawParams.categoryIds);
  const sort = first(rawParams.sort);
  const minPrice = first(rawParams.minPrice);
  const maxPrice = first(rawParams.maxPrice);
  const search = first(rawParams.search);
  const pageNum = Math.max(1, Number(page) || 1);

  const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
  if (categoryId) params.set("categoryId", categoryId);
  if (categoryIds) params.set("categoryIds", categoryIds);
  if (sort) params.set("sort", sort);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (search) params.set("search", search);

  const [products, categories] = await Promise.all([
    apiFetch<PaginatedResponse<Product>>(`/products?${params}`),
    apiFetch<Category[]>("/categories"),
  ]);

  const buildUrl = (nextPage: number) => {
    const query = new URLSearchParams(params);
    query.delete("limit");
    query.set("page", String(nextPage));
    return `/products?${query}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          فروشگاه پوشاک زنانه
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جدیدترین محصولات الینا را بر اساس دسته‌بندی و قیمت پیدا کنید.
        </p>
      </div>

      <Suspense fallback={null}>
        <CategoryFilter categories={categories} active={categoryId} />
      </Suspense>

      <p className="text-sm text-muted-foreground">
        {products.total.toLocaleString("fa-IR")} محصول
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {products.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.data.length === 0 && (
          <p className="col-span-full py-20 text-center text-muted-foreground">
            محصولی با این فیلترها یافت نشد
          </p>
        )}
      </div>

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

export function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
