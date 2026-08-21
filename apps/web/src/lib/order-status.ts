import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; short: string; className: string }
> = {
  card_to_card: {
    label: "کارت به کارت",
    short: "کارت‌به‌کارت",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  online_gateway: {
    label: "پرداخت آنلاین",
    short: "درگاه",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
};

export const GATEWAY_LABEL: Record<string, string> = {
  zarinpal: "زرین‌پال",
};

/**
 * Semantic color per user's status. Keep in sync with OrderStatusBadge — it
 * reads `tone` and maps to concrete Tailwind classes so we can restyle in
 * one place if the palette changes.
 */
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; tone: StatusTone; className: string; showPulse?: boolean }
> = {
  pending_payment: {
    label: "در انتظار پرداخت",
    tone: "amber",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  payment_uploaded: {
    label: "در حال بررسی",
    tone: "blue",
    className: "bg-blue-50 text-blue-800 border-blue-200",
    showPulse: true,
  },
  confirmed: {
    label: "تأیید شده",
    tone: "green",
    className: "bg-green-50 text-green-800 border-green-200",
  },
  cancelled: {
    label: "لغو شده",
    tone: "red",
    className: "bg-red-50 text-red-800 border-red-200",
  },
};

export type StatusTone = "amber" | "blue" | "green" | "red" | "indigo" | "neutral";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending:   { label: "در انتظار",             className: "bg-amber-100 text-amber-800 border-amber-200" },
  initiated: { label: "در انتظار پرداخت آنلاین", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  uploaded:  { label: "رسید آپلود شده",         className: "bg-blue-100 text-blue-800 border-blue-200" },
  confirmed: { label: "تأیید شده",              className: "bg-green-100 text-green-800 border-green-200" },
  rejected:  { label: "رد شده",                 className: "bg-red-100 text-red-800 border-red-200" },
  failed:    { label: "ناموفق",                 className: "bg-red-100 text-red-800 border-red-200" },
};
