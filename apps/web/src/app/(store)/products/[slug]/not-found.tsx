import type { Metadata } from "next";
import { NotFoundPage } from "@/components/store/not-found-page";

export const metadata: Metadata = {
  title: "محصول یافت نشد — الینا",
  robots: { index: false, follow: true },
};

export default function ProductNotFound() {
  return (
    <NotFoundPage
      title="این محصول یافت نشد"
      description="ممکن است محصول برداشته شده یا آدرس تغییر کرده باشد."
      primaryHref="/products"
      primaryLabel="مشاهده همه محصولات"
    />
  );
}
