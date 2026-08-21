"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ArticleCategory,
  CreateArticleCategoryRequest,
  UpdateArticleCategoryRequest,
} from "@/types";

interface CreatePayload {
  mode: "create";
  data: CreateArticleCategoryRequest;
}
interface UpdatePayload {
  mode: "update";
  data: UpdateArticleCategoryRequest;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload | UpdatePayload) => Promise<void>;
  isPending?: boolean;
  initial?: ArticleCategory;
}

const EMPTY = { name: "", slug: "", description: "", coverUrl: "" };

export function ArticleCategoryModal({ open, onClose, onSubmit, isPending, initial }: Props) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            name: initial.name,
            slug: initial.slug,
            description: initial.description ?? "",
            coverUrl: initial.coverUrl ?? "",
          }
        : EMPTY,
    );
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      coverUrl: form.coverUrl.trim() || undefined,
    };

    if (initial) {
      await onSubmit({ mode: "update", data: trimmed });
    } else {
      await onSubmit({ mode: "create", data: trimmed as CreateArticleCategoryRequest });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {initial ? "ویرایش دسته‌بندی مقاله" : "دسته‌بندی جدید"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-sm">نام</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="راهنمای انتخاب لباس"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug" className="text-sm">
              اسلاگ <span className="text-muted-foreground">(URL)</span>
            </Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="style-guides"
              dir="ltr"
              required
              pattern="[a-z0-9؀-ۿ]+(-[a-z0-9؀-ۿ]+)*"
              title="فقط حروف/اعداد و - (بدون فاصله)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-sm">توضیحات (اختیاری)</Label>
            <textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-cover" className="text-sm">
              کاور <span className="text-muted-foreground">(URL عکس، اختیاری)</span>
            </Label>
            <Input
              id="cat-cover"
              value={form.coverUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
              placeholder="https://storage.elinaclothes.com/..."
              dir="ltr"
              type="url"
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "در حال ذخیره..." : initial ? "بروزرسانی" : "ایجاد"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
