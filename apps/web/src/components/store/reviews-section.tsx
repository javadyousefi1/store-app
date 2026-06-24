"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const reviews = [
  {
    name: "نگار رضایی",
    city: "تهران",
    text: "استایل‌ها متنوع و رنگ‌ها دقیقاً مثل عکس‌هاست. بسته‌بندی مرتب بود و خرید خیلی خوبی داشتم.",
  },
  {
    name: "سارینا نوری",
    city: "شیراز",
    text: "ارسال سریع انجام شد و کیفیت پارچه و دوخت لباس از چیزی که انتظار داشتم بهتر بود.",
  },
  {
    name: "مریم احمدی",
    city: "اصفهان",
    text: "تن‌خور لباس خیلی خوب بود و راهنمای سایز کمک کرد دقیقاً انتخاب درستی داشته باشم.",
  },
  {
    name: "الهام کریمی",
    city: "کرج",
    text: "بعد از چند بار شست‌وشو فرم و رنگ لباس کاملاً حفظ شده و دوباره از الینا خرید می‌کنم.",
  },
];

export function ReviewsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % reviews.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setActive((index + reviews.length) % reviews.length);
  };

  const review = reviews[active];

  return (
    <section className="py-12 sm:py-16">
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold text-[#282033] sm:text-3xl">
          نظر مشتریان
        </h2>
        <p className="mt-2 text-sm text-[#776f7e]">
          بخشی از تجربه خرید مشتریان الینا
        </p>
      </div>

      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex shrink-0 flex-col gap-3">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-[#332b3d] shadow-sm transition hover:border-primary hover:text-primary"
            aria-label="نظر قبلی"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-[#332b3d] shadow-sm transition hover:border-primary hover:text-primary"
            aria-label="نظر بعدی"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <article
          className="min-h-64 flex-1 rounded-lg border border-border bg-white p-6 shadow-[0_10px_30px_rgba(48,35,70,0.05)] sm:p-8"
          aria-roledescription="اسلاید نظر مشتری"
          aria-label={`نظر ${active + 1} از ${reviews.length}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="font-bold text-[#2d2438]">{review.name}</p>
              <p className="mt-1 text-xs text-[#6f6675]">{review.city}</p>
            </div>
            <div
              role="img"
              className="flex gap-1 text-[#efb32f]"
              aria-label="امتیاز پنج از پنج"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
          <p className="pt-5 text-right text-sm leading-8 text-[#4f4658] sm:text-base">
            «{review.text}»
          </p>
        </article>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {reviews.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => goTo(index)}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            aria-label={`نمایش نظر ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
          >
            <span
              className={cn(
                "h-2 rounded-full transition-all",
                index === active ? "w-6 bg-primary" : "w-2 bg-[#c8c1cc]",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
