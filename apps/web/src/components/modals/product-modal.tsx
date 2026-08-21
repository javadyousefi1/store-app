"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Product } from "@/types";

interface FormState {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormState) => Promise<void>;
  isPending?: boolean;
  initial?: Product;
  categories: Category[];
}

/**
 * Slugify Persian/English text into URL-safe form matching the backend
 * SLUG_PATTERN: /^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/i
 */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9؀-ۿ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductModal({ open, onClose, onSubmit, isPending, initial, categories }: Props) {
  const [form, setForm] = useState<FormState>({ name: "", slug: "", categoryId: "", description: "", isActive: true });
  // When true, slug auto-syncs with name. Once the admin manually edits the
  // slug (or opens an existing product with a slug), we stop touching it.
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
        categoryId: initial?.categoryId ?? "",
        description: initial?.description ?? "",
        isActive: initial ? initial.isActive : true,
      });
      setSlugTouched(!!initial?.slug);
    }
  }, [open, initial]);

  function updateName(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function updateSlug(value: string) {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug: slugify(value) }));
  }

  function update<K extends Exclude<keyof FormState, "name" | "slug">>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "ویرایش محصول" : "محصول جدید"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نام محصول</Label>
            <Input value={form.name} onChange={(e) => updateName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>
              اسلاگ (URL){" "}
              <span className="text-muted-foreground text-xs" dir="ltr">
                /products/{form.slug || "..."}
              </span>
            </Label>
            <Input
              value={form.slug}
              onChange={(e) => updateSlug(e.target.value)}
              dir="ltr"
              placeholder="my-product-slug"
            />
            <p className="text-xs text-muted-foreground">
              حروف/اعداد لاتین یا فارسی و <code>-</code>. از نام محصول خودکار ساخته می‌شود؛ می‌توانید تغییر دهید.
            </p>
          </div>
          <div className="space-y-2">
            <Label>دسته‌بندی</Label>
            <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>توضیحات <span className="text-muted-foreground text-xs">(اختیاری)</span></Label>
            <Input value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">فعال</Label>
              <p className="text-xs text-muted-foreground">محصول در فروشگاه نمایش داده شود</p>
            </div>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.name || !form.slug || form.slug.length < 2 || !form.categoryId}
            >
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
