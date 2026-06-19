"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Phone, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetOtp, useResendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { registerAuthModalTrigger } from "@/lib/auth-modal-trigger";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 90;

function formatPhone(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 11);
}

function StepDot({ active, done, icon }: { active: boolean; done: boolean; icon: React.ReactNode }) {
  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors shrink-0",
      active || done
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-muted text-muted-foreground"
    )}>
      {icon}
    </div>
  );
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  const getOtp = useGetOtp();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  useEffect(() => {
    registerAuthModalTrigger(() => {
      setStep("phone");
      setPhone("");
      setOtp("");
      setCountdown(0);
      setOpen(true);
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
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
      const code = res?.data?.otp;
      toast.success(code ? `کد تأیید: ${code}` : "کد تأیید ارسال شد");
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
      setOpen(false);
      qc.invalidateQueries();
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
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>ورود به حساب کاربری</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <StepDot active={step === "phone"} done={step === "otp"} icon={<Phone className="w-3.5 h-3.5" />} />
            <div className={cn("flex-1 h-px transition-colors", step === "otp" ? "bg-primary" : "bg-border")} />
            <StepDot active={step === "otp"} done={false} icon={<KeyRound className="w-3.5 h-3.5" />} />
          </div>

          <p className="text-sm text-muted-foreground">
            {step === "phone"
              ? "شماره موبایل خود را وارد کنید"
              : `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید`}
          </p>

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-phone">شماره موبایل</Label>
                <Input
                  id="modal-phone"
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

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-otp">کد تأیید</Label>
                <Input
                  id="modal-otp"
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
        </DialogContent>
      </Dialog>
    </>
  );
}
