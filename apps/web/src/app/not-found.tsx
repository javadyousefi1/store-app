import type { Metadata } from "next";
import { NotFoundPage } from "@/components/store/not-found-page";

export const metadata: Metadata = {
  title: "صفحه یافت نشد — الینا",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <NotFoundPage
      title="این صفحه وجود ندارد"
      description="آدرسی که وارد کردید اشتباه است یا صفحه حذف شده."
      primaryHref="/products"
      primaryLabel="مشاهده محصولات"
    />
  );
}
