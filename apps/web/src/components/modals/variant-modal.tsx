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
import type { Attribute, ProductVariant } from "@/types";

interface VariantForm {
  price: string;
  stock: string;
  attributes: Record<string, string>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VariantForm) => Promise<void>;
  isPending?: boolean;
  initial?: ProductVariant;
  attrOptions: Attribute[];
}

export function VariantModal({ open, onClose, onSubmit, isPending, initial, attrOptions }: Props) {
  const [form, setForm] = useState<VariantForm>({ price: "", stock: "", attributes: {} });

  const attrGroups = attrOptions.reduce<Record<string, string[]>>((acc, attr) => {
    acc[attr.name] = attr.values.map((v) => v.value);
    return acc;
  }, {});

  useEffect(() => {
    if (open) {
      setForm({
        price: initial?.price ?? "",
        stock: initial ? String(initial.stock) : "",
        attributes: initial ? { ...initial.attributes } : {},
      });
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  function toggleAttr(attr: string, val: string) {
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [attr]: val } }));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "ویرایش Variant" : "Variant جدید"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>قیمت (ریال)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                dir="ltr"
                placeholder="59900000"
              />
            </div>
            <div className="space-y-2">
              <Label>موجودی</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                dir="ltr"
                placeholder="10"
              />
            </div>
          </div>

          {Object.keys(attrGroups).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              هیچ ویژگی‌ای تعریف نشده — ابتدا از بخش ویژگی‌ها اضافه کنید
            </p>
          )}

          {Object.entries(attrGroups).map(([attr, values]) => (
            <div key={attr} className="space-y-2">
              <Label>{attr}</Label>
              <div className="flex flex-wrap gap-2">
                {values.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleAttr(attr, val)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.attributes[attr] === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending || !form.price || !form.stock}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
