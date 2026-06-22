"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Headphones,
  Heart,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { HeroSlider } from "./hero-slider";
import { ReviewsSection } from "./reviews-section";
import { cn } from "@/lib/utils";

const categories = [
  { label: "تیشرت", image: "/elina/category-tshirt.png" },
  { label: "مانتو", image: "/elina/category-coat.png" },
  { label: "ست", image: "/elina/category-set.png" },
  { label: "شلوار", image: "/elina/category-pants.png" },
  { label: "کفش", image: "/elina/category-shoes.png" },
];

const products = [
  {
    name: "دامن لینن کمربندی",
    price: "۳۹۹,۰۰۰",
    image: "/elina/product-skirt.png",
  },
  {
    name: "تی‌شرت نخی طرح‌دار",
    price: "۳۹۹,۰۰۰",
    image: "/elina/product-pink-tee.png",
  },
  {
    name: "پیراهن لینن تابستانی",
    price: "۵۹۹,۰۰۰",
    image: "/elina/product-white-tee.png",
  },
  {
    name: "ست لینن دو تکه",
    price: "۶۹۹,۰۰۰",
    image: "/elina/product-linen-set.png",
  },
  {
    name: "شلوار لینن آزاد",
    price: "۵۱۹,۰۰۰",
    image: "/elina/product-floral-pants.png",
  },
  {
    name: "شلوار جین نیمه‌آزاد",
    price: "۴۸۹,۰۰۰",
    image: "/elina/product-jeans.jpg",
  },
];

const trustItems = [
  { title: "پشتیبانی ۲۴/۷", text: "همیشه کنار شما هستیم", icon: Headphones },
  { title: "بازگشت آسان", text: "بدون قید و شرط", icon: RefreshCcw },
  { title: "ضمانت کیفیت", text: "بهترین کیفیت پارچه", icon: ShieldCheck },
  { title: "ارسال سریع", text: "ارسال به سراسر ایران", icon: PackageCheck },
];

export function ElinaHome() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("");
  const [registered, setRegistered] = useState(false);

  const toggleLike = (name: string) => {
    setLiked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addToCart = (name: string) => {
    setAdded((current) => new Set(current).add(name));
  };

  return (
    <div className="w-full pb-8">
      <div className="relative">
        <HeroSlider />
        <div data-home-hero-end className="pointer-events-none h-px" />

        <div className="relative z-10 bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <section
              id="home-categories"
              className="scroll-mt-24 py-9 sm:py-12"
            >
              <h2 className="mb-5 text-right text-xl font-bold text-brand-800 sm:text-2xl">
                دسته‌بندی
              </h2>
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4">
                {categories.map((category) => (
                  <Link
                    key={category.label}
                    href="/products"
                    className="group overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(42,31,65,0.12)]"
                  >
                    <div className="relative aspect-[5/6] overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.label}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.035]"
                      />
                    </div>
                    <p className="py-3.5 text-center text-sm font-semibold text-[#342b3d]">
                      {category.label}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <section id="season-picks" className="scroll-mt-24 pb-10 sm:pb-14">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-800 sm:text-2xl">
                <span className="lg:hidden">پرفروش‌ها</span>
                <span className="hidden lg:inline">منتخب فصل</span>
              </h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-xs text-brand-600 sm:text-sm"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
              {products.map((product) => (
                <article
                  key={product.name}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.1)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleLike(product.name)}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur"
                    aria-label={`افزودن ${product.name} به علاقه‌مندی‌ها`}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition",
                        liked.has(product.name)
                          ? "fill-primary text-primary"
                          : "text-[#625b67]",
                      )}
                    />
                  </button>
                  <Link
                    href="/products"
                    className="relative block aspect-[3/4] overflow-hidden"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.035]"
                    />
                  </Link>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-right text-xs font-medium text-[#37303d] sm:text-sm">
                        {product.name}
                      </p>
                      <p className="shrink-0 text-xs font-bold text-primary sm:text-sm">
                        {product.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(product.name)}
                      className={cn(
                        "mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition",
                        added.has(product.name)
                          ? "bg-secondary text-primary"
                          : "bg-primary text-primary-foreground shadow-sm hover:bg-brand-700",
                      )}
                    >
                      {added.has(product.name) ? (
                        <>
                          <Check className="h-4 w-4" />
                          افزوده شد
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          افزودن به سبد
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 pb-10 sm:gap-5 sm:pb-14 md:grid-cols-2 md:grid-rows-2">
            <Link
              href="/products"
              className="group relative min-h-[330px] overflow-hidden rounded-3xl shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-2 md:row-span-2 md:min-h-[540px]"
            >
              <Image
                src="/elina/promo-summer.png"
                alt="کالکشن تابستانه"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.025]"
              />
            </Link>
            <Link
              href="/products"
              className="group relative aspect-[2/1] overflow-hidden rounded-3xl shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-1 md:aspect-auto"
            >
              <Image
                src="/elina/promo-new.png"
                alt="جدیدترین‌ها"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.025]"
              />
            </Link>
            <Link
              href="/products"
              className="group relative aspect-[2/1] overflow-hidden rounded-3xl shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-2 md:aspect-auto"
            >
              <Image
                src="/elina/promo-daily.png"
                alt="استایل‌های روزمره"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.025]"
              />
            </Link>
          </section>
        </div>
      </div>

      <section className="relative z-10 w-full overflow-hidden bg-gradient-to-l from-brand-400 via-brand-500 to-brand-700 shadow-[0_10px_28px_rgba(83,58,147,0.14)]">
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-center px-4 py-5 sm:px-8 sm:py-6 lg:px-12">
          <form
            className="w-full max-w-4xl text-center"
            onSubmit={(event) => {
              event.preventDefault();
              if (phone.trim()) setRegistered(true);
            }}
          >
            <h2 className="text-xl font-bold leading-relaxed text-white sm:text-2xl">
              دریافت کد تخفیف اولین خرید
            </h2>
            <p className="mt-1 text-sm font-semibold leading-7 text-white sm:text-base">
              شماره‌ات رو وارد کن و از تخفیف‌ها و کالکشن‌های جدید جا نمون.
            </p>
            <div className="mx-auto mt-3 flex max-w-2xl flex-row gap-2">
              <input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setRegistered(false);
                }}
                inputMode="tel"
                placeholder="شماره موبایل"
                className="h-10 min-w-0 flex-1 rounded-full border border-white/40 bg-white px-4 text-right text-xs text-[#33234e] shadow-sm outline-none placeholder:text-[#958ba1] focus:ring-4 focus:ring-white/20 sm:h-11 sm:px-5 sm:text-sm"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full border border-white bg-white px-4 text-xs font-semibold text-[#51495b] shadow-[0_6px_16px_rgba(47,32,82,0.22)] transition-colors hover:bg-brand-50 sm:h-11 sm:px-7 sm:text-sm"
              >
                دریافت کد تخفیف
              </button>
            </div>
            {registered && (
              <p className="mt-2 text-xs text-white">
                شماره شما با موفقیت ثبت شد.
              </p>
            )}
          </form>
        </div>
      </section>

      <div className="relative z-10 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <ReviewsSection />

          <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="flex min-h-24 items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-[0_7px_22px_rgba(45,32,67,0.04)] sm:p-5"
              >
                <item.icon
                  className="h-7 w-7 shrink-0 text-brand-600 sm:h-8 sm:w-8"
                  strokeWidth={1.6}
                />
                <div>
                  <p className="text-xs font-semibold text-[#342a40] sm:text-sm">
                    {item.title}
                  </p>
                  <p className="mt-1 hidden text-[11px] text-[#8b8491] sm:block">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
