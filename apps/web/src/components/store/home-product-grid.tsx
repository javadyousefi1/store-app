import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export function HomeProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {products.map((product) => (
        <article
          key={product.id}
          className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.1)]"
        >
          <Link
            href={`/products/${product.slug}`}
            className="relative block aspect-[3/4] overflow-hidden bg-muted"
            aria-label={`مشاهده ${product.name}`}
          >
            {product.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.coverUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200" />
            )}
          </Link>
          <div className="p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-right text-xs font-medium text-[#37303d] sm:text-sm">
                {product.name}
              </h3>
              {product.minPrice != null && (
                <p className="shrink-0 text-xs font-bold text-primary sm:text-sm">
                  <span className="sr-only">قیمت </span>
                  {formatPrice(product.minPrice)}
                  <span className="mr-0.5 text-[10px] font-normal">ت</span>
                </p>
              )}
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-brand-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              مشاهده محصول
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
