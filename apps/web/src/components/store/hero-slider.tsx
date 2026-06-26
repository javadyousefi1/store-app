"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    mobileSrc: "/elina/hero/hero-blue-mobile.webp",
    desktopSrc: "/elina/hero/hero-blue-desktop.webp",
    label: "تیشرت سالیوان — انرژی کارتونی برای استایل تابستونی",
  },
  {
    mobileSrc: "/elina/hero/hero-linen-mobile.webp",
    desktopSrc: "/elina/hero/hero-linen-desktop.webp",
    label: "ست وست لنین شلوار ایتالیایی — مناسب هر روز، مناسب هر جا",
  },
  {
    mobileSrc: "/elina/hero/hero-shomiz-mobile.webp",
    desktopSrc: "/elina/hero/hero-shomiz-desktop.webp",
    label: "شومیز مانتویی — ۴ رنگ برای انتخاب",
  },
] as const;

type Slide = (typeof slides)[number];
type HeroViewport = "mobile" | "desktop";
const blurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmMGY2Ii8+PC9zdmc+";

function SlideMedia({
  slide,
  viewport,
  eager = false,
}: {
  slide: Slide;
  viewport: HeroViewport;
  eager?: boolean;
}) {
  const imageSrc = viewport === "mobile" ? slide.mobileSrc : slide.desktopSrc;
  const imageClassName = cn(
    "h-full w-full",
    viewport === "mobile"
      ? "object-cover object-[center_58%]"
      : "object-cover object-center",
  );

  if (!imageSrc) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-[#f3f0f6]"
        aria-label={slide.label}
        role="img"
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={slide.label}
      fill
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      placeholder={viewport === "mobile" ? "blur" : "empty"}
      blurDataURL={viewport === "mobile" ? blurDataUrl : undefined}
      sizes="100vw"
      className={imageClassName}
    />
  );
}

const mobileSlides = [slides[slides.length - 1], ...slides, slides[0]];

function SliderPagination({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2" dir="ltr">
      {slides.map((slide, index) => (
        <button
          key={slide.label}
          type="button"
          onClick={() => onSelect(index)}
          className="flex h-5 w-5 items-center justify-center rounded-full"
          aria-label={`نمایش اسلاید ${index + 1}`}
          aria-current={index === active ? "true" : undefined}
        >
          <span
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out",
              index === active ? "w-6 bg-brand-600" : "w-2 bg-[#cbc6d1]",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function MobileHeroCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimerRef = useRef<number | undefined>(undefined);
  const [position, setPosition] = useState(1);

  const scrollToPosition = (nextPosition: number, smooth = true) => {
    const scroller = scrollerRef.current;
    const item = itemRefs.current[nextPosition];
    if (!scroller || !item) return;

    scroller.scrollTo({
      left: item.offsetLeft - (scroller.clientWidth - item.clientWidth) / 2,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      scrollToPosition(1, false),
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setPosition((current) => {
          const next = current + 1;
          scrollToPosition(next);
          return next;
        });
      }, 6000);
    }, 15_000);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const settleScroll = () => {
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const itemCenter = item.offsetLeft + item.clientWidth / 2;
        const distance = Math.abs(scrollerCenter - itemCenter);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });

      setPosition(nearest);

      if (nearest === 0) {
        setPosition(slides.length);
        scrollToPosition(slides.length, false);
      } else if (nearest === mobileSlides.length - 1) {
        setPosition(1);
        scrollToPosition(1, false);
      }
    }, 120);
  };

  useEffect(
    () => () => {
      window.clearTimeout(scrollTimerRef.current);
    },
    [],
  );

  const activeSlide = (position - 1 + slides.length) % slides.length;

  return (
    <section
      className="relative w-full bg-[#f8f6fb] pt-3 pb-2 md:py-3 lg:hidden"
      aria-label="پیشنهادهای ویژه"
    >
      <div
        ref={scrollerRef}
        onScroll={settleScroll}
        dir="ltr"
        className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto px-7 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {mobileSlides.map((slide, index) => (
          <div
            key={`${slide.label}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="relative aspect-[9/4.6] w-[calc(100%-4rem)] shrink-0 snap-center overflow-hidden rounded-xl bg-white shadow-[0_5px_18px_rgba(42,29,75,0.1)]"
          >
            <SlideMedia
              slide={slide}
              viewport="mobile"
              eager={index === 1}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 md:flex">
        <SliderPagination
          active={activeSlide}
          onSelect={(index) => {
            const nextPosition = index + 1;
            setPosition(nextPosition);
            scrollToPosition(nextPosition);
          }}
        />
      </div>
    </section>
  );
}

function DesktopHeroSlider() {
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstActive = useRef(true);

  useEffect(() => {
    if (isFirstActive.current) {
      isFirstActive.current = false;
      return;
    }

    setIsTransitioning(true);
    const timer = window.setTimeout(() => setIsTransitioning(false), 320);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setActive((current) => (current + 1) % slides.length);
      }, 6000);
    }, 15_000);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const goTo = (index: number) => {
    const next = (index + slides.length) % slides.length;
    if (next === active) return;
    setActive(next);
  };

  return (
    <section
      className="relative hidden w-full bg-white lg:block"
      aria-label="پیشنهادهای ویژه"
    >
      <div className="relative h-[clamp(360px,38vw,500px)] w-full overflow-hidden bg-white">
        <div
          dir="ltr"
          className={cn(
            "flex h-full w-full transition-transform duration-[320ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none",
            isTransitioning && "will-change-transform",
          )}
          style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.label}
              className="relative h-full w-full shrink-0"
              aria-hidden={index !== active}
            >
              <SlideMedia
                slide={slide}
                viewport="desktop"
                eager={index === 0}
              />
            </div>
          ))}
        </div>

        <div
          className="absolute bottom-5 right-6 z-30 hidden items-center gap-3 lg:flex"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4dfe8] bg-white/95 text-[#554a60] shadow-[0_6px_18px_rgba(44,33,59,0.16)] backdrop-blur-sm transition-colors hover:bg-brand-50 hover:text-primary"
            aria-label="اسلاید قبلی"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4dfe8] bg-white/95 text-[#554a60] shadow-[0_6px_18px_rgba(44,33,59,0.16)] backdrop-blur-sm transition-colors hover:bg-brand-50 hover:text-primary"
            aria-label="اسلاید بعدی"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 lg:block">
          <SliderPagination active={active} onSelect={goTo} />
        </div>
      </div>
    </section>
  );
}

export function HeroSlider() {
  return (
    <div data-home-hero className="relative z-0 bg-[#f8f6fb] lg:bg-white">
      <MobileHeroCarousel />
      <DesktopHeroSlider />
    </div>
  );
}
