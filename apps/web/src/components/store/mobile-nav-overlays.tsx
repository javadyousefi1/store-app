"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  LayoutGrid,
  PackageSearch,
  RotateCcw,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

type SortValue = "newest" | "price_asc" | "price_desc";

const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
];

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
  const { data: categories } = useCategories(open);
  const categoryOptions: MobileCategoryOption[] = categories?.length
    ? categories.map((category) => ({
        id: category.id,
        name: category.name,
      }))
    : [...fallbackCategories];
  const activeIds = useMemo(
    () => selectedCategoryIds(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const activeSearch = searchParams.get("search") ?? "";

  function selectCategory(category?: MobileCategoryOption) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryIds");
    params.delete("categoryId");
    params.delete("page");

    if (category?.query) params.set("search", category.query);
    else if (category) params.set("categoryId", category.id);
    else params.delete("search");

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
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
                activeIds.length === 0 && !activeSearch
                  ? "bg-secondary text-primary"
                  : "hover:bg-muted",
              )}
            >
              همه محصولات
              <ChevronLeft className="h-4 w-4" />
            </button>

            {categoryOptions.map((category) => {
              const active =
                activeIds.includes(category.id) ||
                category.query === activeSearch;
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
      }))
    : [...fallbackCategories];
  const [sort, setSort] = useState<SortValue>("newest");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    if (!open) return;

    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort");
    setSort(
      currentSort === "price_asc" || currentSort === "price_desc"
        ? currentSort
        : "newest",
    );
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
    setMinPrice(params.get("minPrice") ?? "");
    setMaxPrice(params.get("maxPrice") ?? "");
  }, [open, searchParams]);

  function toggleCategory(id: string) {
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
    setSort("newest");
    setCategoryIds([]);
    setMinPrice("");
    setMaxPrice("");
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

      if (
        fallbackCategories.some(
          (category) => category.query === params.get("search"),
        )
      ) {
        params.delete("search");
      }
    }

    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

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

        <div className="min-h-0 space-y-4 overflow-y-auto bg-[#fcfbfd] px-4 py-4">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(42,31,65,0.04)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <RotateCcw className="h-4 w-4 text-primary" />
              مرتب‌سازی
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSort(option.value)}
                  className={cn(
                    "h-10 rounded-xl border px-2 text-xs font-medium transition-colors",
                    sort === option.value
                      ? "border-primary bg-secondary text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(42,31,65,0.04)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <PackageSearch className="h-4 w-4 text-primary" />
              نوع محصول
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

          <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(42,31,65,0.04)]">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <WalletCards className="h-4 w-4 text-primary" />
                بازه قیمت
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                مبلغ به تومان
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
                <span>از قیمت</span>
                <Input
                  value={minPrice}
                  onChange={(event) =>
                    setMinPrice(event.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="۰"
                  className="h-12 rounded-xl bg-muted/30 px-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
                <span>تا قیمت</span>
                <Input
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(event.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="بدون محدودیت"
                  className="h-12 rounded-xl bg-muted/30 px-3 text-sm"
                />
              </label>
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
