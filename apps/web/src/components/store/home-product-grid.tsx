"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "@/lib/toast";
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
  const [added, setAdded] = useState<Set<string>>(new Set());

  const addToCart = (name: string) => {
    setAdded((current) => new Set(current).add(name));
    toast.success("به سبد خرید افزوده شد");
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {products.map((product) => {
        const isAdded = added.has(product.name);

        return (
          <article
            key={product.name}
            className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.1)]"
          >
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
                    به سبد خرید افزوده شد
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
