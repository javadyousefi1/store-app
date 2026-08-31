import type { Metadata } from "next";
import { NotFoundPage } from "@/components/store/not-found-page";

export const metadata: Metadata = {
  title: "مقاله یافت نشد — الینا",
  robots: { index: false, follow: true },
};

export default function ArticleNotFound() {
  return (
    <NotFoundPage
      title="این مقاله یافت نشد"
      description="ممکن است مقاله حذف شده یا آدرس اشتباه وارد شده باشد."
      primaryHref="/articles"
      primaryLabel="مشاهده همه مقالات"
    />
  );
}
