"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  active?: string;
}

/**
 * Horizontal category scroller. Same layout on mobile and desktop but scaled
 * up on ≥sm — circular category covers with the name underneath, an "همه"
 * (all) chip at the start, subtle fade-out edges to hint at overflow, and a
 * primary ring on the active item.
 *
 * Selecting a category rewrites the URL — the products page reads it back
 * server-side and re-fetches. `page` is dropped so the shopper always lands
 * on page 1 of the new filter.
 */
export function CategoryFilter({ categories, active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(id?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryIds");
    if (id) params.set("categoryId", id);
    else params.delete("categoryId");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  return (
    <div className="relative">
      {/* Fade masks — hidden on mobile where the scrollbar is invisible anyway
          and the whole thing usually fits on one screen after "همه" + a few. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-10 bg-gradient-to-l from-background to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-10 bg-gradient-to-r from-background to-transparent sm:block" />

      <div
        className={cn(
          "scrollbar-none flex snap-x snap-mandatory items-start gap-3 overflow-x-auto",
          // Extra padding on desktop so items don't disappear under the fade masks.
          "px-1 py-2 sm:gap-5 sm:px-6 sm:py-3",
        )}
      >
        <CategoryChip
          selected={!active}
          label="همه"
          icon={LayoutGrid}
          onClick={() => select()}
        />

        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            selected={active === category.id}
            label={category.name}
            coverUrl={category.coverUrl ?? null}
            onClick={() => select(category.id)}
          />
        ))}
      </div>
    </div>
  );
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

interface ChipProps {
  selected: boolean;
  label: string;
  coverUrl?: string | null;
  /** Used only when there's no coverUrl — otherwise the image wins. */
  icon?: IconType;
  onClick: () => void;
}

function CategoryChip({ selected, label, coverUrl, icon, onClick }: ChipProps) {
  const FallbackIcon = icon ?? Shirt;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex shrink-0 snap-start flex-col items-center gap-1.5 outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-2xl",
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full transition-all duration-200",
          // Sizes: mobile 56px, sm+ 72px
          "h-14 w-14 sm:h-[72px] sm:w-[72px]",
          selected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_8px_20px_rgba(31,35,48,0.16)]"
            : "ring-1 ring-border ring-offset-2 ring-offset-background group-hover:ring-primary/40 group-hover:shadow-[0_6px_16px_rgba(31,35,48,0.10)]",
        )}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-transform duration-300",
              "group-hover:scale-[1.06]",
              selected && "scale-[1.02]",
            )}
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full items-center justify-center transition-colors",
              selected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground group-hover:text-primary",
            )}
          >
            <FallbackIcon
              className="h-5 w-5 sm:h-6 sm:w-6"
              strokeWidth={selected ? 2.2 : 1.8}
            />
          </span>
        )}
      </span>

      <span
        className={cn(
          "line-clamp-1 max-w-[76px] text-center text-[11px] font-medium leading-4 transition-colors sm:max-w-[88px] sm:text-xs",
          selected
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>

      {/* Active indicator: subtle underline dot below the label */}
      <span
        className={cn(
          "h-0.5 w-6 rounded-full transition-colors sm:w-8",
          selected ? "bg-primary" : "bg-transparent",
        )}
      />
    </button>
  );
}
