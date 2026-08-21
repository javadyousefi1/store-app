"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  ArrowRight, CheckCircle2, XCircle, MapPin,
  FileText, Package, CreditCard, ImageIcon, AlertCircle, Ticket,
  Landmark, Clock, Hash, Info, Copy, Check,
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
import {
  ORDER_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, PAYMENT_STATUS_CONFIG, GATEWAY_LABEL,
} from "@/lib/order-status";
import { VariantAttributes } from "@/components/store/variant-attributes";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderPayment } from "@/types";

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

  const statusCfg  = ORDER_STATUS_CONFIG[order.status];
  const methodCfg  = PAYMENT_METHOD_CONFIG[order.payment.method];
  const isOnline   = order.payment.method === "online_gateway";
  const isCardCard = order.payment.method === "card_to_card";
  // Admin can only act on card_to_card receipts. Online-gateway payments are
  // auto-confirmed by the /payments/verify endpoint (or auto-expired by the
  // 20-min sweep) — no manual step.
  const canAct = isCardCard && order.status === "payment_uploaded";
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
        <span className="text-foreground font-mono" dir="ltr">#{order.orderNumber}</span>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
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
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    methodCfg.className,
                  )}
                >
                  {isOnline ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
                  {methodCfg.label}
                </span>
                <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
              </div>
              <p className="text-lg font-bold">{order.firstName} {order.lastName}</p>
            </div>

            <div className="text-end space-y-0.5">
              {order.couponSnapshot && order.subtotalAmount && (
                <p className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatPrice(order.subtotalAmount)} ریال
                </p>
              )}
              <p className="text-xs text-muted-foreground">مبلغ کل</p>
              <p className="text-xl font-bold">{formatPrice(order.totalAmount)} ریال</p>
            </div>
          </div>

          {/* Action buttons — card_to_card only */}
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

          {/* Non-actionable hints */}
          {isOnline && order.payment.status === "initiated" && (
            <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-600" />
              <span>کاربر در حال تکمیل پرداخت در درگاه است. اگر تا ۲۰ دقیقه پس از شروع، پرداخت تأیید نشود، سفارش به‌صورت خودکار لغو و موجودی آزاد می‌شود.</span>
            </div>
          )}
          {isCardCard && order.status === "pending_payment" && (
            <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
              <span>در انتظار آپلود رسید کارت به کارت توسط مشتری.</span>
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
              <InfoRow label="نام و نام‌خانوادگی">
                <span className="font-medium">{order.firstName} {order.lastName}</span>
              </InfoRow>
              {order.user?.phone && (
                <InfoRow label="شماره موبایل">
                  <span className="font-mono" dir="ltr">{order.user.phone}</span>
                </InfoRow>
              )}
              <InfoRow label="آدرس"><span>{order.address}</span></InfoRow>
              <InfoRow label="کد پستی">
                <span dir="ltr" className="font-mono">{order.postalCode}</span>
              </InfoRow>
              {order.note && (
                <InfoRow label="یادداشت">
                  <span className="text-foreground bg-muted/50 rounded px-2 py-1 flex-1">
                    {order.note}
                  </span>
                </InfoRow>
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
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-medium truncate">{item.productName}</p>
                      <VariantAttributes
                        attributes={item.variantAttributes}
                        size="sm"
                      />
                      <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {item.variantSku}
                      </p>
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
              {order.couponSnapshot && order.subtotalAmount && order.discountAmount ? (
                <div className="px-6 py-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>جمع آیتم‌ها</span>
                    <span>{formatPrice(order.subtotalAmount)} ریال</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5" />
                      تخفیف
                      <span className="font-mono text-[11px] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5" dir="ltr">
                        {order.couponSnapshot.code}
                      </span>
                      <span className="text-xs text-emerald-700/80">
                        ({order.couponSnapshot.percentage.toLocaleString("fa-IR")}٪)
                      </span>
                    </span>
                    <span>− {formatPrice(order.discountAmount)} ریال</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5 border-t">
                    <span>جمع کل</span>
                    <span>{formatPrice(order.totalAmount)} ریال</span>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">جمع کل</span>
                  <span className="font-bold">{formatPrice(order.totalAmount)} ریال</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right col — payment */}
        <div className="lg:col-span-2 space-y-5">
          <PaymentCard payment={order.payment} />

          <PaymentTimeline payment={order.payment} orderCreatedAt={order.createdAt} />

          {isCardCard && <ReceiptCard receiptUrl={order.receiptUrl} showEmptyState={order.status === "pending_payment"} />}
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

/* ─────────────────────── Payment card ─────────────────────── */

function PaymentCard({ payment }: { payment: OrderPayment }) {
  const methodCfg = PAYMENT_METHOD_CONFIG[payment.method];
  const payCfg    = PAYMENT_STATUS_CONFIG[payment.status];
  const isOnline  = payment.method === "online_gateway";
  const gatewayLabel = payment.gatewayName ? (GATEWAY_LABEL[payment.gatewayName] ?? payment.gatewayName) : null;

  return (
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
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
              methodCfg.className,
            )}
          >
            {isOnline ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
            {methodCfg.label}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">وضعیت پرداخت</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
              payCfg.className,
            )}
          >
            {payment.status === "initiated" && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
            {payCfg.label}
          </span>
        </div>

        {isOnline && (
          <>
            <Separator />
            <div className="space-y-2.5">
              {gatewayLabel && (
                <InfoRow label="درگاه">
                  <span className="font-medium">{gatewayLabel}</span>
                </InfoRow>
              )}
              {payment.refId && (
                <InfoRow label="شماره پیگیری">
                  <CopyValue value={payment.refId} mono />
                </InfoRow>
              )}
              {payment.cardPan && (
                <InfoRow label="شماره کارت خریدار">
                  <span className="font-mono tracking-wide" dir="ltr">{payment.cardPan}</span>
                </InfoRow>
              )}
              {payment.authority && (
                <InfoRow label="Authority">
                  <CopyValue value={payment.authority} mono small />
                </InfoRow>
              )}
              {payment.gatewayCode != null && payment.status !== "confirmed" && (
                <InfoRow label="کد درگاه">
                  <span className="font-mono" dir="ltr">{payment.gatewayCode}</span>
                </InfoRow>
              )}
            </div>
          </>
        )}

        {/* Gateway failure detail — payment failed for reason X */}
        {isOnline && (payment.status === "failed" || payment.status === "rejected") && payment.gatewayMessage && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-800 flex gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-red-900">علت ناموفق بودن</p>
              <p className="leading-relaxed break-words">{payment.gatewayMessage}</p>
            </div>
          </div>
        )}

        {payment.adminNote && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-800 flex gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-red-900">یادداشت ادمین</p>
              <p className="leading-relaxed break-words">{payment.adminNote}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────── Timeline ─────────────────────── */

function PaymentTimeline({
  payment, orderCreatedAt,
}: {
  payment: OrderPayment;
  orderCreatedAt: string;
}) {
  const isOnline = payment.method === "online_gateway";

  const events = [
    { label: "ثبت سفارش", at: orderCreatedAt, kind: "done" as const },
    ...(isOnline
      ? [
          {
            label: "شروع پرداخت آنلاین",
            at: payment.initiatedAt,
            kind: payment.initiatedAt ? "done" : "pending",
          },
          {
            label:
              payment.status === "confirmed" ? "پرداخت موفق" :
              payment.status === "failed"    ? "پرداخت ناموفق" :
              "تعیین وضعیت پرداخت",
            at: payment.paidAt ?? (payment.status === "failed" ? payment.updatedAt : null),
            kind:
              payment.status === "confirmed" ? "done" :
              payment.status === "failed"    ? "failed" :
              payment.status === "initiated" ? "active" :
              "pending",
          },
        ]
      : [
          {
            label: "آپلود رسید",
            at: payment.status === "pending" ? null : payment.updatedAt,
            kind:
              payment.status === "uploaded" || payment.status === "confirmed" || payment.status === "rejected"
                ? "done"
                : payment.status === "pending"
                ? "pending"
                : "done",
          },
          {
            label:
              payment.status === "confirmed" ? "تأیید ادمین" :
              payment.status === "rejected"  ? "رد توسط ادمین" :
              "بررسی ادمین",
            at: payment.status === "confirmed" || payment.status === "rejected" ? payment.updatedAt : null,
            kind:
              payment.status === "confirmed" ? "done" :
              payment.status === "rejected"  ? "failed" :
              payment.status === "uploaded"  ? "active" :
              "pending",
          },
        ]),
  ] as Array<{ label: string; at: string | null; kind: "done" | "active" | "pending" | "failed" }>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          روند پرداخت
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ol className="relative ps-6 pe-4 py-2">
          {/* vertical line */}
          <span className="absolute end-auto start-[13px] top-3 bottom-3 w-px bg-border" />
          {events.map((ev, i) => (
            <li key={i} className="relative py-2.5">
              <span
                className={cn(
                  "absolute -start-[13px] top-3.5 w-2.5 h-2.5 rounded-full border-2 -translate-y-1/2",
                  ev.kind === "done"    && "bg-emerald-500 border-emerald-500",
                  ev.kind === "active"  && "bg-primary border-primary animate-pulse",
                  ev.kind === "failed"  && "bg-red-500 border-red-500",
                  ev.kind === "pending" && "bg-background border-muted-foreground/30",
                )}
              />
              <div className="text-sm space-y-0.5">
                <p
                  className={cn(
                    "font-medium",
                    ev.kind === "pending" && "text-muted-foreground",
                    ev.kind === "failed"  && "text-red-700",
                  )}
                >
                  {ev.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ev.at ? formatDate(ev.at) : "—"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────── Receipt (card_to_card) ─────────────────────── */

function ReceiptCard({
  receiptUrl, showEmptyState,
}: {
  receiptUrl: string | undefined;
  showEmptyState: boolean;
}) {
  if (receiptUrl) {
    return (
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
            src={receiptUrl}
            alt="رسید پرداخت"
            className="w-full rounded-lg border object-contain max-h-80 bg-muted/30"
          />
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-primary hover:underline block text-center"
          >
            مشاهده در تب جدید
          </a>
        </CardContent>
      </Card>
    );
  }

  if (showEmptyState) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-8 w-8 opacity-40" />
          <p className="text-sm">رسید هنوز آپلود نشده</p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/* ─────────────────────── Bits ─────────────────────── */

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function CopyValue({ value, mono, small }: { value: string; mono?: boolean; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={cn(
          "truncate",
          mono && "font-mono",
          small ? "text-[11px]" : "text-sm",
        )}
        dir="ltr"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="کپی"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
