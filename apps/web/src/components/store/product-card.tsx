import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-2xl border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="aspect-square bg-muted/50 overflow-hidden">
        {product.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
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
                className="w-4 h-4 rounded-full border border-black/10 shrink-0"
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
          <p className="text-sm font-bold text-primary">
            از {product.minPrice.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-muted-foreground">تومان</span>
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
