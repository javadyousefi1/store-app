"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ShoppingBag, Phone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetOtp, useResendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 90;

function formatPhone(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 11);
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getOtp = useGetOtp();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    if (phone.length !== 11) {
      toast.error("شماره موبایل باید ۱۱ رقم باشد");
      return;
    }
    try {
      const response = await getOtp.mutateAsync({ phone });
      setStep("otp");
      startCountdown();
      const code = response?.data?.otp;
      toast.success(code ? `کد تأیید: ${code}` : "کد تأیید ارسال شد");
    } catch (error: unknown) {
      const message = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(message ?? "خطا در ارسال کد");
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    try {
      await verifyOtp.mutateAsync({ phone, otp });
      toast.success("ورود موفق");
      router.push("/panel");
    } catch (error: unknown) {
      const message = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(message ?? "کد اشتباه است");
    }
  }

  async function handleResend() {
    try {
      await resendOtp.mutateAsync({ phone });
      startCountdown();
      toast.success("کد مجدداً ارسال شد");
    } catch (error: unknown) {
      const message = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(message ?? "خطا در ارسال مجدد");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden flex-col items-center justify-center gap-6 bg-primary p-10 text-primary-foreground md:flex md:w-1/2 lg:w-2/5">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">فروشگاه آنلاین</h1>
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            سیستم مدیریت محصولات، سفارشات و کاربران فروشگاه
          </p>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-3">
          {[
            "مدیریت محصولات و دسته‌بندی‌ها",
            "مشاهده و مدیریت کاربران",
            "تعریف ویژگی‌های variant",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 text-sm text-primary-foreground/80"
            >
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground/60" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-5 py-10">
        <div className="mb-8 flex items-center gap-2 md:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">فروشگاه آنلاین</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="mb-2 flex items-center gap-3">
            <StepDot
              active={step === "phone"}
              done={step === "otp"}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
            <div
              className={cn(
                "h-px flex-1 transition-colors",
                step === "otp" ? "bg-primary" : "bg-border",
              )}
            />
            <StepDot
              active={step === "otp"}
              done={false}
              icon={<KeyRound className="h-3.5 w-3.5" />}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              {step === "phone" ? "ورود به پنل" : "کد تأیید"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "phone"
                ? "شماره موبایل خود را وارد کنید"
                : `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید`}
            </p>
          </div>

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-phone">شماره موبایل</Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={phone}
                  onChange={(event) =>
                    setPhone(formatPhone(event.target.value))
                  }
                  className="h-11 text-base tracking-widest"
                  dir="ltr"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={getOtp.isPending}
              >
                {getOtp.isPending ? "در حال ارسال..." : "دریافت کد تأیید"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-otp">کد تأیید</Label>
                <Input
                  id="admin-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                    )
                  }
                  className="h-11 text-center text-lg tracking-[0.6em]"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={verifyOtp.isPending || otp.length < 6}
              >
                {verifyOtp.isPending ? "در حال بررسی..." : "تأیید و ورود"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  تغییر شماره
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={countdown > 0 || resendOtp.isPending}
                  onClick={handleResend}
                  className="text-muted-foreground hover:text-foreground tabular-nums"
                >
                  {countdown > 0
                    ? `${countdown} ثانیه تا ارسال مجدد`
                    : "ارسال مجدد کد"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  icon,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        active || done
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {icon}
    </div>
  );
}
