"use client";

import Link from "next/link";
import { ShoppingCart, Minus, Plus, Trash2, CreditCard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useAddToCart,
  useCart,
  useRemoveFromCart,
  useUpdateCartQuantity,
} from "@/hooks/use-cart";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { GuestVariantSnapshot } from "@/lib/guest-cart";
import type { ProductVariant } from "@/types";

interface ProductSnapshotInput {
  id: string;
  name: string;
  slug: string;
  coverUrl: string | null;
}

interface Props {
  variant: (ProductVariant & { reserved?: number }) | null;
  /** Product info persisted alongside the guest cart entry so the sidebar
   * / cart page can render without another network round-trip. */
  product?: ProductSnapshotInput;
}

function available(v: ProductVariant & { reserved?: number }) {
  return (v.stock ?? 0) - (v.reserved ?? 0);
}

function buildSnapshot(
  variant: ProductVariant & { reserved?: number },
  product?: ProductSnapshotInput,
): GuestVariantSnapshot | undefined {
  if (!product) return undefined;
  return {
    price: String(variant.price),
    sku: variant.sku,
    attributes: variant.attributes,
    imageUrl: variant.imageUrls?.[0] ?? null,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    productCoverUrl: product.coverUrl,
  };
}

export function AddToCart({ variant, product }: Props) {
  const addToCart = useAddToCart();
  const updateQty = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();
  const { data: cart } = useCart();

  const avail = variant ? available(variant) : 0;
  const inStock = avail > 0;
  const cartItem = variant
    ? cart?.items.find((i) => i.variantId === variant.id) ?? null
    : null;
  const inCart = !!cartItem;
  const currentQty = cartItem?.quantity ?? 0;

  async function handleAdd() {
    if (!variant || !inStock) return;
    try {
      await addToCart.mutateAsync({
        variantId: variant.id,
        qty: 1,
        snapshot: buildSnapshot(variant, product),
      });
      toast.success("به سبد خرید افزوده شد");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "خطا در افزودن به سبد");
    }
  }

  async function handleQtyChange(next: number) {
    if (!variant) return;
    if (next < 1) return;
    if (next > avail) return;
    try {
      await updateQty.mutateAsync({ variantId: variant.id, quantity: next });
    } catch {
      toast.error("خطا در به‌روزرسانی تعداد");
    }
  }

  if (!variant) {
    return (
      <Button className="w-full h-11 text-base" disabled>
        <ShoppingCart className="h-4 w-4 me-2" />
        ابتدا ویژگی را انتخاب کنید
      </Button>
    );
  }

  if (!inStock) {
    return (
      <Button className="w-full h-11 text-base" variant="outline" disabled>
        ناموجود
      </Button>
    );
  }

  // Not in cart yet — one clean button, no qty controls.
  if (!inCart) {
    return (
      <Button
        className="w-full h-11 gap-2 text-base"
        onClick={handleAdd}
        disabled={addToCart.isPending}
      >
        {addToCart.isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        افزودن به سبد خرید
      </Button>
    );
  }

  // In cart — qty controls only.
  // When qty is 1, the minus becomes a trash icon that removes the item entirely.
  const busy = updateQty.isPending || removeItem.isPending;
  const canDecrement = currentQty > 1;

  async function handleDecrementOrRemove() {
    if (!variant) return;
    try {
      if (canDecrement) {
        await updateQty.mutateAsync({
          variantId: variant.id,
          quantity: currentQty - 1,
        });
      } else {
        await removeItem.mutateAsync(variant.id);
        toast.success("از سبد حذف شد");
      }
    } catch {
      toast.error("خطا در به‌روزرسانی سبد");
    }
  }

  return (
    <div className="flex h-11 w-full items-center gap-2">
      {/* Qty controls — compact, fixed width so the checkout CTA stays dominant */}
      <div className="flex h-full w-[7.25rem] shrink-0 items-center justify-between overflow-hidden rounded-lg border bg-background">
        <button
          type="button"
          onClick={() => handleQtyChange(currentQty + 1)}
          disabled={busy || currentQty >= avail}
          className="flex h-full flex-1 items-center justify-center transition-colors hover:bg-muted disabled:opacity-40"
          aria-label="افزایش تعداد"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="min-w-[2rem] border-x px-2 text-center text-sm font-semibold tabular-nums">
          {currentQty.toLocaleString("fa-IR")}
        </span>
        <button
          type="button"
          onClick={handleDecrementOrRemove}
          disabled={busy}
          className={
            "flex h-full flex-1 items-center justify-center transition-colors disabled:opacity-40 " +
            (canDecrement
              ? "hover:bg-muted"
              : "text-destructive hover:bg-destructive/10")
          }
          aria-label={canDecrement ? "کاهش تعداد" : "حذف از سبد"}
        >
          {canDecrement ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Checkout CTA — primary action once the item is in the cart */}
      <Link
        href="/checkout"
        className={cn(
          buttonVariants({ variant: "default" }),
          "h-11 flex-1 gap-2 text-sm",
        )}
      >
        <CreditCard className="h-4 w-4" />
        پرداخت
      </Link>
    </div>
  );
}
