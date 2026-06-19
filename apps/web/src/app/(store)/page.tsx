import Link from "next/link";
import {
  Truck, RefreshCw, ShieldCheck, Headphones,
  Shirt, Package, Layers, Gem, Footprints,
} from "lucide-react";
import { apiFetch } from "@/lib/server-fetch";
import { HeroSlider } from "@/components/store/hero-slider";
import { BestsellersSection } from "@/components/store/bestsellers-section";
import { ReviewsSection } from "@/components/store/reviews-section";
import type { Category, PaginatedResponse, Product } from "@/types";

const W = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

export default async function LandingPage() {
  const [categories, productsRes] = await Promise.all([
    apiFetch<Category[]>("/categories").catch(() => [] as Category[]),
    apiFetch<PaginatedResponse<Product>>("/products?limit=12").catch(
      () => ({ data: [], total: 0, page: 1, limit: 12, totalPages: 1 } as PaginatedResponse<Product>)
    ),
  ]);

  return (
    <>
      {/* ── Hero ── */}
      <div className={W}>
        <HeroSlider />
      </div>

      {/* ── Categories ── */}
      <section className="py-6 lg:py-10">
        <div className={W}>
          <h2 className="text-lg font-bold text-zinc-900 mb-4 text-right">دسته‌بندی</h2>
          <div className="grid grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {CATEGORY_ITEMS.map((cat) => {
              const match = categories.find((c) => c.name.includes(cat.keyword) || cat.keyword.includes(c.name));
              return (
                <Link key={cat.label} href={match ? `/products?categoryId=${match.id}` : "/products"} className="flex flex-col items-center gap-2 group">
                  <div
                    className="w-full aspect-square rounded-2xl border border-zinc-100 flex items-center justify-center transition-all group-hover:shadow-md group-hover:scale-105"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <cat.icon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" style={{ color: cat.color }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-700">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Promo cards ── */}
      <section className="py-2 lg:py-4">
        <div className={W}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {PROMO_CARDS.map((card) => (
              <Link
                key={card.title}
                href="/products"
                className="relative rounded-2xl overflow-hidden h-28 sm:h-32 lg:h-36 flex items-center justify-between px-4 lg:px-5 group"
                style={{ backgroundColor: card.bg }}
              >
                <div className="text-right z-10">
                  <p className="text-sm font-bold text-zinc-900">{card.title}</p>
                  <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed hidden sm:block">{card.desc}</p>
                  <span className="inline-block mt-2 text-xs bg-white/70 px-2.5 py-0.5 rounded-full text-zinc-700">مشاهده</span>
                </div>
                <div
                  className="w-14 sm:w-16 lg:w-20 aspect-square rounded-xl opacity-40 shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: card.shapeColor }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bestsellers ── */}
      <BestsellersSection products={productsRes.data} categories={categories} />

      {/* ── Reviews ── */}
      <ReviewsSection />

      {/* ── Trust badges ── */}
      <section className="py-10 border-t border-zinc-100">
        <div className={W}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-zinc-700" />
                </div>
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const CATEGORY_ITEMS = [
  { label: "تیشرت",    keyword: "تیشرت",    icon: Shirt,      bg: "#FFF3F3", color: "#E07070" },
  { label: "شلوار",    keyword: "شلوار",    icon: Package,    bg: "#F0F4FF", color: "#6080C0" },
  { label: "ست",       keyword: "ست",       icon: Layers,     bg: "#F3F8F0", color: "#6A9A5A" },
  { label: "اکسسوری", keyword: "اکسسوری", icon: Gem,         bg: "#FFF8EC", color: "#C09040" },
  { label: "کفش",      keyword: "کفش",      icon: Footprints, bg: "#F5F0FC", color: "#8060B0" },
];

const PROMO_CARDS = [
  { title: "رنگ‌های محبوب",    desc: "انتخاب رنگ‌های پرفروش",  bg: "#F0F4E8", shapeColor: "#8B9D6A" },
  { title: "تابستانه خنک",     desc: "پارچه‌های سبک و راحت",    bg: "#EBF3F8", shapeColor: "#7AAFC8" },
  { title: "ست ترند",          desc: "هماهنگ، شیک، به‌روز",     bg: "#F8F3EC", shapeColor: "#C8A878" },
  { title: "بیسیک‌های روزمره", desc: "خرید هوشمند برای هر روز", bg: "#F8EEF0", shapeColor: "#E0A0A8" },
];

const TRUST_ITEMS = [
  { title: "ارسال سریع",    desc: "۲ تا ۳ روز کاری", icon: Truck },
  { title: "بازگشت رایگان", desc: "تا ۷ روز",         icon: RefreshCw },
  { title: "ضمانت اصالت",  desc: "کالای اورجینال",    icon: ShieldCheck },
  { title: "پشتیبانی سریع", desc: "هر روز ۹ تا ۲۱",  icon: Headphones },
];
