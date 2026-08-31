import type { Metadata } from "next";
import { NotFoundPage } from "@/components/store/not-found-page";

export const metadata: Metadata = {
  title: "دسته‌بندی یافت نشد — الینا",
  robots: { index: false, follow: true },
};

export default function CategoryNotFound() {
  return (
    <NotFoundPage
      title="این دسته‌بندی یافت نشد"
      description="ممکن است دسته‌بندی حذف شده یا آدرس تغییر کرده باشد."
      primaryHref="/products"
      primaryLabel="مشاهده همه محصولات"
      secondaryHref="/"
    />
  );
}
