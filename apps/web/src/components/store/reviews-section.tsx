"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Star } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "الهام مرادی",
    city: "کرج",
    rating: 5,
    text: "شومیز برای تابستون عالیه. پارچه‌اش خنکه و اصلاً بدن‌نما نیست. بسته‌بندی تمیز بود و بعد از شستشو هم فرم لباس تغییر نکرد.",
    initials: "ا",
    color: "#F4AABB",
  },
  {
    id: 2,
    name: "نیلوفر کریمی",
    city: "تهران",
    rating: 5,
    text: "کیفیت پارچه واقعاً خوبه. رنگش بعد از چند بار شستشو هم ثابت مونده. ارسال هم سریع بود و بسته‌بندی مرتب.",
    initials: "ن",
    color: "#8B9D6A",
  },
  {
    id: 3,
    name: "سارا محمدی",
    city: "اصفهان",
    rating: 5,
    text: "ست خریدم برای مسافرت. تنخور عالی داشت و قیمتش به کیفیتش می‌ارزید. حتماً دوباره سفارش میدم.",
    initials: "س",
    color: "#EDD87A",
  },
  {
    id: 4,
    name: "مریم رضایی",
    city: "مشهد",
    rating: 5,
    text: "از طراحی مینیمالش خیلی خوشم اومد. ست‌شدن با چیزای مختلف راحته و رنگش برای همه فصل‌ها مناسبه.",
    initials: "م",
    color: "#B8C5D8",
  },
];

export function ReviewsSection() {
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx((i) => (i - 1 + REVIEWS.length) % REVIEWS.length);
  const next = () => setIdx((i) => (i + 1) % REVIEWS.length);

  const r = REVIEWS[idx];

  return (
    <section className="py-10 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-bold text-zinc-900 mb-6 text-right">نظر کاربران</h2>

      <div className="relative max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: r.color }}
            >
              {r.initials}
            </div>
            <div className="text-right">
              <p className="font-semibold text-zinc-900">{r.name}</p>
              <p className="text-xs text-zinc-400">{r.city}</p>
            </div>
            <div className="flex gap-0.5 ms-auto">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed text-right">«{r.text}»</p>
        </div>

        {/* Arrows */}
        <button
          onClick={next}
          className="absolute top-1/2 -translate-y-1/2 -start-4 w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-zinc-600" />
        </button>
        <button
          onClick={prev}
          className="absolute top-1/2 -translate-y-1/2 -end-4 w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-300 ${i === idx ? "w-4 h-2 bg-zinc-900" : "w-2 h-2 bg-zinc-300"}`}
          />
        ))}
      </div>
      </div>
    </section>
  );
}
