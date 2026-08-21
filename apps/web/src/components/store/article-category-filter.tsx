"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ArticleCategory } from "@/types";

interface Props {
  categories: ArticleCategory[];
  activeSlug?: string;
}

/**
 * Horizontal chip-style category filter for the blog. Rewrites the URL query
 * so the server component re-fetches. `page` is dropped so switching filter
 * always lands on page 1.
 */
export function ArticleCategoryFilter({ categories, activeSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/articles?${query}` : "/articles");
  }

  return (
    <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 py-1 sm:gap-3">
      <Chip label="همه" selected={!activeSlug} onClick={() => select()} />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          selected={activeSlug === category.slug}
          onClick={() => select(category.slug)}
        />
      ))}
    </div>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-[#4a4d68] hover:border-primary/40 hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
