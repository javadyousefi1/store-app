"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ImageIcon,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useCart,
  useClearCart,
  useRemoveFromCart,
  useUpdateCartQuantity,
} from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

function formatPrice(value: string | number) {
  return `${Number(value).toLocaleString("fa-IR")} تومان`;
}

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveFromCart();
  const updateQuantity = useUpdateCartQuantity();
  const clearCart = useClearCart();

  const items = cart?.items ?? [];
  const total = items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  );
  const busy =
    removeItem.isPending || updateQuantity.isPending || clearCart.isPending;

  async function remove(variantId: string) {
    try {
      await removeItem.mutateAsync(variantId);
    } catch {
      toast.error("حذف محصول از سبد انجام نشد");
    }
  }

  async function changeQuantity(variantId: string, quantity: number) {
    try {
      await updateQuantity.mutateAsync({ variantId, quantity });
    } catch {
      toast.error("تعداد محصول به‌روزرسانی نشد");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100svh-128px)] items-center justify-center pb-4 md:min-h-[45svh] md:pb-0">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-128px)] max-w-xl flex-col items-center justify-center gap-4 px-5 pb-4 text-center md:min-h-[55svh] md:px-4 md:pb-0">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="h-9 w-9 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">سبد خرید خالی است</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            محصول موردنظرتان را به سبد اضافه کنید.
          </p>
        </div>
        <Link
          href="/products"
          className={buttonVariants({ className: "h-11 gap-2 px-5" })}
        >
          مشاهده محصولات
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">سبد خرید</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length.toLocaleString("fa-IR")} محصول
          </p>
        </div>
        <button
          type="button"
          onClick={() => clearCart.mutate()}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          پاک کردن سبد
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => {
            const image = item.variant.imageUrls?.[0];
            return (
              <article
                key={item.id}
                className="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
              >
                <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-24">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={item.variant.product?.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-muted-foreground/30" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold sm:text-base">
                    {item.variant.product?.name ?? "محصول"}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {Object.entries(item.variant.attributes).map(
                      ([key, value]) => (
                        <span key={key}>
                          {key}: {value}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {formatPrice(item.variant.price)}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex h-9 items-center overflow-hidden rounded-lg border">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={busy}
                        className="flex h-full w-9 items-center justify-center hover:bg-muted disabled:opacity-50"
                        aria-label="افزایش تعداد"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="flex h-full min-w-9 items-center justify-center border-x text-sm font-bold">
                        {item.quantity.toLocaleString("fa-IR")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.variantId, item.quantity - 1)
                        }
                        disabled={busy}
                        className="flex h-full w-9 items-center justify-center hover:bg-muted disabled:opacity-50"
                        aria-label="کاهش تعداد"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(item.variantId)}
                      disabled={busy}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-destructive disabled:opacity-50"
                      aria-label="حذف از سبد"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-bold">خلاصه سفارش</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>جمع محصولات</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-4 text-base font-bold">
              <span>مبلغ قابل پرداخت</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className={cn(
              buttonVariants(),
              "mt-5 h-12 w-full justify-center text-base",
            )}
          >
            ادامه و ثبت سفارش
          </Link>
        </aside>
      </div>
    </div>
  );
}
