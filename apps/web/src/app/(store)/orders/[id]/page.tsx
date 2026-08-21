"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  AlertCircle, ArrowRight, Check, CheckCircle2, Clock, Copy,
  CreditCard, FileText, Info, Landmark, MapPin, Package,
  Phone, Ticket, Truck, XCircle,
} from "lucide-react"; // Clock kept only for the "initiated" status alert icon
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useUserOrder, useCancelOrder } from "@/hooks/use-user-orders";
import { PAYMENT_METHOD_CONFIG, PAYMENT_STATUS_CONFIG, GATEWAY_LABEL } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/store/orders/order-status-badge";
import { VariantAttributes } from "@/components/store/variant-attributes";
import type { OrderPayment } from "@/types";

const DELIVERY_LABEL: Record<string, string> = {
  in_person: "تحویل حضوری",
  iran_post: "پست ایران",
};

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار ثبت",
  created: "ثبت شده در پست",
  ready: "آماده ارسال",
  barcoded: "بارکد صادر شده",
  failed: "خطا در ثبت",
};

// Uniform card look for every section on this page.
const CARD_CLS = "gap-0";
const CARD_HEADER_CLS = "px-4 pt-4 pb-2";
const CARD_CONTENT_CLS = "p-4 pt-3";
const CARD_TITLE_CLS = "flex items-center gap-2 text-sm font-semibold";

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
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-lg font-medium">سفارش یافت نشد</p>
        <Link href="/orders" className="mt-4 inline-block text-sm text-primary hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const methodCfg = PAYMENT_METHOD_CONFIG[order.payment.method];
  const isOnline = order.payment.method === "online_gateway";
  const isCardCard = order.payment.method === "card_to_card";
  const canCancel = order.status === "pending_payment";
  // Single source of truth for "شماره پیگیری" — MUST match what the
  // order-created SMS ships (PaymentService.notifyOrderCreated → order.orderNumber).
  const trackingNumber = order.orderNumber;
  const statusMessage = getStatusMessage(order.status, order.payment);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/orders" className="flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          سفارش‌های من
        </Link>
        <span aria-hidden>/</span>
        <span className="font-mono text-foreground" dir="ltr">#{order.orderNumber}</span>
      </nav>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <Card className={CARD_CLS}>
        <CardContent className={CARD_CONTENT_CLS}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <OrderStatusBadge status={order.status} />
                <Badge
                  variant="outline"
                  className={cn("h-6 gap-1 rounded-full px-2 text-xs font-medium", methodCfg.className)}
                >
                  {isOnline ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
                  {methodCfg.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="shrink-0 space-y-0.5 text-end">
              {order.couponSnapshot && order.subtotalAmount && (
                <p className="text-[11px] tabular-nums text-muted-foreground line-through">
                  {formatPrice(order.subtotalAmount)}
                </p>
              )}
              <p className="text-xl font-bold tabular-nums text-foreground">
                {formatPrice(order.totalAmount)}
                <span className="ms-1 text-xs font-normal text-muted-foreground">تومان</span>
              </p>
            </div>
          </div>

          {/* Tracking number — same value the order-created SMS sends the shopper */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-border/70 bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">شماره پیگیری</span>
            <CopyValue value={trackingNumber} mono strong />
          </div>

          {statusMessage && (
            <div className="mt-3">
              <Alert
                tone={statusMessage.tone}
                icon={statusMessage.icon}
              >
                {statusMessage.text}
              </Alert>
            </div>
          )}

          {canCancel && (
            <div className="mt-3 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="-ms-2 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                لغو سفارش
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Items (moved to top: this is what the user cares most about) ── */}
      <Card className={CARD_CLS}>
        <CardHeader className={CARD_HEADER_CLS}>
          <CardTitle className={CARD_TITLE_CLS}>
            <Package className="h-4 w-4 text-muted-foreground" />
            اقلام سفارش
            <span className="font-normal text-muted-foreground/80">
              ({order.items.length.toLocaleString("fa-IR")})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3.5">
                <ItemThumb src={item.variantImageUrl} alt={item.productName} />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold leading-tight">{item.productName}</p>
                  <VariantAttributes attributes={item.variantAttributes} size="sm" />
                  {/*<p className="font-mono text-[11px] text-muted-foreground" dir="ltr">*/}
                  {/*  SKU · {item.variantSku}*/}
                  {/*</p>*/}
                </div>

                <div className="shrink-0 space-y-0.5 text-end">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrice(Number(item.price) * item.quantity)}
                    <span className="ms-1 text-[10px] font-normal text-muted-foreground">تومان</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {formatPrice(item.price)} × {item.quantity.toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1.5 px-4 py-3 text-sm">
            {order.couponSnapshot && order.subtotalAmount && order.discountAmount ? (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>جمع آیتم‌ها</span>
                  <span className="tabular-nums">{formatPrice(order.subtotalAmount)} تومان</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" />
                    تخفیف
                    <span
                      className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px]"
                      dir="ltr"
                    >
                      {order.couponSnapshot.code}
                    </span>
                    <span className="text-xs text-emerald-700/80">
                      ({order.couponSnapshot.percentage.toLocaleString("fa-IR")}٪)
                    </span>
                  </span>
                  <span className="tabular-nums">− {formatPrice(order.discountAmount)} تومان</span>
                </div>
              </>
            ) : null}
            {order.shippingCost && Number(order.shippingCost) > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  هزینه ارسال
                </span>
                <span className="tabular-nums">{formatPrice(order.shippingCost)} تومان</span>
              </div>
            ) : null}
            {(order.couponSnapshot || (order.shippingCost && Number(order.shippingCost) > 0)) && (
              <Separator className="my-2" />
            )}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-sm font-semibold">جمع کل قابل پرداخت</span>
              <span className="text-base font-bold tabular-nums text-foreground">
                {formatPrice(order.totalAmount)}
                <span className="ms-1 text-xs font-normal text-muted-foreground">تومان</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Payment info ─────────────────────────────────────────── */}
      <PaymentCard payment={order.payment} isOnline={isOnline} />

      {/* ── Delivery info ────────────────────────────────────────── */}
      <Card className={CARD_CLS}>
        <CardHeader className={CARD_HEADER_CLS}>
          <CardTitle className={CARD_TITLE_CLS}>
            <MapPin className="h-4 w-4 text-muted-foreground" />
            اطلاعات تحویل
          </CardTitle>
        </CardHeader>
        <CardContent className={CARD_CONTENT_CLS + " space-y-2"}>
          <InfoRow label="گیرنده" value={<span className="font-medium">{order.firstName} {order.lastName}</span>} />
          {order.user?.phone && (
            <InfoRow
              label="شماره تماس"
              value={
                <span className="inline-flex items-center gap-1.5 font-mono" dir="ltr">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.user.phone}
                </span>
              }
            />
          )}
          <InfoRow label="نشانی" value={<span className="leading-6">{order.address}</span>} multiline />
          <InfoRow label="کد پستی" value={<CopyValue value={order.postalCode} mono />} />
          <InfoRow
            label="نحوه ارسال"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                {DELIVERY_LABEL[order.deliveryType] ?? order.deliveryType}
              </span>
            }
          />
          {order.deliveryType === "iran_post" && (
            <>
              {(order.stateName || order.cityName) && (
                <InfoRow
                  label="مقصد"
                  value={
                    <span>
                      {order.stateName}
                      {order.stateName && order.cityName && " / "}
                      {order.cityName}
                    </span>
                  }
                />
              )}
              {order.mobile && (
                <InfoRow
                  label="موبایل گیرنده"
                  value={
                    <span className="font-mono" dir="ltr">
                      {order.mobile}
                    </span>
                  }
                />
              )}
              {order.shipmentStatus && (
                <InfoRow
                  label="وضعیت مرسوله"
                  value={
                    <span className="text-xs">
                      {SHIPMENT_STATUS_LABEL[order.shipmentStatus] ?? order.shipmentStatus}
                    </span>
                  }
                />
              )}
              {order.shipmentPostBarcode && (
                <InfoRow
                  label="کد رهگیری پست"
                  value={<CopyValue value={order.shipmentPostBarcode} mono />}
                />
              )}
            </>
          )}
          {order.note && (
            <InfoRow
              label="یادداشت"
              value={
                <span className="rounded-md bg-muted/50 px-2 py-1 text-foreground">
                  {order.note}
                </span>
              }
              multiline
            />
          )}
        </CardContent>
      </Card>

      {/* ── Receipt (card_to_card only) ──────────────────────────── */}
      {isCardCard && order.receiptUrl && (
        <Card className={CARD_CLS}>
          <CardHeader className={CARD_HEADER_CLS}>
            <CardTitle className={CARD_TITLE_CLS}>
              <FileText className="h-4 w-4 text-muted-foreground" />
              رسید پرداخت شما
            </CardTitle>
          </CardHeader>
          <CardContent className={CARD_CONTENT_CLS}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.receiptUrl}
              alt="رسید پرداخت"
              className="max-h-80 w-full rounded-md border bg-muted/20 object-contain"
            />
            <a
              href={order.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-xs text-primary hover:underline"
            >
              مشاهده تصویر در تب جدید
            </a>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirm */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">لغو سفارش</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            آیا می‌خواهید این سفارش را لغو کنید؟ موجودی رزرو شده آزاد می‌شود و این عمل قابل بازگشت نیست.
          </p>
          <DialogFooter className="flex-row justify-end gap-2">
            <DialogClose
              render={<Button variant="outline" disabled={cancelOrder.isPending}>انصراف</Button>}
            />
            <Button variant="destructive" onClick={handleCancel} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? "در حال لغو..." : "بله، لغو شود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────── Payment card ─────────────────────────── */

function PaymentCard({ payment, isOnline }: { payment: OrderPayment; isOnline: boolean }) {
  const payCfg = PAYMENT_STATUS_CONFIG[payment.status];
  const gatewayLabel = payment.gatewayName
    ? GATEWAY_LABEL[payment.gatewayName] ?? payment.gatewayName
    : null;

  return (
    <Card className={CARD_CLS}>
      <CardHeader className={CARD_HEADER_CLS}>
        <CardTitle className={CARD_TITLE_CLS}>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          اطلاعات پرداخت
        </CardTitle>
      </CardHeader>
      <CardContent className={CARD_CONTENT_CLS + " space-y-2"}>
        <InfoRow
          label="وضعیت"
          value={
            <Badge
              variant="outline"
              className={cn("h-5 gap-1 rounded-full px-2 text-[11px] font-medium", payCfg.className)}
            >
              {payment.status === "initiated" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
              )}
              {payCfg.label}
            </Badge>
          }
        />

        {isOnline && gatewayLabel && (
          <InfoRow label="درگاه" value={<span className="font-medium">{gatewayLabel}</span>} />
        )}
        {/* refId (شماره پیگیری) is intentionally NOT repeated here — the
            summary card at the top already shows it prominently as the
            tracking number that matches the order-created SMS. */}
        {isOnline && payment.cardPan && (
          <InfoRow
            label="کارت پرداخت‌کننده"
            value={<span className="font-mono tracking-wide" dir="ltr">{payment.cardPan}</span>}
          />
        )}
        {isOnline && payment.paidAt && (
          <InfoRow label="زمان پرداخت" value={<span>{formatDate(payment.paidAt)}</span>} />
        )}

        {isOnline && (payment.status === "failed" || payment.status === "rejected") && payment.gatewayMessage && (
          <div className="pt-1">
            <Alert tone="red" icon={AlertCircle}>
              <span className="font-medium">علت ناموفق بودن: </span>
              {payment.gatewayMessage}
            </Alert>
          </div>
        )}

        {payment.adminNote && (
          <div className="pt-1">
            <Alert tone="red" icon={AlertCircle}>
              <span className="font-medium">توضیحات پشتیبانی: </span>
              {payment.adminNote}
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────── Bits ─────────────────────────── */

function InfoRow({
  label, value, multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className={cn("flex gap-3 text-sm", multiline ? "items-start" : "items-center")}>
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1 text-foreground">{value}</div>
    </div>
  );
}

function CopyValue({ value, mono, strong }: { value: string; mono?: boolean; strong?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }
  return (
    <div className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "truncate",
          mono && "font-mono tracking-wide",
          strong ? "text-sm font-semibold" : "text-sm",
        )}
        dir="ltr"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="کپی"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

type AlertTone = "amber" | "blue" | "green" | "indigo" | "red";

function Alert({
  tone, icon: Icon, children,
}: {
  tone: AlertTone;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const toneCls: Record<AlertTone, string> = {
    amber:  "border-amber-100 bg-amber-50 text-amber-900",
    blue:   "border-blue-100 bg-blue-50 text-blue-900",
    green:  "border-green-100 bg-green-50 text-green-900",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-900",
    red:    "border-red-100 bg-red-50 text-red-900",
  };
  const iconCls: Record<AlertTone, string> = {
    amber:  "text-amber-600",
    blue:   "text-blue-600",
    green:  "text-green-600",
    indigo: "text-indigo-600",
    red:    "text-red-600",
  };
  return (
    <div className={cn("flex items-start gap-2 rounded-md border p-2.5 text-xs leading-6", toneCls[tone])}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconCls[tone])} />
      <span className="break-words">{children}</span>
    </div>
  );
}

function ItemThumb({ src, alt }: { src: string | null; alt: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className="h-14 w-14 shrink-0 rounded-md border object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border bg-muted text-[9px] font-mono text-muted-foreground/70"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.03) 6px, rgba(0,0,0,0.03) 12px)",
      }}
    >
      تصویر
    </div>
  );
}

