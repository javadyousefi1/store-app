import type { OrderStatus, PaymentStatus } from "@/types";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: "در انتظار پرداخت",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  payment_uploaded: {
    label: "رسید آپلود شده",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  confirmed: {
    label: "تأیید شده",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "لغو شده",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending: { label: "در انتظار", className: "bg-amber-100 text-amber-800 border-amber-200" },
  uploaded: { label: "آپلود شده", className: "bg-blue-100 text-blue-800 border-blue-200" },
  confirmed: { label: "تأیید شده", className: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "رد شده", className: "bg-red-100 text-red-800 border-red-200" },
};
