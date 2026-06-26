"use client";

import { useMergeGuestCart } from "@/hooks/use-cart";
import {
  useGetOtp,
  useResendOtp,
  useVerifyOtp,
} from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KeyRound, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 90;

function formatPhone(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 11);
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

export function StoreLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const mergeGuestCart = useMergeGuestCart();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getOtp = useGetOtp();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const returnTo = searchParams.get("from") || "/";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
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
      await mergeGuestCart.mutateAsync();
      queryClient.invalidateQueries();
      toast.success("خوش آمدید!");
      router.replace(returnTo);
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
    <div className="flex min-h-svh flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#2f3045]">
              {step === "phone" ? "ورود | ثبت‌نام" : "کد تأیید"}
            </h1>
            <p className="mt-2 text-sm text-[#7a7d87]">
              {step === "phone"
                ? "شماره موبایل خود را وارد کنید"
                : `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید`}
            </p>
          </div>

          <div className="flex items-center gap-3">
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

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">شماره موبایل</Label>
                <Input
                  id="store-phone"
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
                <Label htmlFor="store-otp">کد تأیید</Label>
                <Input
                  id="store-otp"
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
