"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "./image-gallery";
import { VariantSelector } from "./variant-selector";
import { AddToCart } from "./add-to-cart";
import { FavoriteButton } from "./favorite-button";
import { useCart } from "@/hooks/use-cart";
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

  const selectedColorValue = selected["رنگ"];
  const colorLabel = selectedColorValue
    ? valueLabels[selectedColorValue] ?? selectedColorValue
    : null;

  const matched =
    variants.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val)
    ) ?? null;

  const { data: cart } = useCart();
  const inCart = matched
    ? !!cart?.items.some((i) => i.variantId === matched.id)
    : false;

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

  const notifyButton = (
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
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pb-28 md:pb-0">
        {/* Gallery */}
        <ImageGallery
          variantImageUrls={matched?.imageUrls ?? []}
          coverUrl={product.coverUrl}
          productName={product.name}
          colorLabel={colorLabel}
        />

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Badge variant="secondary">{product.category?.name}</Badge>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
              <FavoriteButton
                productId={product.id}
                product={{
                  slug: product.slug,
                  name: product.name,
                  coverUrl: product.coverUrl,
                }}
                variant="ghost"
                size="lg"
              />
            </div>
          </div>

          {/* Variant selector */}
          <VariantSelector
            variants={variants}
            selected={selected}
            onChange={handleAttrChange}
            valueLabels={valueLabels}
          />

          {/* Price + stock — desktop inline. On mobile we move this into the
              fixed bottom bar so the CTA stays reachable without scrolling. */}
          {matched ? (
            <div className="hidden space-y-1.5 md:block">
              {matched.oldPrice && Number(matched.oldPrice) > Number(matched.price) ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground line-through decoration-1">
                    {Number(matched.oldPrice).toLocaleString("fa-IR")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/95 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {Math.round((1 - Number(matched.price) / Number(matched.oldPrice)) * 100).toLocaleString("fa-IR")}٪
                  </span>
                </div>
              ) : null}
              <p className="text-2xl font-bold text-primary">
                {Number(matched.price).toLocaleString("fa-IR")}{" "}
                <span className="text-base font-normal text-muted-foreground">تومان</span>
              </p>
              <div className="flex items-center gap-1.5 text-sm">
                {available(matched) > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-700">موجود</span>
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
            <p className="hidden text-xl font-bold text-muted-foreground md:block">—</p>
          )}

          {/* Add to cart / notify — desktop inline. Mobile version lives in the sticky bar below. */}
          <div className="hidden md:block">
            {isOutOfStock ? (
              notifyButton
            ) : (
              <AddToCart
                variant={matched}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  coverUrl: product.coverUrl,
                }}
              />
            )}
          </div>

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

      {/* Mobile sticky purchase bar — price on the right (RTL start), CTA on the left.
          `env(safe-area-inset-bottom)` respects the iOS home-indicator gutter. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 shadow-[0_-8px_24px_rgba(45,32,67,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Hide the price stack once the item is in the cart — AddToCart
              expands to give the "پرداخت" CTA enough room to breathe. */}
          {!inCart && (
            <div className="flex min-w-0 flex-1 flex-col">
              {matched ? (
                <>
                  <span className="text-[11px] text-muted-foreground">قیمت</span>
                  {matched.oldPrice && Number(matched.oldPrice) > Number(matched.price) ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground line-through decoration-1">
                        {Number(matched.oldPrice).toLocaleString("fa-IR")}
                      </span>
                      <span className="rounded-full bg-emerald-500/95 px-1.5 text-[10px] font-bold text-white">
                        {Math.round((1 - Number(matched.price) / Number(matched.oldPrice)) * 100).toLocaleString("fa-IR")}٪
                      </span>
                    </span>
                  ) : null}
                  <span className="truncate text-base font-bold text-primary">
                    {Number(matched.price).toLocaleString("fa-IR")}
                    <span className="mr-1 text-[11px] font-normal text-muted-foreground">
                      تومان
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {isOutOfStock ? (
              notifyButton
            ) : (
              <AddToCart
                variant={matched}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  coverUrl: product.coverUrl,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
