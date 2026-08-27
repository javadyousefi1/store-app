"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  ImageIcon, ShoppingBag, ChevronLeft, Copy, CheckCircle2,
  Truck, CreditCard, Ticket, X, Landmark, ExternalLink, MapPin, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCart } from "@/hooks/use-cart";
import { useCheckout, useUploadReceipt, useCancelOrder } from "@/hooks/use-user-orders";
import { useQuoteCoupon } from "@/hooks/use-coupons";
import { useSettings } from "@/hooks/use-settings";
import { useAttributeOptions } from "@/hooks/use-attribute-options";
import {
  useShippingCities, useShippingQuote, useShippingStates,
} from "@/hooks/use-shipping";
import { VariantAttributes } from "@/components/store/variant-attributes";
import { cn } from "@/lib/utils";
import type { DeliveryType, PaymentMethod } from "@/types";

interface AppliedCoupon {
  code: string;
  percentage: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  eligibleVariantIds: string[];
}

function fmtCard(n: string): string {
  return n.match(/.{1,4}/g)?.join(" ") ?? n;
}

function price(p: string | number) {
  return Number(p).toLocaleString("fa-IR") + " تومان";
}

type Phase = "idle" | "placing" | "uploading" | "redirecting";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: settings } = useSettings();
  const { data: attributes } = useAttributeOptions();

  // Translate hex color codes to their human labels for the order summary.
  const valueLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const attr of attributes ?? []) {
      for (const v of attr.values) {
        if (v.label) labels[v.value] = v.label;
      }
    }
    return labels;
  }, [attributes]);
  const bankCard = settings?.bankCard ?? null;
  const checkout = useCheckout();
  const uploadReceipt = useUploadReceipt();
  const cancelOrder = useCancelOrder();

  const [phase, setPhase] = useState<Phase>("idle");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", postalCode: "", note: "",
    mobile: "", nationalCode: "",
    stateCode: null as number | null,
    stateName: "",
    cityCode: null as number | null,
    cityName: "",
    deliveryType: "iran_post" as DeliveryType,
    paymentMethod: "online_gateway" as PaymentMethod,
  });

  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const quoteCoupon = useQuoteCoupon();

  // Iran-Post shipping — states/cities dropdowns + live quote.
  const isIranPost = form.deliveryType === "iran_post";
  const { data: states } = useShippingStates();
  const { data: cities } = useShippingCities(isIranPost ? form.stateCode : null);
  const shippingQuote = useShippingQuote();
  const [quotedShipping, setQuotedShipping] = useState<number>(0);
  // Local flag — react-query's `isPending` flips off before the *new* mutation
  // is scheduled if the effect resets it during a city change. We want a
  // single, monotonically-safe "waiting on a quote" signal that stays true
  // from the moment the city changes until the response actually arrives.
  const [isQuoting, setIsQuoting] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0);
  const discount = applied?.discountAmount ?? 0;
  const shippingCost = isIranPost ? quotedShipping : 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;
  const busy = phase !== "idle";
  const isCardToCard = form.paymentMethod === "card_to_card";
  const isOnlineGateway = form.paymentMethod === "online_gateway";

  // Re-quote whenever cart items change, so the applied discount stays in
  // sync (server is the source of truth on eligibility).
  const itemsSig = useMemo(
    () => items.map((i) => `${i.variantId}:${i.quantity}`).join("|"),
    [items],
  );
  const appliedCode = applied?.code ?? null;
  useEffect(() => {
    if (!appliedCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await quoteCoupon.mutateAsync(appliedCode);
        if (cancelled) return;
        if (res.valid) {
          setApplied({
            code: res.code,
            percentage: res.percentage,
            subtotal: res.subtotal,
            discountAmount: res.discountAmount,
            total: res.total,
            eligibleVariantIds: res.eligibleVariantIds,
          });
        } else {
          setApplied(null);
          setCouponInput("");
          toast.warning(`کد «${appliedCode}» دیگر معتبر نیست: ${res.reason}`);
        }
      } catch {
        // Network glitch — leave applied as-is so user can re-apply manually.
      }
    })();
    return () => { cancelled = true; };
    // appliedCode intentionally not in deps: re-running on apply would
    // immediately re-quote the value we just received.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig]);

  // Re-quote shipping whenever the city (or cart) changes. Server computes
  // from the cart, so an item added/removed after a quote could shift the
  // price — this keeps the shown total honest.
  const cityCode = form.cityCode;
  useEffect(() => {
    if (!isIranPost || !cityCode) {
      setQuotedShipping(0);
      setIsQuoting(false);
      return;
    }
    // Invalidate the previous quote immediately so a stale price can never
    // sneak into the "جمع کل" or the submit button between city change and
    // the new response landing.
    setQuotedShipping(0);
    setIsQuoting(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await shippingQuote.mutateAsync(cityCode);
        if (!cancelled) setQuotedShipping(res.shippingCost);
      } catch {
        if (!cancelled) {
          setQuotedShipping(0);
          toast.error("محاسبه هزینه ارسال با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityCode, isIranPost, itemsSig]);

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await quoteCoupon.mutateAsync(code);
      if (res.valid) {
        setApplied({
          code: res.code,
          percentage: res.percentage,
          subtotal: res.subtotal,
          discountAmount: res.discountAmount,
          total: res.total,
          eligibleVariantIds: res.eligibleVariantIds,
        });
        setCouponInput(res.code);
        toast.success("کد تخفیف اعمال شد");
      } else {
        setApplied(null);
        toast.error(res.reason);
      }
    } catch {
      toast.error("خطا در بررسی کد تخفیف");
    }
  }

  function handleRemoveCoupon() {
    setApplied(null);
    setCouponInput("");
  }

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
    if (isCardToCard && !receiptFile) {
      toast.error("لطفاً تصویر رسید واریز را انتخاب کنید");
      return;
    }
    if (isIranPost) {
      if (!form.cityCode || !form.stateCode) {
        toast.error("لطفاً استان و شهر را انتخاب کنید");
        return;
      }
      if (!/^09\d{9}$/.test(form.mobile.trim())) {
        toast.error("شماره موبایل معتبر نیست (مثال: 09121234567)");
        return;
      }
      // Defense-in-depth against the disabled prop being bypassed.
      if (isQuoting || quotedShipping <= 0) {
        toast.error("لطفاً منتظر محاسبه هزینه ارسال بمانید");
        return;
      }
    }

    let orderId: string | null = null;

    try {
      setPhase("placing");
      const res = await checkout.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        deliveryType: form.deliveryType,
        paymentMethod: form.paymentMethod,
        gatewayName: isOnlineGateway ? "zarinpal" : undefined,
        note: form.note.trim() || undefined,
        couponCode: applied?.code,
        ...(isIranPost && {
          mobile: form.mobile.trim(),
          nationalCode: form.nationalCode.trim() || undefined,
          stateCode: form.stateCode!,
          cityCode: form.cityCode!,
          stateName: form.stateName,
          cityName: form.cityName,
        }),
      });
      orderId = res.order.id;

      if (isOnlineGateway) {
        if (!res.redirectUrl) {
          toast.error("خطای درگاه پرداخت — لطفاً دوباره تلاش کنید");
          setPhase("idle");
          return;
        }
        setPhase("redirecting");
        // Hard redirect — leaves our origin for the gateway.
        window.location.href = res.redirectUrl;
        return;
      }

      // card_to_card: order created, now upload the receipt.
      setPhase("uploading");
      await uploadReceipt.mutateAsync({ orderId: res.order.id, file: receiptFile! });

      toast.success("سفارش ثبت و رسید ارسال شد");
      router.push(`/orders/${res.order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (orderId && phase === "uploading") {
        // receipt failed → rollback (card_to_card only)
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
              <CardContent className="space-y-2.5">
                {/*<OptionCard*/}
                {/*  selected={form.deliveryType === "in_person"}*/}
                {/*  onClick={() => setForm((f) => ({ ...f, deliveryType: "in_person" }))}*/}
                {/*  disabled={busy}*/}
                {/*  icon={<Home className="h-4 w-4" />}*/}
                {/*  title="تحویل حضوری"*/}
                {/*  description="تحویل در محل فروشگاه — بدون هزینه ارسال"*/}
                {/*/>*/}
                <OptionCard
                  selected={form.deliveryType === "iran_post"}
                  onClick={() => setForm((f) => ({ ...f, deliveryType: "iran_post" }))}
                  disabled={busy}
                  icon={<Truck className="h-4 w-4" />}
                  title="پست ایران"
                  description="ارسال به سراسر کشور — هزینه بر اساس شهر و وزن محاسبه می‌شود"
                />
              </CardContent>
            </Card>

            {/* Iran Post — recipient + address selectors */}
            {isIranPost && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    اطلاعات ارسال پست
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="استان" required>
                      <SearchableSelect
                        options={(states ?? []).map((s) => ({
                          value: s.postCode.toString(),
                          label: s.nameFa,
                        }))}
                        value={form.stateCode?.toString() ?? null}
                        onChange={(v) => {
                          const s = states?.find((s) => s.postCode.toString() === v);
                          setForm((f) => ({
                            ...f,
                            stateCode: s?.postCode ?? null,
                            stateName: s?.nameFa ?? "",
                            cityCode: null,
                            cityName: "",
                          }));
                        }}
                        placeholder={states ? "انتخاب کنید" : "..."}
                        searchPlaceholder="جستجوی استان"
                        disabled={busy || !states?.length}
                      />
                    </Field>
                    <Field label="شهر" required>
                      <SearchableSelect
                        options={(cities ?? []).map((c) => ({
                          value: c.code.toString(),
                          label: c.nameFa,
                        }))}
                        value={form.cityCode?.toString() ?? null}
                        onChange={(v) => {
                          const c = cities?.find((c) => c.code.toString() === v);
                          setForm((f) => ({
                            ...f,
                            cityCode: c?.code ?? null,
                            cityName: c?.nameFa ?? "",
                          }));
                        }}
                        placeholder={
                          form.stateCode ? (cities ? "انتخاب کنید" : "...") : "ابتدا استان"
                        }
                        searchPlaceholder="جستجوی شهر"
                        disabled={busy || !form.stateCode || !cities?.length}
                      />
                    </Field>
                  </div>
                  <Field label="شماره موبایل گیرنده" required>
                    <Input
                      value={form.mobile}
                      onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                      placeholder="09121234567"
                      dir="ltr"
                      required
                      disabled={busy}
                    />
                  </Field>
                  <Field label="کد ملی (اختیاری)">
                    <Input
                      value={form.nationalCode}
                      onChange={(e) => setForm((f) => ({ ...f, nationalCode: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      placeholder="0012345678"
                      dir="ltr"
                      disabled={busy}
                    />
                  </Field>

                  {isQuoting && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      در حال محاسبه هزینه ارسال...
                    </p>
                  )}
                  {!isQuoting && form.cityCode && quotedShipping > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex items-center justify-between">
                      <span className="text-primary/90">هزینه ارسال:</span>
                      <span className="font-bold text-primary">{price(quotedShipping)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  روش پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <OptionCard
                  selected={form.paymentMethod === "online_gateway"}
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "online_gateway" }))}
                  disabled={busy}
                  icon={<CreditCard className="h-4 w-4" />}
                  title="پرداخت آنلاین"
                  description="انتقال به درگاه امن زرین‌پال و پرداخت با کارت بانکی"
                  badge="سریع"
                />
                {/*<OptionCard*/}
                {/*  selected={form.paymentMethod === "card_to_card"}*/}
                {/*  onClick={() => setForm((f) => ({ ...f, paymentMethod: "card_to_card" }))}*/}
                {/*  disabled={busy}*/}
                {/*  icon={<Landmark className="h-4 w-4" />}*/}
                {/*  title="کارت به کارت"*/}
                {/*  description="واریز مستقیم و ارسال تصویر رسید — تأیید توسط ادمین"*/}
                {/*/>*/}
              </CardContent>
            </Card>

            {/* Receipt upload — only for card_to_card */}
            {isCardToCard && (
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
            )}
          </div>

          {/* ── Right: summary + bank ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">خلاصه سفارش</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => {
                    // Variant-specific image (not the product cover) so the
                    // shopper sees exactly what they're ordering — color/size.
                    const thumb = item.variant.imageUrls?.[0] ?? null;
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center gap-3 text-sm sm:px-6">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted/40">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <VariantAttributes
                            attributes={item.variant.attributes}
                            valueLabels={valueLabels}
                            variant="row"
                            size="sm"
                          />
                          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                            {item.variant.sku}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="font-medium">{price(Number(item.variant.price) * item.quantity)}</p>
                          <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator />
                <div className="px-6 py-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">جمع آیتم‌ها</span>
                    <span>{price(subtotal)}</span>
                  </div>
                  {applied && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="flex items-center gap-1.5">
                        تخفیف
                        <span
                          className="font-mono text-[11px] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5"
                          dir="ltr"
                        >
                          {applied.code}
                        </span>
                        <span className="text-xs text-emerald-700/80">
                          ({applied.percentage.toLocaleString("fa-IR")}٪)
                        </span>
                      </span>
                      <span>− {price(discount)}</span>
                    </div>
                  )}
                  {isIranPost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        هزینه ارسال
                      </span>
                      <span>
                        {form.cityCode
                          ? isQuoting
                            ? "..."
                            : price(shippingCost)
                          : <span className="text-xs text-muted-foreground">شهر را انتخاب کنید</span>
                        }
                      </span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="px-6 py-3 flex justify-between font-bold">
                  <span>جمع کل</span>
                  <span className="text-primary">{price(total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  کد تخفیف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {applied ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-emerald-800" dir="ltr">
                        {applied.code}
                      </p>
                      <p className="text-xs text-emerald-700/80">
                        {applied.percentage.toLocaleString("fa-IR")}٪ تخفیف ·{" "}
                        {price(applied.discountAmount)} کم شد
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={busy || quoteCoupon.isPending}
                      className="text-emerald-700/70 hover:text-destructive transition-colors shrink-0"
                      aria-label="حذف کد تخفیف"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="SUMMER25"
                      dir="ltr"
                      disabled={busy || quoteCoupon.isPending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={
                        busy || quoteCoupon.isPending || !couponInput.trim()
                      }
                    >
                      {quoteCoupon.isPending ? "..." : "اعمال"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {isCardToCard && (
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

            {/*{isOnlineGateway && (*/}
            {/*  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary/90 leading-relaxed">*/}
            {/*    پس از تأیید، به درگاه امن زرین‌پال منتقل می‌شوید. موجودی کالا تا زمان تعیین*/}
            {/*    تکلیف پرداخت (حداکثر ۲۰ دقیقه) برای شما رزرو می‌ماند.*/}
            {/*  </div>*/}
            {/*)}*/}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={
                busy ||
                (isCardToCard && !receiptFile) ||
                (isIranPost && (!form.cityCode || !form.mobile || isQuoting || quotedShipping <= 0))
              }
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  {phase === "placing"
                    ? "در حال ثبت سفارش..."
                    : phase === "uploading"
                    ? "در حال آپلود رسید..."
                    : "در حال انتقال به درگاه..."}
                </span>
              ) : isOnlineGateway ? (
                <span className="flex items-center gap-2">
                  انتقال به درگاه پرداخت
                  <ExternalLink className="h-4 w-4" />
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
  selected, onClick, disabled, title, description, icon, badge,
}: {
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
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
      {icon && (
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {badge && (
            <span className="text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </button>
  );
}
