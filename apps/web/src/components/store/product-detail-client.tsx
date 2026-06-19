"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "./image-gallery";
import { VariantSelector } from "./variant-selector";
import { AddToCart } from "./add-to-cart";
import { useNotifyMe, useRegisterNotifyMe } from "@/hooks/use-variants";
import type { ProductDetail, ProductVariant } from "@/types";

type VariantWithReserved = ProductVariant & { reserved?: number };

interface Props {
  product: ProductDetail & {
    variants: VariantWithReserved[];
    coverUrl: string | null;
  };
  valueLabels?: Record<string, string>;
}

function available(v: VariantWithReserved) {
  return (v.stock ?? 0) - (v.reserved ?? 0);
}

export function ProductDetailClient({ product, valueLabels = {} }: Props) {
  const { variants } = product;

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = variants.find((v) => available(v) > 0) ?? variants[0];
    return first ? { ...first.attributes } : {};
  });

  const matched =
    variants.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val)
    ) ?? null;

  const isOutOfStock = matched !== null && available(matched) <= 0;
  const { data: notifyStatus } = useNotifyMe(isOutOfStock ? (matched?.id ?? null) : null);
  const registerNotify = useRegisterNotifyMe(matched?.id ?? "");

  async function handleNotifyMe() {
    try {
      await registerNotify.mutateAsync();
      toast.success("وقتی موجود بشه SMS می‌گیری");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.info("قبلاً ثبت کرده بودی");
      else toast.error("خطا در ثبت درخواست");
    }
  }

  function handleAttrChange(key: string, val: string) {
    setSelected((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <ImageGallery
        variantImageUrls={matched?.imageUrls ?? []}
        coverUrl={product.coverUrl}
      />

      {/* Details */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Badge variant="secondary">{product.category?.name}</Badge>
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
        </div>

        {/* Variant selector */}
        <VariantSelector
          variants={variants}
          selected={selected}
          onChange={handleAttrChange}
          valueLabels={valueLabels}
        />

        {/* Price + stock */}
        {matched ? (
          <div className="space-y-1.5">
            <p className="text-2xl font-bold text-primary">
              {Number(matched.price).toLocaleString("fa-IR")}{" "}
              <span className="text-base font-normal text-muted-foreground">تومان</span>
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              {available(matched) > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-700">
                    {available(matched) > 10
                      ? "موجود"
                      : `موجود (${available(matched).toLocaleString("fa-IR")} عدد)`}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-600">ناموجود</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xl font-bold text-muted-foreground">—</p>
        )}

        {/* Add to cart / notify */}
        {isOutOfStock ? (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={notifyStatus?.registered || registerNotify.isPending}
            onClick={handleNotifyMe}
          >
            {registerNotify.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : notifyStatus?.registered ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {notifyStatus?.registered ? "درخواست ثبت شده" : "اطلاع بده موجود شد"}
          </Button>
        ) : (
          <AddToCart variant={matched} />
        )}

        {/* Description */}
        {product.description && (
          <div className="pt-4 border-t space-y-1.5">
            <p className="text-sm font-medium">توضیحات محصول</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
