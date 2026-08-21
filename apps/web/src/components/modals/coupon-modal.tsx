"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import type {
  Coupon,
  CouponScopeType,
  CreateCouponRequest,
  UpdateCouponRequest,
} from "@/types";

interface CreatePayload {
  mode: "create";
  data: CreateCouponRequest;
}

interface UpdatePayload {
  mode: "update";
  data: UpdateCouponRequest;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload | UpdatePayload) => Promise<void>;
  isPending?: boolean;
  initial?: Coupon;
}

const EMPTY_FORM = {
  code: "",
  percentage: "",
  maxDiscountAmount: "",
  quantity: "",
  scopeType: "product" as CouponScopeType,
  scopeId: "",
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

export function CouponModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initial,
}: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [scopeSearch, setScopeSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        code: initial.code,
        percentage: String(initial.percentage),
        maxDiscountAmount: String(initial.maxDiscountAmount),
        quantity: String(initial.quantity),
        scopeType: initial.scopeType,
        scopeId: initial.scopeId,
        isActive: initial.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setScopeSearch("");
  }, [open, initial]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEdit && initial) {
      const data: UpdateCouponRequest = {};
      const percentage = Number(form.percentage);
      const maxDiscount = Number(form.maxDiscountAmount);
      const quantity = Number(form.quantity);
      if (form.isActive !== initial.isActive) data.isActive = form.isActive;
      if (percentage !== initial.percentage) data.percentage = percentage;
      if (maxDiscount !== initial.maxDiscountAmount) data.maxDiscountAmount = maxDiscount;
      if (quantity !== initial.quantity) data.quantity = quantity;
      await onSubmit({ mode: "update", data });
    } else {
      const data: CreateCouponRequest = {
        code: form.code.trim().toUpperCase(),
        percentage: Number(form.percentage),
        maxDiscountAmount: Number(form.maxDiscountAmount),
        quantity: Number(form.quantity),
        scopeType: form.scopeType,
        scopeId: form.scopeId,
        isActive: form.isActive,
      };
      await onSubmit({ mode: "create", data });
    }
  }

  const canSubmit = isEdit
    ? Number(form.percentage) > 0 && Number(form.maxDiscountAmount) > 0 && Number(form.quantity) > 0
    : Boolean(
        form.code.trim() &&
          Number(form.percentage) > 0 &&
          Number(form.maxDiscountAmount) > 0 &&
          Number(form.quantity) > 0 &&
          form.scopeId,
      );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>کد</Label>
            <Input
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              disabled={isEdit || isPending}
              dir="ltr"
              autoFocus={!isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                کد قابل تغییر نیست — برای جایگزینی، کد جدید بسازید و این کد را غیرفعال کنید.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>درصد تخفیف</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.percentage}
                onChange={(e) => update("percentage", e.target.value)}
                placeholder="20"
                disabled={isPending}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>سقف تخفیف (تومان)</Label>
              <Input
                type="number"
                min={0}
                value={form.maxDiscountAmount}
                onChange={(e) => update("maxDiscountAmount", e.target.value)}
                placeholder="100000"
                disabled={isPending}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ظرفیت کل</Label>
            <Input
              type="number"
              min={isEdit ? initial?.usedCount ?? 1 : 1}
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              placeholder="100"
              disabled={isPending}
              dir="ltr"
            />
            {isEdit && initial && (
              <p className="text-xs text-muted-foreground">
                تاکنون {initial.usedCount.toLocaleString("fa-IR")} بار استفاده شده.
                ظرفیت نمی‌تواند کمتر از این مقدار باشد.
              </p>
            )}
          </div>

          {!isEdit && (
            <ScopePicker
              type={form.scopeType}
              id={form.scopeId}
              search={scopeSearch}
              onSearchChange={setScopeSearch}
              onChange={(type, id) => {
                setForm((f) => ({ ...f, scopeType: type, scopeId: id }));
              }}
              disabled={isPending}
            />
          )}

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="coupon-active">فعال</Label>
              <p className="text-xs text-muted-foreground">
                در صورت غیرفعال بودن، کاربران نمی‌توانند از کد استفاده کنند.
              </p>
            </div>
            <Switch
              id="coupon-active"
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ScopePickerProps {
  type: CouponScopeType;
  id: string;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (type: CouponScopeType, id: string) => void;
  disabled?: boolean;
}

function ScopePicker({
  type,
  id,
  search,
  onSearchChange,
  onChange,
  disabled,
}: ScopePickerProps) {
  const categoriesQuery = useCategories(type === "category");
  const productsQuery = useProducts(1);
  // useProducts returns first page of 20 — enough for most stores; if more
  // are needed we can extend the hook to accept a limit.

  const items = useMemo(() => {
    if (type === "category") {
      return (categoriesQuery.data ?? []).map((c) => ({ id: c.id, name: c.name }));
    }
    return (productsQuery.data?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  }, [type, categoriesQuery.data, productsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const isLoading =
    type === "category" ? categoriesQuery.isLoading : productsQuery.isLoading;

  return (
    <div className="space-y-2">
      <Label>اسکوپ تخفیف</Label>
      <div className="flex gap-1.5 rounded-lg border bg-muted/40 p-1">
        {(["product", "category"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(opt, "");
              onSearchChange("");
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              type === opt
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt === "product" ? "یک محصول" : "یک دسته‌بندی"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={type === "product" ? "جستجوی محصول..." : "جستجوی دسته‌بندی..."}
          className="ps-2.5 pe-8"
          disabled={disabled}
        />
      </div>

      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            موردی یافت نشد
          </p>
        ) : (
          filtered.map((item) => {
            const selected = item.id === id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(type, item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-start transition-colors",
                  selected
                    ? "bg-primary/5 text-primary"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="truncate">{item.name}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
