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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import {
  SLIDER_IMAGE_ALLOWED_MIME,
  useRemoveSliderImage,
  useUploadSliderImage,
  type SliderVariant,
} from "@/hooks/use-sliders";
import type { CreateSliderRequest, Slider } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSliderRequest) => Promise<void>;
  isPending?: boolean;
  initial?: Slider;
}

interface ImageSlotProps {
  label: string;
  helper: string;
  url: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  busy: boolean;
}

function ImageSlot({ label, helper, url, onUpload, onRemove, busy }: ImageSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          {busy && (
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
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {url ? "تغییر" : "آپلود"}
            </Button>
            {url && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onRemove}
                disabled={busy}
              >
                <Trash2 className="ml-1 h-3.5 w-3.5" />
                حذف
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={SLIDER_IMAGE_ALLOWED_MIME.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onUpload(file);
        }}
      />
    </div>
  );
}

export function SliderModal({ open, onClose, onSubmit, isPending, initial }: Props) {
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const upload = useUploadSliderImage();
  const remove = useRemoveSliderImage();

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setLinkUrl(initial?.linkUrl ?? "");
    setIsActive(initial?.isActive ?? true);
    setSortOrder(initial?.sortOrder ?? 0);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: title.trim(),
      linkUrl: linkUrl.trim() || null,
      isActive,
      sortOrder,
    });
  }

  async function handleUpload(variant: SliderVariant, file: File) {
    if (!initial) return;
    try {
      await upload.mutateAsync({ id: initial.id, variant, file });
      toast.success("تصویر بارگذاری شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "آپلود ناموفق");
    }
  }

  async function handleRemove(variant: SliderVariant) {
    if (!initial) return;
    try {
      await remove.mutateAsync({ id: initial.id, variant });
      toast.success("تصویر حذف شد");
    } catch {
      toast.error("حذف ناموفق");
    }
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "ویرایش اسلاید" : "اسلاید جدید"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="کالکشن تابستانه"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>لینک (اختیاری)</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/products?categoryId=..."
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ترتیب نمایش</Label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>فعال</Label>
              </div>
            </div>
          </div>

          {initial ? (
            <div className="space-y-3 border-t pt-4">
              <ImageSlot
                label="تصویر دسکتاپ"
                helper="نسبت پیشنهادی 21:9، حداکثر ۵ مگابایت"
                url={initial.desktopImageUrl}
                onUpload={(f) => handleUpload("desktop", f)}
                onRemove={() => handleRemove("desktop")}
                busy={busy}
              />
              <ImageSlot
                label="تصویر موبایل"
                helper="نسبت پیشنهادی 9:4.6، حداکثر ۵ مگابایت"
                url={initial.mobileImageUrl}
                onUpload={(f) => handleUpload("mobile", f)}
                onRemove={() => handleRemove("mobile")}
                busy={busy}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              پس از ذخیره، تصاویر دسکتاپ و موبایل را از همین فرم آپلود کنید.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
