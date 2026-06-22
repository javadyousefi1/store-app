"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    type: "video",
    src: "/elina/hero-video.mp4",
    mobilePoster: "/elina/hero-blue-mobile.webp",
    desktopPoster: "/elina/hero-blue-desktop.webp",
    label: "کالکشن تازه الینا",
  },
  {
    type: "image",
    mobileSrc: "/elina/hero-blue-mobile.webp",
    desktopSrc: "/elina/hero-blue-desktop.webp",
    label: "تی‌شرت سالیوان",
  },
  {
    type: "image",
    mobileSrc: "/elina/hero-linen-mobile.webp",
    desktopSrc: "/elina/hero-linen-desktop.webp",
    label: "ست وست لینن",
  },
] as const;

type Slide = (typeof slides)[number];
type HeroViewport = "mobile" | "desktop";

function SlideMedia({
  slide,
  viewport,
  priority = false,
  videoEnabled = true,
  videoMedia,
}: {
  slide: Slide;
  viewport: HeroViewport;
  priority?: boolean;
  videoEnabled?: boolean;
  videoMedia?: string;
}) {
  if (slide.type === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        poster={
          viewport === "mobile" ? slide.mobilePoster : slide.desktopPoster
        }
        autoPlay={videoEnabled}
        muted
        loop
        playsInline
        preload={videoEnabled ? "auto" : "none"}
        aria-label={slide.label}
      >
        {videoEnabled && <source src={slide.src} media={videoMedia} />}
      </video>
    );
  }

  const imageSrc = viewport === "mobile" ? slide.mobileSrc : slide.desktopSrc;

  return (
    <Image
      src={imageSrc}
      alt={slide.label}
      fill
      priority={priority}
      sizes="100vw"
      className="object-cover"
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
    <div className="flex items-center justify-center gap-2.5" dir="ltr">
      {slides.map((slide, index) => (
        <button
          key={slide.label}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "h-2.5 rounded-full transition-all duration-300 ease-out",
            index === active
              ? "w-11 bg-brand-600"
              : "w-2.5 bg-[#dedbe3] hover:bg-[#cbc6d1]",
          )}
          aria-label={`نمایش اسلاید ${index + 1}`}
          aria-current={index === active ? "true" : undefined}
        />
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
    const timer = window.setInterval(() => {
      setPosition((current) => {
        const next = current + 1;
        scrollToPosition(next);
        return next;
      });
    }, 6000);

    return () => window.clearInterval(timer);
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
      className="relative w-full bg-white pt-3 md:py-3 lg:hidden"
      aria-label="پیشنهادهای ویژه"
    >
      <div
        ref={scrollerRef}
        onScroll={settleScroll}
        dir="ltr"
        className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {mobileSlides.map((slide, index) => (
          <div
            key={`${slide.label}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="relative aspect-[1.8/1] w-[calc(100%-4rem)] shrink-0 snap-center overflow-hidden rounded-xl bg-white shadow-[0_5px_18px_rgba(42,29,75,0.1)]"
          >
            <SlideMedia
              slide={slide}
              viewport="mobile"
              priority={index === 1}
              videoMedia="(max-width: 1023px)"
            />
          </div>
        ))}
      </div>

      <div className="hidden h-11 items-end justify-center md:flex">
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
  const [active, setActive] = useState(1);
  const [previous, setPrevious] = useState<number | null>(null);
  const turnTimerRef = useRef<number | undefined>(undefined);

  const turnTo = (index: number) => {
    const next = (index + slides.length) % slides.length;

    setActive((current) => {
      if (current === next) return current;

      window.clearTimeout(turnTimerRef.current);
      setPrevious(current);
      turnTimerRef.current = window.setTimeout(() => {
        setPrevious(null);
      }, 180);

      return next;
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % slides.length;

        window.clearTimeout(turnTimerRef.current);
        setPrevious(current);
        turnTimerRef.current = window.setTimeout(() => {
          setPrevious(null);
        }, 180);

        return next;
      });
    }, 6000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  const goTo = (index: number) => {
    turnTo(index);
  };

  return (
    <section
      className="relative hidden w-full bg-white lg:block"
      aria-label="پیشنهادهای ویژه"
    >
      <div className="relative h-[clamp(320px,30vw,430px)] w-full overflow-hidden 2xl:aspect-[2.4/1] 2xl:h-auto">
        {slides.map((slide, index) => (
          <div
            key={slide.label}
            className={cn(
              "absolute inset-0",
              index === active
                ? "hero-page-turn z-10"
                : index === previous
                  ? "z-0"
                  : "pointer-events-none hidden",
            )}
            aria-hidden={index !== active}
          >
            <SlideMedia
              slide={slide}
              viewport="desktop"
              priority={index === 1}
              videoEnabled={slide.type !== "video" || index === active}
              videoMedia="(min-width: 1024px)"
            />
          </div>
        ))}

        <div
          className="absolute bottom-5 right-6 z-30 hidden items-center gap-3 lg:flex 2xl:hidden"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dfe8] bg-white/95 text-[#554a60] shadow-[0_6px_18px_rgba(44,33,59,0.16)] backdrop-blur-sm transition-colors hover:bg-brand-50 hover:text-primary"
            aria-label="اسلاید قبلی"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dfe8] bg-white/95 text-[#554a60] shadow-[0_6px_18px_rgba(44,33,59,0.16)] backdrop-blur-sm transition-colors hover:bg-brand-50 hover:text-primary"
            aria-label="اسلاید بعدی"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 rounded-full bg-white/95 px-4 py-3 shadow-[0_6px_18px_rgba(44,33,59,0.14)] backdrop-blur-sm lg:block 2xl:hidden">
          <SliderPagination active={active} onSelect={goTo} />
        </div>
      </div>

      <div className="relative z-20 hidden h-14 items-center justify-center border-t border-[#f0edf2] bg-white 2xl:flex">
        <SliderPagination active={active} onSelect={goTo} />
      </div>
    </section>
  );
}

export function HeroSlider() {
  return (
    <div data-home-hero className="sticky top-0 z-0 bg-white max-md:top-[60px]">
      <MobileHeroCarousel />
      <DesktopHeroSlider />
    </div>
  );
}
