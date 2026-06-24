import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Headphones,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { HeroSlider } from "./hero-slider";
import { HomeProductGrid } from "./home-product-grid";
import { NewsletterSignup } from "./newsletter-signup";
import { ReviewsSection } from "./reviews-section";

const categories = [
  { label: "تیشرت", image: "/elina/category-tshirt.webp" },
  { label: "مانتو", image: "/elina/category-coat.webp" },
  { label: "ست", image: "/elina/category-set.webp" },
  { label: "شلوار", image: "/elina/category-pants.webp" },
  { label: "کفش", image: "/elina/category-shoes.webp" },
];

const products = [
  {
    name: "دامن لینن کمربندی",
    price: "۳۹۹,۰۰۰",
    image: "/elina/product-skirt.webp",
  },
  {
    name: "تی‌شرت نخی طرح‌دار",
    price: "۳۹۹,۰۰۰",
    image: "/elina/product-pink-tee.webp",
  },
  {
    name: "پیراهن لینن تابستانی",
    price: "۵۹۹,۰۰۰",
    image: "/elina/product-white-tee.webp",
  },
  {
    name: "ست لینن دو تکه",
    price: "۶۹۹,۰۰۰",
    image: "/elina/product-linen-set.webp",
  },
  {
    name: "شلوار لینن آزاد",
    price: "۵۱۹,۰۰۰",
    image: "/elina/product-floral-pants.webp",
  },
  {
    name: "شلوار جین نیمه‌آزاد",
    price: "۴۸۹,۰۰۰",
    image: "/elina/product-jeans.jpg",
  },
];

const promoBlurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmMGY2Ii8+PC9zdmc+";

const promoCards = [
  {
    title: "جایگاه تصویر پرومو اصلی",
    href: "/products",
    mobileImage: "",
    desktopImage: "",
    className:
      "group relative min-h-[330px] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-2 md:row-span-2 md:min-h-[540px]",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    title: "جایگاه تصویر پرومو جدیدترین‌ها",
    href: "/products",
    mobileImage: "",
    desktopImage: "",
    className:
      "group relative aspect-[2/1] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-1 md:aspect-auto",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  {
    title: "جایگاه تصویر پرومو روزمره",
    href: "/products",
    mobileImage: "",
    desktopImage: "",
    className:
      "group relative aspect-[2/1] overflow-hidden rounded-3xl bg-[#f3f0f6] shadow-[0_12px_34px_rgba(49,36,74,0.1)] md:col-start-1 md:row-start-2 md:aspect-auto",
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
] as const;

function PromoImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className: string;
}) {
  const imageClassName = `object-cover transition duration-700 group-hover:scale-[1.025] ${className}`;

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

export function ElinaHome() {
  return (
    <div className="w-full pb-8">
      <h1 className="sr-only">فروشگاه آنلاین لباس زنانه الینا</h1>
      <div className="relative">
        <HeroSlider />
        <div data-home-hero-end className="pointer-events-none h-px" />

        <div className="relative z-20 bg-white">
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
                        alt=""
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
            <HomeProductGrid products={products} />
          </section>

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
                />
              </Link>
            ))}
          </section>
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

          <section className="content-auto mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
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
