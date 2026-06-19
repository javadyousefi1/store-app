"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export default function LoginPage() {
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 11) { toast.error("شماره موبایل باید ۱۱ رقم باشد"); return; }
    try {
      const res = await getOtp.mutateAsync({ phone });
      setStep("otp");
      startCountdown();
      const otp = res?.data?.otp;
      toast.success(otp ? `کد تأیید: ${otp}` : "کد تأیید ارسال شد");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ارسال کد");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await verifyOtp.mutateAsync({ phone, otp });
      toast.success("ورود موفق");
      router.push("/panel");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "کد اشتباه است");
    }
  }

  async function handleResend() {
    try {
      await resendOtp.mutateAsync({ phone });
      startCountdown();
      toast.success("کد مجدداً ارسال شد");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ارسال مجدد");
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — branding (hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-primary flex-col items-center justify-center gap-6 p-10 text-primary-foreground">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold">فروشگاه آنلاین</h1>
          <p className="text-primary-foreground/70 text-sm max-w-xs leading-relaxed">
            سیستم مدیریت محصولات، سفارشات و کاربران فروشگاه
          </p>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-3">
          {["مدیریت محصولات و دسته‌بندی‌ها", "مشاهده و مدیریت کاربران", "تعریف ویژگی‌های variant"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-primary-foreground/80">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-background">
        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">فروشگاه آنلاین</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-2">
            <StepDot active={step === "phone"} done={step === "otp"} icon={<Phone className="w-3.5 h-3.5" />} />
            <div className={cn("flex-1 h-px transition-colors", step === "otp" ? "bg-primary" : "bg-border")} />
            <StepDot active={step === "otp"} done={false} icon={<KeyRound className="w-3.5 h-3.5" />} />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">
              {step === "phone" ? "ورود به پنل" : "کد تأیید"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "phone"
                ? "شماره موبایل خود را وارد کنید"
                : `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید`}
            </p>
          </div>

          {/* Phone step */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="h-11 text-base tracking-widest"
                  dir="ltr"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={getOtp.isPending}>
                {getOtp.isPending ? "در حال ارسال..." : "دریافت کد تأیید"}
              </Button>
            </form>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">کد تأیید</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  className="h-11 text-center tracking-[0.6em] text-lg"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={verifyOtp.isPending || otp.length < 6}>
                {verifyOtp.isPending ? "در حال بررسی..." : "تأیید و ورود"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => { setStep("phone"); setOtp(""); }}
                >
                  <Phone className="w-3.5 h-3.5" />
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
                  {countdown > 0 ? `${countdown} ثانیه تا ارسال مجدد` : "ارسال مجدد کد"}
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
        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors shrink-0",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : done
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {icon}
    </div>
  );
}
