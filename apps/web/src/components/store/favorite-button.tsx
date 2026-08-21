"use client";

import { Heart, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  UnauthenticatedFavoriteError,
  useIsFavorite,
  useToggleFavorite,
} from "@/hooks/use-favorites";

interface Props {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "overlay" | "ghost";
}

const SIZE_BOX: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const SIZE_ICON: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-[18px] w-[18px]",
  lg: "h-5 w-5",
};

export function FavoriteButton({
  productId,
  className,
  size = "md",
  variant = "overlay",
}: Props) {
  const isFav = useIsFavorite(productId);
  const toggle = useToggleFavorite();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toggle.isPending) return;
    try {
      await toggle.mutateAsync({ productId, isFavorite: isFav });
      toast.success(
        isFav ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها افزوده شد",
      );
    } catch (err) {
      if (err instanceof UnauthenticatedFavoriteError) return;
      toast.error("خطا در ذخیره علاقه‌مندی");
    }
  }

  const base =
    variant === "overlay"
      ? "absolute top-2 right-2 z-10 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-sm border border-black/5 transition-all hover:bg-white hover:scale-105 disabled:opacity-60"
      : "inline-flex items-center justify-center rounded-full border bg-card transition-colors hover:bg-muted disabled:opacity-60";

  return (
    <button
      type="button"
      aria-pressed={isFav}
      aria-label={isFav ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      onClick={handleClick}
      disabled={toggle.isPending}
      className={cn(base, SIZE_BOX[size], className)}
    >
      {toggle.isPending ? (
        <Loader2
          className={cn(SIZE_ICON[size], "animate-spin text-muted-foreground")}
        />
      ) : (
        <Heart
          className={cn(
            SIZE_ICON[size],
            "transition-colors",
            isFav ? "fill-red-500 text-red-500" : "text-muted-foreground",
          )}
          strokeWidth={1.8}
        />
      )}
    </button>
  );
}
