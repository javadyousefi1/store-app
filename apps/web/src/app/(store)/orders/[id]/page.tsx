"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  ArrowRight, XCircle, AlertCircle, Package, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useUserOrder, useCancelOrder } from "@/hooks/use-user-orders";
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function UserOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useUserOrder(id);
  const cancelOrder = useCancelOrder();
  const [cancelOpen, setCancelOpen] = useState(false);

  async function handleCancel() {
    if (!order) return;
    try {
      await cancelOrder.mutateAsync(order.id);
      toast.success("سفارش لغو شد");
      setCancelOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در لغو سفارش");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-muted-foreground">سفارش یافت نشد</div>;
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment.status];
  const canCancel = order.status === "pending_payment";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          سفارشات
        </Link>
        <span>/</span>
        <span className="text-foreground font-mono" dir="ltr">#{id.slice(0, 8)}</span>
      </nav>

      {/* Status */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  statusCfg.className
                )}
              >
                {order.status === "payment_uploaded" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
                {statusCfg.label}
              </span>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">مبلغ کل</p>
              <p className="text-lg font-bold">{formatPrice(order.totalAmount)} ریال</p>
            </div>
          </div>

          {/* Payment status */}
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-muted-foreground">وضعیت پرداخت</span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", paymentCfg.className)}>
              {paymentCfg.label}
            </span>
          </div>

          {order.payment.status === "uploaded" && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              رسید دریافت شد — در انتظار بررسی ادمین
            </div>
          )}

          {order.payment.status === "confirmed" && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              پرداخت تأیید شد
            </div>
          )}

          {order.payment.adminNote && (
            <div className="flex gap-2 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{order.payment.adminNote}</span>
            </div>
          )}

          {canCancel && (
            <div className="pt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5 -ms-2"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                لغو سفارش
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            اقلام ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="px-6 py-3 flex gap-3 text-sm">
                {/* Thumbnail */}
                {item.variantImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.variantImageUrl}
                    alt={item.productName}
                    className="w-12 h-12 rounded-lg border object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                    <span className="text-muted-foreground/30 text-xs">؟</span>
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-medium truncate">{item.productName}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.variantAttributes && Object.entries(item.variantAttributes).map(([k, v]) => (
                      <span key={k} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-end shrink-0 space-y-0.5">
                  <p className="font-medium">{formatPrice(item.price * item.quantity)} ریال</p>
                  <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>لغو سفارش</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            آیا می‌خواهید این سفارش را لغو کنید؟ موجودی رزرو‌شده آزاد خواهد شد.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelOrder.isPending}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? "در حال لغو..." : "بله، لغو شود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
