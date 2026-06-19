"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

const FILTER_ALL = "all";

interface Props {
  products: Product[];
  categories: Category[];
}

export function BestsellersSection({ products, categories }: Props) {
  const [active, setActive] = useState(FILTER_ALL);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const filtered = active === FILTER_ALL
    ? products
    : products.filter((p) => p.categoryId === active);

  return (
    <section className="py-6 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-bold text-zinc-900 mb-4 text-right">پرفروش‌ها</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 justify-end flex-row-reverse scrollbar-none">
        <button
          onClick={() => setActive(FILTER_ALL)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
            active === FILTER_ALL
              ? "bg-zinc-900 text-white border-zinc-900"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
          )}
        >
          همه
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              active === c.id
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        {filtered.slice(0, 8).map((p) => (
          <div key={p.id} className="relative bg-white rounded-2xl border overflow-hidden group">
            {/* Heart */}
            <button
              onClick={() =>
                setLiked((prev) => {
                  const next = new Set(prev);
                  next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                  return next;
                })
              }
              className="absolute top-2 start-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur"
            >
              <Heart
                className={cn("h-4 w-4 transition-colors", liked.has(p.id) ? "fill-red-500 text-red-500" : "text-zinc-400")}
              />
            </button>

            {/* Image */}
            <Link href={`/products/${p.id}`} className="block aspect-[3/4] bg-zinc-50 overflow-hidden">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-zinc-200" />
                </div>
              )}
            </Link>

            {/* Info */}
            <div className="p-3 space-y-1.5">
              <p className="text-sm font-medium line-clamp-1 text-right">{p.name}</p>
              {p.minPrice != null ? (
                <p className="text-sm font-bold text-zinc-900 text-right">
                  {p.minPrice.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-normal text-zinc-400">تومان</span>
                </p>
              ) : (
                <p className="text-xs text-zinc-400 text-right">قیمت تعیین نشده</p>
              )}
              {p.colors.length > 0 && (
                <div className="flex gap-1 justify-end flex-wrap">
                  {p.colors.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {p.colors.length > 4 && (
                    <span className="text-[10px] text-zinc-400 leading-[14px]">+{p.colors.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-12 text-zinc-400">محصولی یافت نشد</p>
      )}

      {products.length > 0 && (
        <div className="text-center mt-5">
          <Link
            href="/products"
            className="inline-block border border-zinc-300 text-zinc-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            مشاهده همه محصولات
          </Link>
        </div>
      )}
      </div>
    </section>
  );
}
