"use client";

import { use, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Plus, Pencil, Trash2, Upload, ImageIcon, X, BellRing, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { VariantModal, ConfirmDeleteModal } from "@/components/modals";
import { useProduct, useUploadProductCover, useDeleteProductCover, useNotifyProduct } from "@/hooks/use-products";
import { useCreateVariant, useUpdateVariant, useDeleteVariant, useUploadVariantImage, useDeleteVariantImage } from "@/hooks/use-variants";
import { useAttributeOptions } from "@/hooks/use-attribute-options";
import { useModal } from "@/hooks/use-modal";
import { formatPrice } from "@/lib/format";
import { compressImage } from "@/lib/compress-image";
import type { ProductVariant } from "@/types";

type VariantForm = { price: string; stock: string; attributes: Record<string, string> };

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);
  const { data: attrOptions } = useAttributeOptions();

  const uploadCover = useUploadProductCover();
  const deleteCover = useDeleteProductCover();
  const notify = useNotifyProduct();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const createVariant = useCreateVariant(id);
  const updateVariant = useUpdateVariant(id);
  const deleteVariant = useDeleteVariant(id);
  const uploadImage = useUploadVariantImage(id);
  const deleteImage = useDeleteVariantImage(id);

  const variantFormModal = useModal<ProductVariant>();
  const deleteVariantModal = useModal<ProductVariant>();
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      await uploadCover.mutateAsync({ id, file: compressed });
      toast.success("کاور آپلود شد");
    } catch {
      toast.error("خطا در آپلود کاور");
    }
    e.target.value = "";
  }

  async function handleVariantSubmit(form: VariantForm) {
    try {
      if (variantFormModal.data) {
        await updateVariant.mutateAsync({
          variantId: variantFormModal.data.id,
          data: { price: Number(form.price), stock: Number(form.stock), attributes: form.attributes },
        });
        toast.success("variant ویرایش شد");
      } else {
        await createVariant.mutateAsync({
          price: Number(form.price),
          stock: Number(form.stock),
          attributes: form.attributes,
        });
        toast.success("variant ایجاد شد");
      }
      variantFormModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ذخیره");
    }
  }

  async function handleDeleteVariant() {
    if (!deleteVariantModal.data) return;
    try {
      await deleteVariant.mutateAsync(deleteVariantModal.data.id);
      toast.success("variant حذف شد");
      deleteVariantModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  async function handleImageUpload(variantId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      await uploadImage.mutateAsync({ variantId, file: compressed });
      toast.success("تصویر آپلود شد");
    } catch {
      toast.error("خطا در آپلود");
    }
    e.target.value = "";
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-muted-foreground">محصول یافت نشد</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/panel/products" className="hover:text-foreground flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          محصولات
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </div>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="truncate">{product.name}</CardTitle>
                {product.notified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    ارسال شد
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{product.category?.name}</p>
              {product.description && <p className="text-sm mt-1">{product.description}</p>}
              {!product.notified && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1.5 text-xs"
                  disabled={notify.isPending}
                  onClick={async () => {
                    try {
                      const res = await notify.mutateAsync(id);
                      if (res.notified) toast.success("نوتیفیکیشن به بله ارسال شد");
                      else toast.warning("توکن بله ست نشده یا کاربری subscribe نکرده");
                    } catch {
                      toast.error("خطا در ارسال نوتیف");
                    }
                  }}
                >
                  {notify.isPending
                    ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    : <BellRing className="h-3.5 w-3.5" />
                  }
                  ارسال به بله
                </Button>
              )}
            </div>

            {/* Cover */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                {product.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.coverUrl} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-1">
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => coverInputRef.current?.click()} disabled={uploadCover.isPending}>
                  <Upload className="h-3 w-3" />
                  {uploadCover.isPending ? "..." : "آپلود"}
                </Button>
                {product.coverUrl && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteCover.mutateAsync(id).then(() => toast.success("کاور حذف شد"))} disabled={deleteCover.isPending}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Variants</h3>
          <Button size="sm" className="gap-2" onClick={() => variantFormModal.open()}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Variant جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>

        {product.variants.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            هیچ variant‌ای وجود ندارد
          </div>
        ) : (
          <div className="space-y-4">
            {product.variants.map((variant) => (
              <Card key={variant.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(variant.attributes).map(([k, v]) => (
                          <Badge key={k} variant="outline">{k}: {v}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">{variant.sku}</span>
                      </div>
                      <div className="flex gap-4 text-sm flex-wrap">
                        <span>قیمت: <span className="font-medium">{formatPrice(variant.price)} ریال</span></span>
                        <span>موجودی: <span className="font-medium">{variant.stock}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => variantFormModal.open(variant)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteVariantModal.open(variant)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Images */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تصاویر ({variant.imageUrls?.length ?? 0})</span>
                      <div>
                        <input
                          ref={(el) => { imageInputRefs.current[variant.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(variant.id, e)}
                        />
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => imageInputRefs.current[variant.id]?.click()} disabled={uploadImage.isPending}>
                          <Upload className="h-3 w-3" />
                          آپلود
                        </Button>
                      </div>
                    </div>
                    {(variant.imageUrls?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {variant.imageUrls.map((url, i) => (
                          <div key={variant.imageIds?.[i] ?? i} className="relative group w-16 h-16 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="rounded border object-cover w-full h-full" />
                            <button
                              onClick={() => deleteImage.mutateAsync({ variantId: variant.id, imageId: variant.imageIds[i] }).then(() => toast.success("تصویر حذف شد"))}
                              className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <VariantModal
        open={variantFormModal.isOpen}
        onClose={variantFormModal.close}
        onSubmit={handleVariantSubmit}
        isPending={createVariant.isPending || updateVariant.isPending}
        initial={variantFormModal.data}
        attrOptions={attrOptions ?? []}
      />

      <ConfirmDeleteModal
        open={deleteVariantModal.isOpen}
        onClose={deleteVariantModal.close}
        onConfirm={handleDeleteVariant}
        isPending={deleteVariant.isPending}
        title="حذف Variant"
        description="این variant و تمام تصاویرش حذف خواهند شد. آیا مطمئن هستید؟"
      />
    </div>
  );
}
