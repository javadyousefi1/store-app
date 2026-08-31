import Link from "next/link";
import { Flame, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/store/favorite-button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const outOfStock = !product.inStock;
  const showDiscount = product.hasDiscount && !outOfStock;

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={outOfStock ? `${product.name} — ناموجود` : product.name}
      className={cn(
        "group relative block rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        outOfStock ? "hover:shadow-md" : "hover:shadow-lg hover:-translate-y-0.5",
      )}
    >
      <FavoriteButton
        productId={product.id}
        product={{ slug: product.slug, name: product.name, coverUrl: product.coverUrl }}
        size="sm"
      />
      {/* Image */}
      <div className="relative aspect-square bg-muted/50 overflow-hidden">
        {product.isSpecialSale && (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-rose-500 to-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
            <Flame className="h-3 w-3" strokeWidth={2.5} />
            فروش ویژه
          </span>
        )}
        {product.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              outOfStock ? "grayscale opacity-70" : "group-hover:scale-105",
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {showDiscount && (
          <span className="absolute bottom-2 right-2 z-10 inline-flex items-center rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
            تخفیف
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-foreground/85 py-1.5 text-[11px] font-semibold tracking-wide text-background backdrop-blur-sm">
            ناموجود
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <Badge variant="secondary" className="text-[10px] py-0">
          {product.category?.name}
        </Badge>
        <p className="text-sm font-semibold line-clamp-2 leading-snug">{product.name}</p>
        {product.colors.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.colors.slice(0, 6).map((c) => (
              <span
                key={c}
                className={cn(
                  "w-4 h-4 rounded-full border border-black/10 shrink-0",
                  outOfStock && "opacity-60",
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            {product.colors.length > 6 && (
              <span className="text-[10px] text-muted-foreground leading-4">
                +{product.colors.length - 6}
              </span>
            )}
          </div>
        )}
        {product.minPrice != null ? (
          <p
            className={cn(
              "text-sm font-bold",
              outOfStock
                ? "text-muted-foreground line-through decoration-1"
                : "text-primary",
            )}
          >
            از {product.minPrice.toLocaleString("fa-IR")}{" "}
            <span
              className={cn(
                "text-xs font-normal",
                outOfStock ? "text-muted-foreground/70" : "text-muted-foreground",
              )}
            >
              تومان
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">قیمت تعیین نشده</p>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-14 bg-muted rounded-full" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}
