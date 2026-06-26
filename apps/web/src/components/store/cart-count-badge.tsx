"use client";

import { cn } from "@/lib/utils";
import { useCartCount } from "@/hooks/use-cart";

export function CartCountBadge({ className }: { className?: string }) {
  const count = useCartCount();

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white",
        className,
      )}
      aria-hidden="true"
    >
      {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
    </span>
  );
}
