"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileProductFilterDialog = dynamic(
  () =>
    import("./mobile-nav-overlays").then(
      (mod) => mod.MobileProductFilterDialog,
    ),
  { ssr: false },
);

/**
 * Floating filter button — mobile only. Sits above the bottom nav (68px + safe
 * area) and opens the category filter dialog. Shows a small dot when a filter
 * is currently applied so shoppers can tell at a glance.
 */
export function ProductsFilterFab() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const hasActiveFilter = Boolean(
    searchParams.get("categoryId") || searchParams.get("categoryIds"),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فیلتر محصولات"
        aria-haspopup="dialog"
        className={cn(
          "fixed z-[90] flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground",
          "shadow-[0_12px_32px_rgba(31,35,48,0.28)] ring-1 ring-primary/30",
          "transition-all hover:scale-[1.03] active:scale-95",
          // Position: bottom-right on RTL feels like left visually. Keep it
          // clear of the 68px bottom nav + the iOS home indicator.
          "bottom-[calc(88px+env(safe-area-inset-bottom))] left-4",
          // Only visible on mobile — desktop has its own filter UI.
          "lg:hidden",
        )}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <SlidersHorizontal className="h-5 w-5" strokeWidth={2.2} />
          {hasActiveFilter && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-primary" />
          )}
        </span>
        فیلتر
      </button>

      <MobileProductFilterDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
