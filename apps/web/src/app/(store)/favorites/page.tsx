import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
      <Heart className="mx-auto h-12 w-12 text-primary/35" />
      <h1 className="text-xl font-bold text-[#3f4064]">علاقه‌مندی‌ها</h1>
      <p className="text-sm text-muted-foreground">
        هنوز محصولی به علاقه‌مندی‌های شما اضافه نشده است.
      </p>
      <Link href="/products">
        <Button variant="outline" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          مشاهده محصولات
        </Button>
      </Link>
    </div>
  );
}