/* ─────────────────────────── Status message copy ─────────────────────────── */

type StatusMessage = { text: string; tone: AlertTone; icon: React.ComponentType<{ className?: string }> };

function getStatusMessage(
  status: "pending_payment" | "payment_uploaded" | "confirmed" | "cancelled",
  payment: OrderPayment,
): StatusMessage | null {
  const isCard = payment.method === "card_to_card";
  const isOnline = payment.method === "online_gateway";

  if (status === "confirmed") {
    return {
      text: "پرداخت شما تأیید شد و سفارش در حال آماده‌سازی است.",
      tone: "green",
      icon: CheckCircle2,
    };
  }
  if (status === "cancelled") {
    return {
      text: "این سفارش لغو شده است. موجودی کالاها آزاد شد.",
      tone: "red",
      icon: XCircle,
    };
  }
  if (isCard && status === "pending_payment") {
    return {
      text: "رسید پرداخت هنوز آپلود نشده — لطفاً از صفحه‌ی پرداخت رسید را ارسال کنید.",
      tone: "amber",
      icon: Info,
    };
  }
  if (isCard && status === "payment_uploaded") {
    return {
      text: "رسید شما دریافت شد. تیم پشتیبانی تا حداکثر ۲۴ ساعت آن را بررسی می‌کند.",
      tone: "blue",
      icon: CheckCircle2,
    };
  }
  if (isOnline && payment.status === "initiated") {
    return {
      text: "در انتظار تکمیل پرداخت در درگاه. اگر پرداخت کردید و این پیام باقی مانده، از صفحه‌ی بازگشت درگاه به سایت برگردید.",
      tone: "indigo",
      icon: Clock,
    };
  }
  return null;
}
