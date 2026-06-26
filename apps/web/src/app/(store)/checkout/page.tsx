"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  ImageIcon, ShoppingBag, ChevronLeft, Copy, CheckCircle2,
  Truck, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { usePlaceOrder, useUploadReceipt, useCancelOrder } from "@/hooks/use-user-orders";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

function fmtCard(n: string): string {
  return n.match(/.{1,4}/g)?.join(" ") ?? n;
}

function price(p: string | number) {
  return Number(p).toLocaleString("fa-IR") + " تومان";
}

type Phase = "idle" | "placing" | "uploading";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: settings } = useSettings();
  const bankCard = settings?.bankCard ?? null;
  const placeOrder = usePlaceOrder();
  const uploadReceipt = useUploadReceipt();
  const cancelOrder = useCancelOrder();

  const [phase, setPhase] = useState<Phase>("idle");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", postalCode: "", note: "",
    deliveryType: "in_person" as "in_person",
    paymentMethod: "card_to_card" as "card_to_card",
  });

  const items = cart?.items ?? [];
  const total = items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0);
  const busy = phase !== "idle";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("فقط تصویر مجاز است"); return; }
    if (file.size > 1_048_576) { toast.error("حجم فایل نباید بیشتر از ۱ مگابایت باشد"); return; }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) { toast.error("سبد خرید خالی است"); return; }
    if (!receiptFile) { toast.error("لطفاً تصویر رسید واریز را انتخاب کنید"); return; }

    let orderId: string | null = null;

    try {
      setPhase("placing");
      const order = await placeOrder.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        deliveryType: form.deliveryType,
        paymentMethod: form.paymentMethod,
        note: form.note.trim() || undefined,
      });
      orderId = order.id;

      setPhase("uploading");
      await uploadReceipt.mutateAsync({ orderId: order.id, file: receiptFile });

      toast.success("سفارش ثبت و رسید ارسال شد");
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (orderId && phase === "uploading") {
        // receipt failed → rollback
        try { await cancelOrder.mutateAsync(orderId); } catch { /* best effort */ }
        toast.error("آپلود رسید ناموفق بود — سفارش لغو شد. دوباره تلاش کنید");
      } else {
        toast.error(msg ?? "خطا در ثبت سفارش");
      }

      setPhase("idle");
    }
  }

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-lg font-medium">سبد خرید خالی است</p>
        <Link href="/products">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            بازگشت به فروشگاه
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold mb-6">تکمیل سفارش</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: form + receipt ── */}
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">اطلاعات تحویل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="نام" required>
                    <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="علی" required disabled={busy} />
                  </Field>
                  <Field label="نام خانوادگی" required>
                    <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="محمدی" required disabled={busy} />
                  </Field>
                </div>
                <Field label="آدرس کامل" required>
                  <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="تهران، خیابان ولیعصر، پلاک ۱۲" required disabled={busy} />
                </Field>
                <Field label="کد پستی" required>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    placeholder="1234567890"
                    dir="ltr"
                    required
                    disabled={busy}
                  />
                </Field>
                <Field label="یادداشت (اختیاری)">
                  <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="لطفاً زودتر ارسال شود" disabled={busy} />
                </Field>
              </CardContent>
            </Card>

            {/* Delivery type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  نحوه تحویل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OptionCard
                  selected={form.deliveryType === "in_person"}
                  onClick={() => setForm((f) => ({ ...f, deliveryType: "in_person" }))}
                  disabled={busy}
                  title="تحویل حضوری"
                  description="تحویل در محل فروشگاه"
                />
              </CardContent>
            </Card>

            {/* Payment method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  روش پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OptionCard
                  selected={form.paymentMethod === "card_to_card"}
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "card_to_card" }))}
                  disabled={busy}
                  title="کارت به کارت"
                  description="واریز مستقیم و ارسال تصویر رسید"
                />
              </CardContent>
            </Card>

            {/* Receipt upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">تصویر رسید واریز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

                {receiptPreview ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptPreview} alt="رسید" className="w-full max-h-56 object-contain rounded-xl border bg-muted/20" />
                    {!busy && (
                      <button
                        type="button"
                        onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        حذف و انتخاب مجدد
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ImageIcon className="h-7 w-7 opacity-50" />
                    <span className="text-sm font-medium">انتخاب تصویر رسید</span>
                    <span className="text-xs">JPG, PNG — حداکثر ۱ مگابایت</span>
                  </button>
                )}

                {receiptFile && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    تصویر انتخاب شد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: summary + bank ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">خلاصه سفارش</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="px-6 py-3 flex justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{Object.values(item.variant.attributes).join(" / ")}</p>
                        <p className="text-xs text-muted-foreground font-mono" dir="ltr">{item.variant.sku}</p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="font-medium">{price(Number(item.variant.price) * item.quantity)}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="px-6 py-3 flex justify-between font-bold">
                  <span>جمع کل</span>
                  <span className="text-primary">{price(total)}</span>
                </div>
              </CardContent>
            </Card>

            {form.paymentMethod === "card_to_card" && (
              <Card className="bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">اطلاعات واریز</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {bankCard ? (
                    <>
                      {bankCard.bankName && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">بانک</span>
                          <span className="font-medium">{bankCard.bankName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">شماره کارت</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold tracking-widest" dir="ltr">
                            {fmtCard(bankCard.cardNumber)}
                          </span>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(bankCard.cardNumber); toast.success("کپی شد"); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">به نام</span>
                        <span className="font-medium">{bankCard.accountHolder}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      اطلاعات کارت بانکی تنظیم نشده است
                    </p>
                  )}
                  <Separator />
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    مبلغ دقیق <strong className="text-foreground">{price(total)}</strong> واریز کنید
                  </p>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={busy || !receiptFile}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  {phase === "placing" ? "در حال ثبت سفارش..." : "در حال آپلود رسید..."}
                </span>
              ) : (
                "ثبت سفارش و ارسال رسید"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function OptionCard({
  selected, onClick, disabled, title, description,
}: {
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-start transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
        selected ? "border-primary" : "border-muted-foreground/40"
      )}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
