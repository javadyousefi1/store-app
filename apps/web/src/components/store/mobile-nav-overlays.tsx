"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronLeft,
  LayoutGrid,
  PackageSearch,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

const fallbackCategories = [
  { id: "fallback:tshirt", name: "تیشرت", query: "تیشرت" },
  { id: "fallback:coat", name: "مانتو", query: "مانتو" },
  { id: "fallback:set", name: "ست", query: "ست" },
  { id: "fallback:pants", name: "شلوار", query: "شلوار" },
  { id: "fallback:shoes", name: "کفش", query: "کفش" },
] as const;

type MobileCategoryOption = {
  id: string;
  name: string;
  slug?: string;
  query?: string;
};

function selectedCategoryIds(params: URLSearchParams): string[] {
  const multiple = params.get("categoryIds");
  if (multiple) return multiple.split(",").filter(Boolean);

  const single = params.get("categoryId");
  return single ? [single] : [];
}

export function MobileCategoryDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: categories } = useCategories(open);
  const categoryOptions: MobileCategoryOption[] = categories?.length
    ? categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))
    : [...fallbackCategories];
  const activeIds = useMemo(
    () => selectedCategoryIds(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const activeSearch = searchParams.get("search") ?? "";
  const activeCategorySlug = useMemo(() => {
    const match = pathname?.match(/^\/category\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [pathname]);

  function selectCategory(category?: MobileCategoryOption) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryIds");
    params.delete("categoryId");
    params.delete("page");

    // "همه محصولات" — drop the fallback search too.
    if (!category) {
      params.delete("search");
      const query = params.toString();
      router.push(query ? `/products?${query}` : "/products");
      onOpenChange(false);
      return;
    }

    // Fallback categories map onto a `search` query — no dedicated slug page.
    if (category.query) {
      params.set("search", category.query);
      const query = params.toString();
      router.push(query ? `/products?${query}` : "/products");
      onOpenChange(false);
      return;
    }

    // Real category — prefer the SEO-friendly /category/<slug> route.
    if (category.slug) {
      params.delete("search");
      const query = params.toString();
      const base = `/category/${encodeURIComponent(category.slug)}`;
      router.push(query ? `${base}?${query}` : base);
      onOpenChange(false);
      return;
    }

    // Legacy path: category without slug (shouldn't happen after migration).
    params.set("categoryId", category.id);
    router.push(`/products?${params}`);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[95] w-[88%] max-w-sm gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-b px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <LayoutGrid className="h-5 w-5 text-primary" />
            دسته‌بندی محصولات
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => selectCategory()}
              className={cn(
                "flex h-13 w-full items-center justify-between rounded-xl px-4 text-right text-sm font-medium transition-colors",
                activeIds.length === 0 && !activeSearch && !activeCategorySlug
                  ? "bg-secondary text-primary"
                  : "hover:bg-muted",
              )}
            >
              همه محصولات
              <ChevronLeft className="h-4 w-4" />
            </button>

            <Link
              href="/articles"
              onClick={() => onOpenChange(false)}
              className="flex h-13 w-full items-center justify-between rounded-xl px-4 text-right text-sm font-medium text-[#4a4d68] transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                مجله الینا
              </span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Link>

            {categoryOptions.map((category) => {
              const active =
                activeIds.includes(category.id) ||
                category.query === activeSearch ||
                (!!category.slug && category.slug === activeCategorySlug);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={cn(
                    "flex h-13 w-full items-center justify-between rounded-xl px-4 text-right text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-primary"
                      : "text-[#4a4d68] hover:bg-muted",
                  )}
                >
                  <span>{category.name}</span>
                  {active ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Mobile product filter dialog — currently only exposes categories. Sort
 * and price were intentionally removed; the URL contract still supports
 * them so we can add UI back later without a schema change.
 */
export function MobileProductFilterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories(open);
  const categoryOptions: MobileCategoryOption[] = categories?.length
    ? categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))
    : [...fallbackCategories];
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(searchParams.toString());
    const selectedIds = selectedCategoryIds(params);
    const fallbackMatch = fallbackCategories.find(
      (category) => category.query === params.get("search"),
    );
    setCategoryIds(
      selectedIds.length
        ? selectedIds
        : fallbackMatch
          ? [fallbackMatch.id]
          : [],
    );
  }, [open, searchParams]);

  function toggleCategory(id: string) {
    // Fallback categories map to a `search` query and can't be combined.
    if (id.startsWith("fallback:")) {
      setCategoryIds((current) => (current.includes(id) ? [] : [id]));
      return;
    }

    setCategoryIds((current) =>
      current.includes(id)
        ? current.filter((categoryId) => categoryId !== id)
        : [...current, id],
    );
  }

  function clearFilters() {
    setCategoryIds([]);
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryId");
    params.delete("categoryIds");
    params.delete("page");

    const fallbackCategory = fallbackCategories.find((category) =>
      categoryIds.includes(category.id),
    );
    const backendCategoryIds = categoryIds.filter(
      (categoryId) => !categoryId.startsWith("fallback:"),
    );

    if (fallbackCategory) {
      params.set("search", fallbackCategory.query);
    } else {
      if (backendCategoryIds.length) {
        params.set("categoryIds", backendCategoryIds.join(","));
      }
      // Drop a stale fallback search left over from a previous filter apply.
      if (
        fallbackCategories.some(
          (category) => category.query === params.get("search"),
        )
      ) {
        params.delete("search");
      }
    }

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[95] grid w-[calc(100%-1.5rem)] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        style={{
          top: "calc(50% - 2.25rem)",
          maxHeight: "calc(100svh - 6.5rem)",
        }}
      >
        <DialogHeader className="border-b bg-gradient-to-l from-brand-50 to-white px-5 py-5">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            فیلتر محصولات
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto bg-[#fcfbfd] px-4 py-4">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(42,31,65,0.04)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <PackageSearch className="h-4 w-4 text-primary" />
              دسته‌بندی
            </h3>
            <div className="grid grid-cols-3 gap-2 min-[520px]:grid-cols-4">
              {categoryOptions.map((category) => {
                const checked = categoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={cn(
                      "flex min-h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 text-xs transition-colors min-[520px]:text-sm",
                      checked
                        ? "border-primary bg-secondary text-primary"
                        : "border-border",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="truncate">{category.name}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <DialogFooter className="m-0 grid grid-cols-[1fr_2fr] gap-2 rounded-none bg-white px-4 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="h-11"
          >
            پاک کردن
          </Button>
          <Button type="button" onClick={applyFilters} className="h-11">
            نمایش محصولات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
