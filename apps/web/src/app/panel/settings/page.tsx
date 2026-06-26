"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Bot, Save, Eye, EyeOff, Trash2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { formatDate } from "@/lib/format";

function fmtCardDisplay(raw: string): string {
  return raw.match(/.{1,4}/g)?.join(" ") ?? raw;
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();

  // ── Bale Bot ──
  const [baleToken, setBaleToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  // ── Bank Card ──
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  useEffect(() => {
    if (data) {
      setBaleToken(data.tokenBaleBot ?? "");
      setBankName(data.bankCard?.bankName ?? "");
      setAccountHolder(data.bankCard?.accountHolder ?? "");
      setCardNumber(data.bankCard?.cardNumber ?? "");
    }
  }, [data]);

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    setCardNumber(raw);
  }

  const cardValid = cardNumber.length === 16 && bankName.trim() && accountHolder.trim();

  // ── Handlers ──
  async function handleSaveBaleToken() {
    try {
      await update.mutateAsync({ tokenBaleBot: baleToken.trim() || null });
      toast.success("تنظیمات ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات");
    }
  }

  async function handleClearBaleToken() {
    try {
      await update.mutateAsync({ tokenBaleBot: null });
      setBaleToken("");
      toast.success("توکن حذف شد");
    } catch {
      toast.error("خطا در حذف توکن");
    }
  }

  async function handleSaveBankCard() {
    if (!cardValid) return;
    try {
      await update.mutateAsync({
        bankCard: {
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
          cardNumber: cardNumber,
        },
      });
      toast.success("اطلاعات کارت ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره اطلاعات کارت");
    }
  }

  async function handleDeleteBankCard() {
    try {
      await update.mutateAsync({ bankCard: null });
      setBankName("");
      setAccountHolder("");
      setCardNumber("");
      toast.success("اطلاعات کارت حذف شد");
    } catch {
      toast.error("خطا در حذف اطلاعات کارت");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">تنظیمات</h2>
        {data?.updatedAt && (
          <p className="text-xs text-muted-foreground mt-0.5">
            آخرین بروزرسانی: {formatDate(data.updatedAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Bale Bot ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              ربات بله
            </CardTitle>
            <CardDescription className="text-sm">
              توکن ربات بله برای ارسال اعلان سفارشات. اختیاری است — خالی گذاشتن آن توکن را حذف می‌کند.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="bale-token">توکن ربات</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="bale-token"
                        type={showToken ? "text" : "password"}
                        value={baleToken}
                        onChange={(e) => setBaleToken(e.target.value)}
                        placeholder="مثال: 1234567890:ABCdefGHIjklMNOpqrSTUvwxyz"
                        dir="ltr"
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {data?.tokenBaleBot && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleClearBaleToken}
                        disabled={update.isPending}
                        className="shrink-0 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                        aria-label="حذف توکن"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    برای دریافت توکن، ربات BotFather در بله را جستجو کنید.
                  </p>
                </div>
                <Button onClick={handleSaveBaleToken} disabled={update.isPending} className="gap-2">
                  {update.isPending
                    ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    : <Save className="h-4 w-4" />}
                  ذخیره تنظیمات
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Bank Card ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              کارت بانکی
            </CardTitle>
            <CardDescription className="text-sm">
              اطلاعات کارت برای پرداخت کارت به کارت در مرحله ثبت سفارش نمایش داده می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              <>
                {/* Current card preview */}
                {data?.bankCard && (
                  <div className="rounded-xl bg-zinc-900 text-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{data.bankCard.bankName}</span>
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="font-mono text-lg tracking-widest text-center">
                      {fmtCardDisplay(data.bankCard.cardNumber)}
                    </p>
                    <p className="text-sm text-zinc-300 text-right">{data.bankCard.accountHolder}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank-name">نام بانک</Label>
                    <Input
                      id="bank-name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: بانک ملت"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="account-holder">نام صاحب حساب</Label>
                    <Input
                      id="account-holder"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="مثال: علی احمدی"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="card-number">شماره کارت</Label>
                    <Input
                      id="card-number"
                      dir="ltr"
                      inputMode="numeric"
                      value={fmtCardDisplay(cardNumber)}
                      onChange={handleCardNumberChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="font-mono tracking-widest text-center"
                      maxLength={19}
                    />
                    {cardNumber.length > 0 && cardNumber.length < 16 && (
                      <p className="text-xs text-destructive">شماره کارت باید ۱۶ رقم باشد ({cardNumber.length}/16)</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBankCard}
                    disabled={update.isPending || !cardValid}
                    className="gap-2 flex-1"
                  >
                    {update.isPending
                      ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      : <Save className="h-4 w-4" />}
                    ذخیره کارت
                  </Button>
                  {data?.bankCard && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDeleteBankCard}
                      disabled={update.isPending}
                      className="shrink-0 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      aria-label="حذف کارت"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
