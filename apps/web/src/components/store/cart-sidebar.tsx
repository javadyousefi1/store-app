"use client";

import Link from "next/link";
import { ShoppingCart, X, Trash2, ImageIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, useRemoveFromCart, useClearCart } from "@/hooks/use-cart";
import { useAttributeOptions } from "@/hooks/use-attribute-options";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

function storePrice(p: string | number) {
  return Number(p).toLocaleString("fa-IR") + " تومان";
}

export function CartSidebar({ open, onClose }: Props) {
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const { data: attributes } = useAttributeOptions();

  const valueLabels: Record<string, string> = {};
  for (const attr of attributes ?? []) {
    for (const v of attr.values) {
      if (v.label) valueLabels[v.value] = v.label;
    }
  }

  const items = cart?.items ?? [];
  const total = items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0);

  async function handleRemove(variantId: string) {
    try {
      await removeItem.mutateAsync(variantId);
    } catch {
      toast.error("خطا در حذف");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            سبد خرید
            {items.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} قلم)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            در حال بارگذاری...
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 opacity-20" />
            <p className="text-sm">سبد خرید خالی است</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y">
              {items.map((item) => {
                const thumb = item.variant.imageUrls?.[0] ?? null;
                return (
                  <div key={item.id} className="px-5 py-4 flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg border bg-muted/50 overflow-hidden shrink-0">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-tight line-clamp-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {Object.entries(item.variant.attributes).map(([k, v]) => {
                          const isHex = /^#[0-9A-Fa-f]{6}$/.test(v);
                          return (
                            <span key={k} className="flex items-center gap-1">
                              <span className="text-muted-foreground">{k}:</span>
                              {isHex && (
                                <span className="inline-block w-3.5 h-3.5 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: v }} />
                              )}
                              <span>{valueLabels[v] ?? v}</span>
                            </span>
                          );
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {item.variant.sku}
                      </p>
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="text-sm font-semibold text-primary">
                          {storePrice(item.variant.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          × {item.quantity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.variantId)}
                      disabled={removeItem.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t px-5 py-4 space-y-3 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">جمع کل</span>
                <span className="font-bold text-base">{storePrice(total)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className={buttonVariants({ className: "w-full h-11 text-base justify-center" })}
              >
                پرداخت
              </Link>
              <button
                onClick={() => clearCart.mutate()}
                disabled={clearCart.isPending}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-1"
              >
                <Trash2 className="h-3 w-3" />
                پاک کردن سبد
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
