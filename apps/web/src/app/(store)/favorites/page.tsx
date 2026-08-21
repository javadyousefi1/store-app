"use client";

import Link from "next/link";
import { ChevronLeft, Heart, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/store/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuthSession } from "@/hooks/use-auth";
import { triggerAuthModal } from "@/lib/auth-modal-trigger";

export default function FavoritesPage() {
  const { data: session, isFetched: sessionReady } = useAuthSession();
  const { data, isLoading } = useFavorites();

  if (sessionReady && !session) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
        <Heart className="mx-auto h-12 w-12 text-primary/35" />
        <h1 className="text-xl font-bold text-[#3f4064]">علاقه‌مندی‌ها</h1>
        <p className="text-sm text-muted-foreground">
          برای مشاهده علاقه‌مندی‌ها ابتدا وارد حساب کاربری شوید.
        </p>
        <Button onClick={() => triggerAuthModal()}>ورود به حساب</Button>
      </div>
    );
  }

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {data.map((item) => (
          <Link
            key={item.favoriteId}
            href={`/products/${item.product.slug}`}
            className="group relative block overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FavoriteButton productId={item.productId} size="sm" />
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
        ))}
      </div>
    </div>
  );
}
