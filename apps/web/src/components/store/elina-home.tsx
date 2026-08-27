import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  Headphones,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { HeroSlider } from "./hero-slider";
import { HomeHeroScrollArea } from "./home-hero-scroll-area";
import { HomeProductGrid } from "./home-product-grid";
import { HomeCatalogGateway } from "./home-catalog-gateway";
import { NewsletterSignup } from "./newsletter-signup";
import { ReviewsSection } from "./reviews-section";
import { StoriesBar } from "./stories-bar";
import type { Category, Product, Slider, Story } from "@/types";

const faqItems = [
  {
    q: "آیا امکان بازگشت کالا وجود دارد؟",
    a: "بله، تا ۲۴ ساعت پس از تحویل، در صورتی که کالا استفاده نشده باشد و شرایط اولیه بسته‌بندی حفظ شده باشد، امکان بازگشت یا تعویض کالا از طریق پنل کاربری فراهم است.",
  },
  {
    q: "هزینه و زمان ارسال چقدر است؟",
    a: "ارسال به سراسر ایران با پست پیشتاز طی ۲ تا ۵ روز کاری انجام می‌شود. برای خریدهای بالای ۲.۵ میلیون تومان، ارسال کاملاً رایگان است.",
  },
  {
    q: "چطور می‌توانم سفارش خود را پیگیری کنم؟",
    a: "پس از ثبت سفارش، کد رهگیری از طریق پیامک برای شما ارسال می‌شود. همچنین در بخش «سفارش‌های من» در حساب کاربری، وضعیت لحظه‌ای سفارش قابل مشاهده است.",
  },
  {
    q: "آیا خرید از الینا امن است؟",
    a: "بله، تمامی تراکنش‌ها از طریق درگاه امن بانکی و با رمزنگاری SSL انجام می‌شود. اطلاعات شخصی و بانکی شما هرگز روی سرور ما ذخیره نمی‌شود.",
  },
  {
    q: "چگونه می‌توانم با پشتیبانی الینا در تماس باشم؟",
    a: "تیم پشتیبانی الینا ۷ روز هفته آماده پاسخگویی است. می‌توانید از طریق چت آنلاین سایت، پیام‌رسان‌ها یا شماره تماس درج شده در بخش تماس با ما با کارشناسان ما صحبت کنید.",
  },
] as const;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "الینا",
  alternateName: "Elina",
  url: "https://elina.com",
  description:
    "فروشگاه آنلاین پوشاک زنانه الینا؛ جدیدترین کالکشن مانتو، تیشرت، شومیز، ست، شلوار و کفش با ارسال سریع به سراسر ایران.",
  areaServed: "IR",
  currenciesAccepted: "IRR",
  paymentAccepted: "درگاه بانکی آنلاین",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const promoBlurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmMGY2Ii8+PC9zdmc+";

const promoCards = [
  {
    title: "کالکشن تابستانه — سبک، خنک و خاص برای روزهای آفتابی",
    href: "/products",
    mobileImage: "/elina/promo/promo-summer-collection-mobile.png",
    desktopImage: "/elina/promo/promo-summer-collection-laptop.png",
    className:
      "group relative aspect-[2/1] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-2 md:row-span-2 md:aspect-auto md:min-h-[540px]",
    sizes: "(max-width: 768px) 100vw, 50vw",
    desktopFit: "contain",
  },
  {
    title: "جدیدترین‌ها — کلکسیون تازه بهار و تابستان",
    href: "/products",
    mobileImage: "/elina/promo/promo-new-arrivals.png",
    desktopImage: "/elina/promo/promo-new-arrivals.png",
    className:
      "group relative aspect-[2/1] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-1 md:aspect-auto",
    sizes: "(max-width: 768px) 100vw, 50vw",
    desktopFit: "cover",
  },
  {
    title: "استایل‌های روزمره — راحت، شیک و همیشه کاربردی",
    href: "/products",
    mobileImage: "/elina/promo/promo-everyday-styles.png",
    desktopImage: "/elina/promo/promo-everyday-styles.png",
    className:
      "group relative aspect-[2/1] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-2 md:aspect-auto",
    sizes: "(max-width: 768px) 100vw, 50vw",
    desktopFit: "cover",
  },
] as const;

