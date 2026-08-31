import type { Metadata } from "next";
import { ElinaHome } from "@/components/store/elina-home";
import { apiFetch } from "@/lib/server-fetch";
import type { Category, PaginatedResponse, Product, Slider, Story } from "@/types";

export const metadata: Metadata = {
  title: "الینا | فروشگاه آنلاین لباس زنانه — مانتو، تیشرت، شومیز و ست",
  description:
    "خرید آنلاین جدیدترین پوشاک زنانه در الینا؛ مانتو، تیشرت، شومیز، ست، شلوار و کفش با کیفیت تضمینی، ارسال سریع به سراسر ایران و امکان بازگشت تا ۷ روز.",
  keywords: [
    "فروشگاه آنلاین لباس زنانه",
    "خرید مانتو زنانه",
    "تیشرت زنانه",
    "شومیز زنانه",
    "ست زنانه",
    "شلوار زنانه",
    "کفش زنانه",
    "پوشاک زنانه",
    "الینا",
    "خرید آنلاین لباس",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "الینا | فروشگاه آنلاین لباس زنانه",
    description:
      "خرید آنلاین جدیدترین پوشاک زنانه در الینا؛ مانتو، تیشرت، شومیز، ست، شلوار و کفش با کیفیت تضمینی و ارسال سریع.",
    type: "website",
    locale: "fa_IR",
    siteName: "الینا",
  },
};

const REVALIDATE = { next: { revalidate: 300 } };

export default async function LandingPage() {
  const [categories, bestsellersPage, sliders, stories] = await Promise.all([
    apiFetch<Category[]>("/categories?isActive=true", REVALIDATE).catch(() => [] as Category[]),
    apiFetch<PaginatedResponse<Product>>("/products?sort=newest&limit=6", REVALIDATE).catch(
      () => ({ data: [] }) as { data: Product[] },
    ),
    apiFetch<Slider[]>("/sliders", REVALIDATE).catch(() => [] as Slider[]),
    apiFetch<Story[]>("/stories", REVALIDATE).catch(() => [] as Story[]),
  ]);

  return (
    <ElinaHome
      categories={categories}
      bestsellers={bestsellersPage.data}
      sliders={sliders}
      stories={stories}
    />
  );
}
