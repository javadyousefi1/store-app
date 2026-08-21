"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
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
import { toast } from "@/lib/toast";
import {
  COVER_ALLOWED_MIME,
  useRemoveCategoryCover,
  useUploadCategoryCover,
} from "@/hooks/use-categories";
import type { Category } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isPending?: boolean;
  initial?: Category;
}

export function CategoryModal({ open, onClose, onSubmit, isPending, initial }: Props) {
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCover = useUploadCategoryCover();
  const removeCover = useRemoveCategoryCover();

  useEffect(() => {
    if (open) setName(initial?.name ?? "");
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(name);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !initial) return;
    try {
      await uploadCover.mutateAsync({ id: initial.id, file });
      toast.success(initial.coverUrl ? "تصویر دسته‌بندی بروزرسانی شد" : "تصویر دسته‌بندی آپلود شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود");
    }
  }

  async function handleRemoveCover() {
    if (!initial) return;
    try {
      await removeCover.mutateAsync(initial.id);
      toast.success("تصویر دسته‌بندی حذف شد");
    } catch {
      toast.error("حذف تصویر ناموفق بود");
    }
  }

  const coverBusy = uploadCover.isPending || removeCover.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="موبایل"
              autoFocus
            />
          </div>

          {initial && (
            <div className="space-y-2">
              <Label>تصویر کاور</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {initial.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={initial.coverUrl}
                      alt={initial.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                  {coverBusy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={coverBusy}
                    >
                      {initial.coverUrl ? "تغییر تصویر" : "آپلود تصویر"}
                    </Button>
                    {initial.coverUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemoveCover}
                        disabled={coverBusy}
                      >
                        <Trash2 className="ml-1 h-3.5 w-3.5" />
                        حذف
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG، PNG یا WebP، حداکثر ۵ مگابایت
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={COVER_ALLOWED_MIME.join(",")}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
