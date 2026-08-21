"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, ShoppingBag,
  Receipt, ArrowLeft, RefreshCw, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useVerifyPayment } from "@/hooks/use-user-orders";
import type { VerifyPaymentResponse } from "@/types";
import { cn } from "@/lib/utils";

type ViewState =
  | { kind: "missing" }
  | { kind: "verifying"; status: "OK" | "NOK" }
  | { kind: "success"; result: VerifyPaymentResponse }
  | { kind: "failed"; result: VerifyPaymentResponse; aborted: boolean }
  | { kind: "error"; message: string };

export function PaymentCallbackClient() {
  const params = useSearchParams();
  // ZarinPal spec uses Pascal-case. Fall back to lowercase in case a proxy
  // normalized it — cheap insurance, doesn't cost anything.
  const authority = params.get("Authority") ?? params.get("authority") ?? "";
  const rawStatus = params.get("Status") ?? params.get("status") ?? "";
  const status: "OK" | "NOK" = rawStatus === "OK" ? "OK" : "NOK";

  const verify = useVerifyPayment();
  const [view, setView] = useState<ViewState>(
    authority ? { kind: "verifying", status } : { kind: "missing" },
  );

  // Guard against React 18/19 double-invocation in dev + user refresh mid-flight.
  // The backend is idempotent, but a duplicate call would flash the loading
  // state twice and race the setState calls.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!authority || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const result = await verify.mutateAsync({ authority, status });
        if (result.status === "success") {
          setView({ kind: "success", result });
        } else {
          setView({ kind: "failed", result, aborted: status === "NOK" });
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "خطا در بررسی وضعیت پرداخت";
        setView({ kind: "error", message: msg });
      }
    })();
    // authority is stable per URL; verify.mutateAsync is a stable reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {view.kind === "missing"     && <MissingParams />}
        {view.kind === "verifying"   && <Verifying status={view.status} />}
        {view.kind === "success"     && <SuccessCard result={view.result} />}
        {view.kind === "failed"      && <FailedCard result={view.result} aborted={view.aborted} />}
        {view.kind === "error"       && <ErrorCard message={view.message} />}
      </div>
    </div>
  );
}

/* ─────────────────────────── VIEWS ─────────────────────────── */

function Verifying({ status }: { status: "OK" | "NOK" }) {
  // OK path: 3 steps (return → verify → finalize). NOK: shopper aborted, so
  // we just release stock — a shorter, softer trail.
  const steps =
    status === "OK"
      ? [
          { label: "بازگشت از درگاه", state: "done" as const },
          { label: "بررسی تراکنش نزد زرین‌پال", state: "active" as const },
          { label: "ثبت نهایی سفارش", state: "pending" as const },
        ]
      : [
          { label: "بازگشت از درگاه", state: "done" as const },
          { label: "لغو رزرو و آزادسازی موجودی", state: "active" as const },
        ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold">در حال بررسی پرداخت</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            لطفاً چند لحظه صبر کنید — این صفحه را نبندید تا وضعیت نهایی مشخص شود.
          </p>
        </div>

        <div className="text-start space-y-2 pt-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <StepDot state={s.state} />
              <span
                className={cn(
                  s.state === "pending" && "text-muted-foreground",
                  s.state === "active"  && "font-medium",
                  s.state === "done"    && "text-muted-foreground line-through decoration-emerald-500/60",
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessCard({ result }: { result: VerifyPaymentResponse }) {
  return (
    <Card className="shadow-sm border-emerald-200/60">
      <CardContent className="p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-emerald-800">پرداخت موفق</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            سفارش شما تأیید شد و برای پردازش ارسال گردید.
          </p>
        </div>

        {result.refId && <RefIdBox refId={result.refId} />}

        <Separator />

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/orders/${result.orderId}`} className="col-span-1">
            <Button className="w-full gap-2" size="sm">
              <Receipt className="h-4 w-4" />
              مشاهده سفارش
            </Button>
          </Link>
          <Link href="/products" className="col-span-1">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <ShoppingBag className="h-4 w-4" />
              ادامه خرید
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FailedCard({
  result, aborted,
}: {
  result: VerifyPaymentResponse;
  aborted: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-8 space-y-6 text-center">
        <div
          className={cn(
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300",
            aborted ? "bg-amber-100" : "bg-red-100",
          )}
        >
          {aborted ? (
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
        </div>

        <div className="space-y-1.5">
          <h1 className={cn("text-lg font-bold", aborted ? "text-amber-800" : "text-red-800")}>
            {aborted ? "پرداخت لغو شد" : "پرداخت ناموفق"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {aborted
              ? "شما پرداخت را در درگاه لغو کردید. موجودی کالا برای دیگران آزاد شد و سفارش شما لغو گردید."
              : "تراکنش نزد زرین‌پال تأیید نشد. اگر مبلغی از حساب شما کسر شده باشد، طی ۷۲ ساعت کاری بازگشت می‌خورد."}
          </p>
        </div>

        {result.gatewayMessage && !aborted && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-900 leading-relaxed text-start">
            <span className="text-red-700/80 font-medium">پیام درگاه: </span>
            {result.gatewayMessage}
            {result.gatewayCode != null && (
              <span className="text-red-700/60 font-mono ms-1" dir="ltr">
                (کد {result.gatewayCode})
              </span>
            )}
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-2">
          <Link href="/cart" className="col-span-1">
            <Button className="w-full gap-2" size="sm">
              <RefreshCw className="h-4 w-4" />
              تلاش مجدد
            </Button>
          </Link>
          <Link href={`/orders/${result.orderId}`} className="col-span-1">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Receipt className="h-4 w-4" />
              مشاهده سفارش
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold">خطا در بررسی پرداخت</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          <p className="text-xs text-muted-foreground">
            اگر مبلغی از حساب شما کسر شده، طی ساعات آینده به‌صورت خودکار بازگشت می‌خورد. در صورت
            بروز مشکل با پشتیبانی تماس بگیرید.
          </p>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/orders">
            <Button className="w-full gap-2" size="sm">
              <Receipt className="h-4 w-4" />
              سفارش‌های من
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <ArrowLeft className="h-4 w-4" />
              صفحه اصلی
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function MissingParams() {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold">اطلاعات بازگشت از درگاه یافت نشد</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            به نظر می‌رسد این صفحه به‌صورت مستقیم باز شده است. برای پرداخت به سبد خرید بازگردید.
          </p>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/cart">
            <Button className="w-full gap-2" size="sm">
              <ShoppingBag className="h-4 w-4" />
              سبد خرید
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Receipt className="h-4 w-4" />
              سفارش‌های من
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────── BITS ─────────────────────────── */

function StepDot({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <Check className="h-3 w-3 text-white" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }
  return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/25 shrink-0" />;
}

function RefIdBox({ refId }: { refId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-4 py-3 text-start">
      <p className="text-[11px] text-emerald-700/70 mb-1">شماره پیگیری</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-semibold text-emerald-900 tracking-wide" dir="ltr">
          {refId}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(refId);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch { /* noop */ }
          }}
          className="text-emerald-700/70 hover:text-emerald-900 transition-colors shrink-0"
          aria-label="کپی شماره پیگیری"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
