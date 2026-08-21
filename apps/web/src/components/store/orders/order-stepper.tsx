import { Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderPayment, OrderStatus } from "@/types";

export interface StepperStep {
  label: string;
  /** ISO date string or null when the step hasn't happened yet. */
  at: string | null;
  status: "done" | "active" | "pending" | "failed";
}

/**
 * Vertical stepper for the order timeline. Filled circle + check = done,
 * ring + pulse = active, hollow ring = pending, filled red = failed. A
 * hairline connects the dots.
 */
export function OrderStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <ol className="relative py-1 ps-8">
      {/* Vertical connector */}
      <span
        aria-hidden
        className="absolute end-auto start-[15px] top-4 bottom-4 w-px bg-border"
      />

      {steps.map((step, i) => (
        <li key={i} className="relative py-3 first:pt-1 last:pb-1">
          {/* Dot */}
          <span
            className={cn(
              "absolute -start-[15px] top-4 -translate-y-1/2 rounded-full",
              step.status === "done" &&
                "flex h-5 w-5 items-center justify-center bg-emerald-500 text-white",
              step.status === "active" &&
                "flex h-5 w-5 items-center justify-center bg-primary/15 ring-2 ring-primary",
              step.status === "failed" &&
                "flex h-5 w-5 items-center justify-center bg-red-500 text-white",
              step.status === "pending" &&
                "h-3.5 w-3.5 border-2 border-muted-foreground/30 bg-background top-[13px]",
            )}
          >
            {step.status === "done" && <Check className="h-3 w-3" strokeWidth={3} />}
            {step.status === "active" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            )}
          </span>

          <div className="space-y-0.5">
            <p
              className={cn(
                "text-sm font-medium",
                step.status === "pending" && "text-muted-foreground",
                step.status === "failed" && "text-red-700",
              )}
            >
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {step.at ? formatDate(step.at) : "—"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Compute the standard step list from an order + payment pair. Encapsulates
 * the branching (online-gateway vs card-to-card) so the detail page doesn't
 * carry that logic.
 */
export function buildOrderSteps(
  payment: OrderPayment,
  orderStatus: OrderStatus,
  orderCreatedAt: string,
): StepperStep[] {
  const isOnline = payment.method === "online_gateway";

  const steps: StepperStep[] = [
    { label: "ثبت سفارش", at: orderCreatedAt, status: "done" },
  ];

  if (isOnline) {
    steps.push({
      label: "شروع پرداخت آنلاین",
      at: payment.initiatedAt,
      status: payment.initiatedAt ? "done" : "pending",
    });
    steps.push({
      label:
        payment.status === "confirmed" ? "پرداخت موفق" :
        payment.status === "failed" ? "پرداخت ناموفق" :
        "تعیین وضعیت پرداخت",
      at: payment.paidAt ?? (payment.status === "failed" ? payment.updatedAt : null),
      status:
        payment.status === "confirmed" ? "done" :
        payment.status === "failed" ? "failed" :
        payment.status === "initiated" ? "active" :
        "pending",
    });
  } else {
    steps.push({
      label: "آپلود رسید",
      at: payment.status === "pending" ? null : payment.updatedAt,
      status: payment.status === "pending" ? "pending" : "done",
    });
    steps.push({
      label:
        payment.status === "confirmed" ? "تأیید پشتیبانی" :
        payment.status === "rejected" ? "رد رسید" :
        "بررسی رسید",
      at: payment.status === "confirmed" || payment.status === "rejected" ? payment.updatedAt : null,
      status:
        payment.status === "confirmed" ? "done" :
        payment.status === "rejected" ? "failed" :
        payment.status === "uploaded" ? "active" :
        "pending",
    });
  }

  if (orderStatus === "confirmed") {
    steps.push({ label: "آماده‌سازی و ارسال", at: null, status: "active" });
  }

  return steps;
}
