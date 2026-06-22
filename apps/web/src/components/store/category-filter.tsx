"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  active?: string;
}

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => select()}
        className={cn(
          "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
          !active
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        )}
      >
        همه
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => select(c.id)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
            active === c.id
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
