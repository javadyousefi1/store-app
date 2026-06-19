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

export function ProductModal({ open, onClose, onSubmit, isPending, initial, categories }: Props) {
  const [form, setForm] = useState<FormState>({ name: "", categoryId: "", description: "", isActive: true });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        categoryId: initial?.categoryId ?? "",
        description: initial?.description ?? "",
        isActive: initial ? initial.isActive : true,
      });
    }
  }, [open, initial]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
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
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} autoFocus />
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
            <Button type="submit" disabled={isPending || !form.name || !form.categoryId}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
