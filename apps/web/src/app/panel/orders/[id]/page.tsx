"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  ArrowRight, CheckCircle2, XCircle, MapPin, Phone,
  FileText, Package, CreditCard, ImageIcon, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAdminOrder, useConfirmOrder, useRejectOrder } from "@/hooks/use-orders";
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useAdminOrder(id);
  const confirm = useConfirmOrder();
  const reject = useRejectOrder();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleConfirm() {
    try {
      await confirm.mutateAsync(id);
      toast.success("پرداخت تأیید شد");
      setConfirmOpen(false);
    } catch {
      toast.error("خطا در تأیید");
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync({ id, adminNote: adminNote.trim() || undefined });
      toast.success("سفارش رد شد");
      setRejectOpen(false);
      setAdminNote("");
    } catch {
      toast.error("خطا در رد سفارش");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        سفارش یافت نشد
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment.status];
  const canAct = order.status === "payment_uploaded";
  const lineItems = order.items.map((item) => ({
    ...item,
    subtotal: Number(item.price) * item.quantity,
  }));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/panel/orders" className="hover:text-foreground flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          سفارشات
        </Link>
        <span>/</span>
        <span className="text-foreground font-mono" dir="ltr">#{id.slice(0, 8)}</span>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
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
                <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
              </div>
              <p className="text-lg font-bold">{order.firstName} {order.lastName}</p>
            </div>

            <div className="text-end">
              <p className="text-xs text-muted-foreground">مبلغ کل</p>
              <p className="text-xl font-bold">{formatPrice(order.totalAmount)} ریال</p>
            </div>
          </div>

          {/* Action buttons */}
          {canAct && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                className="gap-2 flex-1 sm:flex-none"
                onClick={() => setConfirmOpen(true)}
                disabled={confirm.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                تأیید پرداخت
              </Button>
              <Button
                variant="outline"
                className="gap-2 flex-1 sm:flex-none text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setRejectOpen(true)}
                disabled={reject.isPending}
              >
                <XCircle className="h-4 w-4" />
                رد سفارش
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left col — customer + items */}
        <div className="lg:col-span-3 space-y-5">
          {/* Customer info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                اطلاعات تحویل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">نام و نام‌خانوادگی</span>
                <span className="font-medium">{order.firstName} {order.lastName}</span>
              </div>
              {order.user?.phone && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">شماره موبایل</span>
                  <span className="font-mono" dir="ltr">{order.user.phone}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">آدرس</span>
                <span>{order.address}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 shrink-0">کد پستی</span>
                <span dir="ltr" className="font-mono">{order.postalCode}</span>
              </div>
              {order.note && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">یادداشت</span>
                  <span className="text-foreground bg-muted/50 rounded px-2 py-1 flex-1">
                    {order.note}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                اقلام سفارش ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lineItems.map((item) => (
                  <div key={item.id} className="px-6 py-3.5 flex gap-4">
                    {/* Thumbnail */}
                    {item.variantImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.variantImageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg border object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium truncate">{item.productName}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.variantAttributes && Object.entries(item.variantAttributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                          >
                            {k}: {v}
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                          {item.variantSku}
                        </span>
                      </div>
                    </div>
                    <div className="text-end shrink-0 space-y-0.5">
                      <p className="text-sm font-medium">{formatPrice(item.subtotal)} ریال</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="px-6 py-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">جمع کل</span>
                <span className="font-bold">{formatPrice(order.totalAmount)} ریال</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right col — payment */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                اطلاعات پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">روش پرداخت</span>
                <span className="font-medium">کارت به کارت</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">وضعیت پرداخت</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                    paymentCfg.className
                  )}
                >
                  {paymentCfg.label}
                </span>
              </div>

              {order.payment.adminNote && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-800 flex gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{order.payment.adminNote}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt image */}
          {order.receiptUrl ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  تصویر رسید
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.receiptUrl}
                  alt="رسید پرداخت"
                  className="w-full rounded-lg border object-contain max-h-80 bg-muted/30"
                />
                <a
                  href={order.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-primary hover:underline block text-center"
                >
                  مشاهده در تب جدید
                </a>
              </CardContent>
            </Card>
          ) : order.status === "pending_payment" ? (
            <Card className="border-dashed">
              <CardContent className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <p className="text-sm">رسید هنوز آپلود نشده</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأیید پرداخت</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            آیا پرداخت این سفارش را تأیید می‌کنید؟ موجودی انبار کسر خواهد شد.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirm.isPending}>
              انصراف
            </Button>
            <Button onClick={handleConfirm} disabled={confirm.isPending}>
              {confirm.isPending ? "در حال ثبت..." : "بله، تأیید می‌کنم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد سفارش</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              سفارش لغو و موجودی رزرو آزاد می‌شود. می‌توانید دلیل رد را وارد کنید.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm">دلیل رد (اختیاری)</Label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="مثال: مبلغ واریزی مغایرت دارد"
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectOpen(false); setAdminNote(""); }}
              disabled={reject.isPending}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reject.isPending}
            >
              {reject.isPending ? "در حال ثبت..." : "رد سفارش"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
