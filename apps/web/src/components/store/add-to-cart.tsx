"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Minus, Plus, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types";

interface Props {
  variant: (ProductVariant & { reserved?: number }) | null;
}

function available(v: ProductVariant & { reserved?: number }) {
  return (v.stock ?? 0) - (v.reserved ?? 0);
}

export function AddToCart({ variant }: Props) {
  const [qty, setQty] = useState(1);
  const addToCart = useAddToCart();
  const { data: cart } = useCart();

  const avail = variant ? available(variant) : 0;
  const inStock = avail > 0;
  const inCart = variant ? (cart?.items.some((i) => i.variantId === variant.id) ?? false) : false;

  async function handleAdd() {
    if (!variant || !inStock) return;
    try {
      await addToCart.mutateAsync({ variantId: variant.id, qty });
      toast.success("به سبد خرید اضافه شد", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      });
      setQty(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در افزودن به سبد");
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

  return (
    <div className="space-y-3">
      {/* Qty selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-muted transition-colors"
            disabled={qty <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center border-x">
            {qty.toLocaleString("fa-IR")}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(avail, q + 1))}
            className="px-3 py-2 hover:bg-muted transition-colors"
            disabled={qty >= avail}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {avail > 10 ? "موجود" : `تنها ${avail.toLocaleString("fa-IR")} عدد باقی‌مانده`}
        </p>
      </div>

      <div className={cn("grid gap-2", inCart ? "grid-cols-2" : "grid-cols-1")}>
        <Button
          className="h-11 text-base gap-2"
          onClick={handleAdd}
          disabled={addToCart.isPending}
          variant={inCart ? "outline" : "default"}
        >
          {addToCart.isPending ? (
            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {inCart ? "افزودن مجدد" : "افزودن به سبد خرید"}
        </Button>

        {inCart && (
          <Link
            href="/checkout"
            className={cn(buttonVariants({ variant: "default" }), "h-11 text-base gap-2")}
          >
            <CreditCard className="h-4 w-4" />
            پرداخت
          </Link>
        )}
      </div>
    </div>
  );
}
