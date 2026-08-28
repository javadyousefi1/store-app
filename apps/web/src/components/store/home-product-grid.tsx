import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function HomeProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {products.map((product) => {
        const outOfStock = !product.inStock;
        return (
          <article
            key={product.id}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300",
              outOfStock
                ? "hover:shadow-[0_10px_26px_rgba(42,31,65,0.08)]"
                : "hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.1)]",
            )}
          >
            <Link
              href={`/products/${product.slug}`}
              className="relative block aspect-[3/4] overflow-hidden bg-muted"
              aria-label={
                outOfStock ? `مشاهده ${product.name} — ناموجود` : `مشاهده ${product.name}`
              }
            >
              {product.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.coverUrl}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition duration-500",
                    outOfStock
                      ? "grayscale opacity-75"
                      : "group-hover:scale-[1.035]",
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200" />
              )}
              {product.category?.name && (
                <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#5a4d6b] backdrop-blur-sm shadow-sm">
                  {product.category.name}
                </span>
              )}
              {outOfStock && (
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-[#2f2938]/85 py-1.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
                  ناموجود
                </span>
              )}
            </Link>

            <div className="flex flex-1 flex-col p-3">
              <h3 className="line-clamp-2 text-right text-xs font-semibold leading-[1.2em] text-[#37303d] sm:text-sm">
                {product.name}
              </h3>

              {product.colors.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  {product.colors.slice(0, 5).map((c) => (
                    <span
                      key={c}
                      className={cn(
                        "h-3.5 w-3.5 rounded-full border border-black/10 shrink-0",
                        outOfStock && "opacity-60",
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  {product.colors.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{product.colors.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
                {product.minPrice != null ? (
                  <p
                    className={cn(
                      "text-sm font-bold sm:text-base",
                      outOfStock
                        ? "text-muted-foreground line-through decoration-1"
                        : "text-primary",
                    )}
                  >
                    {formatPrice(product.minPrice)}
                    <span
                      className={cn(
                        "mr-0.5 text-[10px] font-normal",
                        outOfStock
                          ? "text-muted-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      ت
                    </span>
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">قیمت به‌زودی</span>
                )}
              </div>

              <Link
                href={`/products/${product.slug}`}
                aria-disabled={outOfStock || undefined}
                className={cn(
                  "mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-md text-xs font-semibold shadow-sm transition",
                  outOfStock
                    ? "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-primary text-primary-foreground hover:bg-brand-700",
                )}
              >
                {outOfStock ? (
                  "ناموجود — نمایش محصول"
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    مشاهده محصول
                  </>
                )}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
