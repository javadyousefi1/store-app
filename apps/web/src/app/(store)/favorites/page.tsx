"use client";

import Link from "next/link";
import { ChevronLeft, Heart, ImageIcon, LogIn } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FavoriteButton } from "@/components/store/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuthSession } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { data: session, isFetched: sessionReady } = useAuthSession();
  const { data, isLoading } = useFavorites();
  const isGuest = sessionReady && !session;

  if (!sessionReady || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
        <Heart className="mx-auto h-12 w-12 text-primary/35" />
        <h1 className="text-xl font-bold text-[#3f4064]">علاقه‌مندی‌ها</h1>
        <p className="text-sm text-muted-foreground">
          هنوز محصولی به علاقه‌مندی‌های شما اضافه نشده است.
        </p>
        <Link href="/products">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            مشاهده محصولات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">علاقه‌مندی‌ها</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.length.toLocaleString("fa-IR")} محصول
        </p>
      </div>

      {isGuest && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-6">
              علاقه‌مندی‌هایت در این مرورگر ذخیره شده. برای همگام‌سازی روی
              همه دستگاه‌ها وارد حساب کاربری شو.
            </span>
          </div>
          <Link
            href="/login?next=/favorites"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 whitespace-nowrap",
            )}
          >
            <LogIn className="h-3.5 w-3.5" />
            ورود به حساب
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {data.map((item) => {
          const href = item.product.slug
            ? `/products/${encodeURIComponent(item.product.slug)}`
            : "/products";
          return (
            <Link
              key={item.favoriteId}
              href={href}
              className="group relative block overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FavoriteButton
                productId={item.productId}
                product={{
                  slug: item.product.slug,
                  name: item.product.name,
                  coverUrl: item.product.coverUrl,
                }}
                size="sm"
              />
              <div className="aspect-square overflow-hidden bg-muted/50">
                {item.product.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.coverUrl}
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {item.product.name || "—"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
