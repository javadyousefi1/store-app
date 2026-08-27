import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دسته‌بندی یافت نشد",
  robots: { index: false, follow: true },
};

export default function CategoryNotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        این دسته‌بندی در فروشگاه الینا یافت نشد
      </h1>
      <p className="text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
        ممکن است دسته‌بندی برداشته شده یا آدرس اشتباه وارد شده باشد. از
        لیست کامل محصولات، دسته‌بندی دلخواه خود را پیدا کنید.
      </p>
      <Link
        href="/products"
        className="rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        مشاهده همه محصولات
      </Link>
    </div>
  );
}
