"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SHIRT_COLORS = [
  { hex: "#EDD87A" },
  { hex: "#8B9D6A" },
  { hex: "#F4AABB" },
  { hex: "#F0F0EE" },
];

const SLIDES = [
  {
    title: "شومیز ستاره‌ای؛",
    line2: "انتخاب خنک تابستان",
    sub: "سبک، خنک، همیشه شیک",
    badge: "در ۴ رنگ",
    cta: "خرید شومیز ستاره‌ای",
    href: "/products",
    bg: "#F5EEE6",
    colorRotate: true,
    color: "",
  },
  {
    title: "ست لینن",
    line2: "راحتی بدون توضیح",
    sub: "قابل ست، پارچه سبک",
    badge: "محبوب فصل",
    cta: "مشاهده ست‌ها",
    href: "/products",
    bg: "#EEF3EE",
    colorRotate: false,
    color: "#8B9D6A",
  },
  {
    title: "کلکسیون بیسیک",
    line2: "هر روز شیک",
    sub: "خرید هوشمند، هویت ثابت",
    badge: "پرفروش",
    cta: "مشاهده بیسیک‌ها",
    href: "/products",
    bg: "#EEF0F5",
    colorRotate: false,
    color: "#B8C5D8",
  },
];

export function HeroSlider() {
  const [slide, setSlide] = useState(0);
  const [ci, setCi] = useState(0);
  const s = SLIDES[slide];

  useEffect(() => {
    const t = setInterval(() => setSlide((x) => (x + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!s.colorRotate) return;
    const t = setInterval(() => setCi((x) => (x + 1) % SHIRT_COLORS.length), 1100);
    return () => clearInterval(t);
  }, [s.colorRotate]);

  const shirtColor = s.colorRotate ? SHIRT_COLORS[ci].hex : s.color;

  return (
    <div className="px-3 sm:px-6 lg:px-8 pt-4 pb-2">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ backgroundColor: s.bg }}
      >
        {/* Content row */}
        <div className="flex items-center justify-between gap-2 px-5 sm:px-10 lg:px-14 py-7 sm:py-10 lg:py-14 min-h-[200px] sm:min-h-[300px] lg:min-h-[420px]">

          {/* Shirt — visual LEFT (end in RTL) */}
          <div className="shrink-0 relative w-[90px] sm:w-[160px] lg:w-[240px] h-[120px] sm:h-[210px] lg:h-[320px]">
            {/* Body */}
            <div
              className="absolute inset-x-[15%] top-[5%] bottom-[12%] rounded-t-[40%] rounded-b-md transition-colors duration-700"
              style={{ backgroundColor: shirtColor }}
            />
            {/* Collar notch */}
            <div
              className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[25%] h-[10%] rounded-b-full transition-colors duration-700"
              style={{ backgroundColor: s.bg }}
            />
            {/* Left arm */}
            <div
              className="absolute top-[12%] -left-[8%] w-[22%] h-[45%] rounded-full transition-colors duration-700 -rotate-6"
              style={{ backgroundColor: shirtColor }}
            />
            {/* Right arm */}
            <div
              className="absolute top-[12%] -right-[8%] w-[22%] h-[45%] rounded-full transition-colors duration-700 rotate-6"
              style={{ backgroundColor: shirtColor }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="opacity-15 text-3xl sm:text-5xl">✦</span>
            </div>
          </div>

          {/* Text — visual RIGHT (start in RTL) */}
          <div className="flex-1 min-w-0 text-right space-y-2 sm:space-y-3 lg:space-y-4">
            <h2 className="font-bold leading-snug text-zinc-900 text-xl sm:text-3xl lg:text-5xl">
              {s.title}
              {s.line2 && <><br />{s.line2}</>}
            </h2>

            <p className="text-zinc-600 text-xs sm:text-sm lg:text-base">{s.sub}</p>

            {s.colorRotate ? (
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-zinc-500">{s.badge}</span>
                {SHIRT_COLORS.map((c, i) => (
                  <span
                    key={c.hex}
                    className="rounded-full border-2 transition-all duration-300 inline-block"
                    style={{
                      width:  i === ci ? 16 : 12,
                      height: i === ci ? 16 : 12,
                      backgroundColor: c.hex,
                      borderColor: i === ci ? "#555" : "transparent",
                      boxShadow: i === ci ? "0 0 0 2px #55555530" : "none",
                    }}
                  />
                ))}
              </div>
            ) : (
              <span className="inline-block text-[10px] sm:text-xs bg-white/60 px-2.5 py-0.5 rounded-full text-zinc-600">
                {s.badge}
              </span>
            )}

            <div>
              <Link
                href={s.href}
                className="inline-flex items-center bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors text-xs sm:text-sm lg:text-base px-4 sm:px-6 py-2 sm:py-2.5 lg:py-3"
              >
                {s.cta}
              </Link>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === slide ? "w-4 h-1.5 bg-zinc-900" : "w-1.5 h-1.5 bg-zinc-400"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
