"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  LayoutGrid,
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
  const { data: categories, isLoading } = useCategories();
  const activeIds = useMemo(
    () => selectedCategoryIds(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  function selectCategory(categoryId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoryIds");
    params.delete("page");

    if (categoryId) params.set("categoryId", categoryId);
    else params.delete("categoryId");

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
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              در حال بارگذاری...
            </p>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => selectCategory()}
                className={cn(
                  "flex h-13 w-full items-center justify-between rounded-xl px-4 text-right text-sm font-medium transition-colors",
                  activeIds.length === 0
                    ? "bg-secondary text-primary"
                    : "hover:bg-muted",
                )}
              >
                همه محصولات
                <ChevronLeft className="h-4 w-4" />
              </button>

              {categories?.map((category) => {
                const active = activeIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
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
          )}
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
  const { data: categories } = useCategories();
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
    setCategoryIds(selectedCategoryIds(params));
    setMinPrice(params.get("minPrice") ?? "");
    setMaxPrice(params.get("maxPrice") ?? "");
  }, [open, searchParams]);

  function toggleCategory(id: string) {
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
    params.delete("page");

    if (categoryIds.length) params.set("categoryIds", categoryIds.join(","));
    else params.delete("categoryIds");

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
      <DialogContent className="z-[95] max-h-[82svh] w-[calc(100%-1.5rem)] max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            فیلتر محصولات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-bold">مرتب‌سازی</h3>
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

          <section className="space-y-3">
            <h3 className="text-sm font-bold">نوع محصول</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((category) => {
                const checked = categoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition-colors",
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
                    <span>{category.name}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">بازه قیمت</h3>
              <p className="mt-1 text-xs text-muted-foreground">مبلغ به تومان</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs text-muted-foreground">
                از قیمت
                <Input
                  value={minPrice}
                  onChange={(event) =>
                    setMinPrice(event.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="۰"
                  className="h-11"
                />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">
                تا قیمت
                <Input
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(event.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="بدون محدودیت"
                  className="h-11"
                />
              </label>
            </div>
          </section>
        </div>

        <DialogFooter className="m-0 grid grid-cols-[1fr_2fr] gap-2 rounded-none px-5 py-4">
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