function PromoImage({
  src,
  alt,
  sizes,
  className,
  fit = "cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  className: string;
  fit?: "cover" | "contain";
}) {
  const imageClassName = `${
    fit === "contain" ? "object-contain" : "object-cover"
  } transition duration-700 ${
    fit === "contain" ? "" : "group-hover:scale-[1.025]"
  } ${className}`;

  if (!src) {
    return (
      <div
        className={`absolute inset-0 bg-[#f3f0f6] ${className}`}
        aria-label={alt}
        role="img"
      />
    );
  }

  if (src.startsWith("https://")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full ${imageClassName}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      placeholder="blur"
      blurDataURL={promoBlurDataUrl}
      sizes={sizes}
      className={imageClassName}
    />
  );
}

const trustItems = [
  { title: "پشتیبانی ۲۴/۷", text: "همیشه کنار شما هستیم", icon: Headphones },
  { title: "بازگشت آسان", text: "بدون قید و شرط", icon: RefreshCcw },
  { title: "ضمانت کیفیت", text: "بهترین کیفیت پارچه", icon: ShieldCheck },
  { title: "ارسال سریع", text: "ارسال به سراسر ایران", icon: PackageCheck },
];

function TrustBadgesSection() {
  return (
    <section
      aria-labelledby="trust-badges-heading"
      className="content-auto mb-10 rounded-3xl border border-border bg-gradient-to-bl from-brand-50 via-white to-white p-5 shadow-[0_10px_28px_rgba(45,32,67,0.05)] sm:mb-14 sm:p-7"
    >
      <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="text-center md:max-w-md md:text-right">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-[11px] font-medium text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            خرید امن با پشتوانه رسمی
          </div>
          <h2
            id="trust-badges-heading"
            className="mt-3 text-lg font-bold text-brand-800 sm:text-xl"
          >
            با خیال راحت خرید کنید
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5a5266] sm:text-[15px]">
            الینا دارای نماد اعتماد الکترونیکی از وزارت صمت است و تمامی پرداخت‌ها
            از طریق درگاه امن زرین‌پال با رمزنگاری بانکی انجام می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="https://trustseal.enamad.ir/?id=7053706&Code=C4T58bHVn5wGpSxKgRaItrYMiUVnk2oR"
            target="_blank"
            rel="noreferrer"
            referrerPolicy="origin"
            aria-label="نماد اعتماد الکترونیکی"
            className="group flex flex-col items-center gap-2"
          >
            <div className="rounded-2xl border border-border bg-white p-3 shadow-[0_6px_18px_rgba(45,32,67,0.06)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_rgba(45,32,67,0.1)] sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=7053706&Code=C4T58bHVn5wGpSxKgRaItrYMiUVnk2oR"
                alt="نماد اعتماد الکترونیکی"
                {...{ code: "C4T58bHVn5wGpSxKgRaItrYMiUVnk2oR" }}
                loading="lazy"
                decoding="async"
                className="h-20 w-auto sm:h-24"
                style={{ cursor: "pointer" }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#5a5266]">
              نماد اعتماد
            </span>
          </a>

          <a
            href="https://www.zarinpal.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="درگاه پرداخت معتبر زرین‌پال"
            className="group flex flex-col items-center gap-2"
          >
            <div className="rounded-2xl border border-border bg-white p-3 shadow-[0_6px_18px_rgba(45,32,67,0.06)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_rgba(45,32,67,0.1)] sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.zarinpal.com/badges/trustLogo/1.png"
                alt="درگاه پرداخت معتبر زرین‌پال"
                loading="lazy"
                decoding="async"
                className="h-20 w-auto sm:h-24"
              />
            </div>
            <span className="text-[11px] font-medium text-[#5a5266]">
              درگاه پرداخت
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

interface ElinaHomeProps {
  categories: Category[];
  bestsellers: Product[];
  sliders?: Slider[];
  stories?: Story[];
}

export function ElinaHome({ categories, bestsellers, sliders, stories }: ElinaHomeProps) {
  return (
    <div className="w-full pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="sr-only">
        الینا | فروشگاه آنلاین لباس زنانه — مانتو، تیشرت، شومیز، ست و شلوار
      </h1>
      <StoriesBar stories={stories ?? []} />
      <HomeHeroScrollArea
        hero={<HeroSlider sliders={sliders} />}
        categories={
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <section
              id="home-categories"
              className="scroll-mt-24 pt-2 pb-9 sm:py-12"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-800 sm:text-2xl">
                  دسته‌بندی
                </h2>
                <Link
                  href="/products"
                  className="flex items-center gap-1 text-xs text-brand-600 sm:text-sm"
                >
                  مشاهده همه
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
              {/* Mobile: horizontal snap-scroll rail so many categories don't
                  balloon the page height. Desktop keeps the roomy 5-col grid. */}
              <div
                className="-mx-4 flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    className="group w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(42,31,65,0.12)] sm:w-44 lg:w-auto"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div className="relative aspect-[5/6] overflow-hidden bg-muted">
                      {category.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.coverUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200" />
                      )}
                    </div>
                    <p className="py-3.5 text-center text-sm font-semibold text-[#342b3d]">
                      {category.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        }
      />

      <div className="relative z-10 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <section id="bestsellers" className="scroll-mt-24 pb-4 sm:pb-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-800 sm:text-2xl">
                پرفروش‌ها
              </h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-xs text-brand-600 sm:text-sm"
              >
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <HomeProductGrid products={bestsellers} />
          </section>

          <HomeCatalogGateway products={bestsellers} />

          <section className="content-auto grid gap-4 pb-10 sm:gap-5 sm:pb-14 md:grid-cols-2 md:grid-rows-2">
            {promoCards.map((card) => (
              <Link key={card.title} href={card.href} className={card.className}>
                <PromoImage
                  src={card.mobileImage}
                  alt={card.title}
                  sizes={card.sizes}
                  className="md:hidden"
                />
                <PromoImage
                  src={card.desktopImage}
                  alt=""
                  sizes={card.sizes}
                  className="hidden md:block"
                  fit={card.desktopFit ?? "cover"}
                />
              </Link>
            ))}
          </section>

          <section className="content-auto mb-6 grid grid-cols-2 gap-3 pb-4 sm:mb-8 md:grid-cols-4">
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

          <TrustBadgesSection />
        </div>
      </div>

      <section className="relative z-10 w-full overflow-hidden bg-gradient-to-l from-brand-400 via-brand-500 to-brand-700 shadow-[0_10px_28px_rgba(83,58,147,0.14)]">
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-center px-4 py-5 sm:px-8 sm:py-6 lg:px-12">
          <NewsletterSignup />
        </div>
      </section>

      <div className="relative z-10 bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="content-auto">
            <ReviewsSection />
          </div>

          <section
            id="faq"
            aria-labelledby="faq-heading"
            className="content-auto pb-10 sm:pb-14"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="faq-heading"
                className="text-xl font-bold text-brand-800 sm:text-2xl"
              >
                سوالات متداول
              </h2>
            </div>
            <div className="grid gap-3">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_7px_22px_rgba(45,32,67,0.04)] transition sm:px-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#342b3d] marker:hidden sm:text-base [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-180"
                      strokeWidth={2}
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#5a5266] sm:text-[15px]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="about-elina-heading"
            className="content-auto mb-8 rounded-3xl border border-border bg-gradient-to-l from-brand-50 via-white to-white p-6 shadow-[0_10px_28px_rgba(45,32,67,0.04)] sm:p-8 md:p-10"
          >
            <h2
              id="about-elina-heading"
              className="mb-4 text-xl font-bold text-brand-800 sm:text-2xl"
            >
              درباره فروشگاه اینترنتی الینا
            </h2>
            <div className="space-y-3 text-sm leading-7 text-[#5a5266] sm:text-[15px] sm:leading-8">
              <p>
                <strong className="text-[#342b3d]">فروشگاه آنلاین الینا</strong>{" "}
                مقصد امن شما برای{" "}
                <strong className="text-[#342b3d]">
                  خرید پوشاک زنانه
                </strong>{" "}
                با طراحی روز و پارچه‌های باکیفیت است. مجموعه‌ای گسترده از{" "}
                <Link
                  href="/products"
                  className="text-brand-600 underline-offset-4 hover:underline"
                >
                  مانتو، تیشرت، شومیز، ست، شلوار و کفش‌های اسپرت
                </Link>{" "}
                را در الینا پیدا می‌کنید — همراه با ارسال سریع به سراسر ایران و
                امکان بازگشت آسان.
              </p>
              <p>
                از تازه‌های فصل تا استایل‌های همیشه‌کاربردی، هر آنچه برای
                ست‌کردن یک تیپ کامل نیاز دارید در الینا مهیاست. تیم ما جدیدترین
                ترندهای پوشاک زنانه را برای شما گلچین می‌کند تا هر روز با اعتماد
                به نفس بیشتری استایل بزنید و ست موردعلاقه‌تان را با یک کلیک به
                خانه بیاورید.
              </p>
              <p>
                خرید امن با درگاه بانکی مطمئن، پشتیبانی ۷ روز هفته، ضمانت اصالت
                کالا و امکان بازگشت تا ۷ روز — اینها تعهدهای الینا برای یک تجربه
                خرید بدون دغدغه هستند.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
