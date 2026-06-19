import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { CategoryFilter } from "@/components/store/category-filter";
import { apiFetch } from "@/lib/server-fetch";
import { cn } from "@/lib/utils";
import type { Category, PaginatedResponse, Product } from "@/types";

interface PageProps {
  searchParams: Promise<{ page?: string; categoryId?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { page = "1", categoryId } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
  if (categoryId) params.set("categoryId", categoryId);

  const [products, categories] = await Promise.all([
    apiFetch<PaginatedResponse<Product>>(`/products?${params}`),
    apiFetch<Category[]>("/categories"),
  ]);

  const buildUrl = (p: number) => {
    const q = new URLSearchParams({ page: String(p) });
    if (categoryId) q.set("categoryId", categoryId);
    return `/products?${q}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Category filter */}
      <Suspense>
        <CategoryFilter categories={categories} active={categoryId} />
      </Suspense>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {products.total.toLocaleString("fa-IR")} محصول
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.data.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {products.data.length === 0 && (
          <p className="col-span-full text-center py-20 text-muted-foreground">
            محصولی یافت نشد
          </p>
        )}
      </div>

      {/* Pagination */}
      {products.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <Link
            href={buildUrl(pageNum - 1)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              pageNum === 1
                ? "pointer-events-none opacity-40 border-transparent"
                : "hover:bg-muted border-border"
            )}
            aria-disabled={pageNum === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {Array.from({ length: products.totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - pageNum) <= 2 || p === 1 || p === products.totalPages)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              item === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Link
                  key={item}
                  href={buildUrl(item as number)}
                  className={cn(
                    "min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    item === pageNum
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {(item as number).toLocaleString("fa-IR")}
                </Link>
              )
            )}

          <Link
            href={buildUrl(pageNum + 1)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              pageNum === products.totalPages
                ? "pointer-events-none opacity-40 border-transparent"
                : "hover:bg-muted border-border"
            )}
            aria-disabled={pageNum === products.totalPages}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
