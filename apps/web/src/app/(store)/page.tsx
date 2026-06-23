import type { Metadata } from "next";
import { ElinaHome } from "@/components/store/elina-home";

export const metadata: Metadata = {
  title: "فروشگاه آنلاین لباس زنانه",
  description:
    "خرید جدیدترین پوشاک زنانه الینا؛ مانتو، تیشرت، ست، شلوار و استایل‌های منتخب فصل با ارسال سریع.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return <ElinaHome />;
}
