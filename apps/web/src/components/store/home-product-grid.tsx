"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeProduct = {
  name: string;
  price: string;
  image: string;
};

export function HomeProductGrid({
  products,
}: {
  products: readonly HomeProduct[];
}) {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());

  const toggleLike = (name: string) => {
    setLiked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addToCart = (name: string) => {
    setAdded((current) => new Set(current).add(name));
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {products.map((product) => {
        const isLiked = liked.has(product.name);
        const isAdded = added.has(product.name);

        return (
          <article
            key={product.name}
            className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.1)]"
          >
            <button
              type="button"
              onClick={() => toggleLike(product.name)}
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur"
              aria-label={`${isLiked ? "حذف" : "افزودن"} ${product.name} ${
                isLiked ? "از" : "به"
              } علاقه‌مندی‌ها`}
              aria-pressed={isLiked}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition",
                  isLiked ? "fill-primary text-primary" : "text-[#625b67]",
                )}
              />
            </button>
            <Link
              href="/products"
              className="relative block aspect-[3/4] overflow-hidden bg-muted"
              aria-label={`مشاهده ${product.name}`}
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                className="object-cover transition duration-500 group-hover:scale-[1.035]"
              />
            </Link>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="min-w-0 truncate text-right text-xs font-medium text-[#37303d] sm:text-sm">
                  {product.name}
                </h3>
                <p className="shrink-0 text-xs font-bold text-primary sm:text-sm">
                  <span className="sr-only">قیمت </span>
                  {product.price}
                  <span className="sr-only"> تومان</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => addToCart(product.name)}
                className={cn(
                  "mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition",
                  isAdded
                    ? "bg-secondary text-primary"
                    : "bg-primary text-primary-foreground shadow-sm hover:bg-brand-700",
                )}
                aria-live="polite"
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    افزوده شد
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    افزودن به سبد
                  </>
                )}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
