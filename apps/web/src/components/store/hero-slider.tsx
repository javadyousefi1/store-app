"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    type: "video",
    src: "/elina/hero-video.mp4",
    mobilePoster: "/elina/hero-video-poster.webp",
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
  eager = false,
  videoEnabled = true,
}: {
  slide: Slide;
  viewport: HeroViewport;
  eager?: boolean;
  videoEnabled?: boolean;
}) {
  if (slide.type === "video") {
    const poster =
      viewport === "mobile" ? slide.mobilePoster : slide.desktopPoster;

    return (
      <div className="relative h-full w-full">
        <Image
          src={poster}
          alt={slide.label}
          fill
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          sizes="100vw"
          className="object-cover object-center"
        />
        {videoEnabled && (
          <video
            className="absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          >
            <source src={slide.src} type="video/mp4" />
          </video>
        )}
      </div>
    );
  }

  const imageSrc = viewport === "mobile" ? slide.mobileSrc : slide.desktopSrc;

  return (
    <Image
      src={imageSrc}
      alt={slide.label}
      fill
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      sizes="100vw"
      className="object-cover object-center"
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
    <div className="flex items-center justify-center" dir="ltr">
      {slides.map((slide, index) => (
        <button
          key={slide.label}
          type="button"
          onClick={() => onSelect(index)}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          aria-label={`نمایش اسلاید ${index + 1}`}
          aria-current={index === active ? "true" : undefined}
        >
          <span
            className={cn(
              "h-2.5 rounded-full transition-all duration-300 ease-out",
              index === active ? "w-8 bg-brand-600" : "w-2.5 bg-[#cbc6d1]",
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
  const [position, setPosition] = useState(2);
  const [videoAllowed, setVideoAllowed] = useState(false);

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
      scrollToPosition(2, false),
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

  useEffect(() => {
    const timer = window.setTimeout(() => setVideoAllowed(true), 12_000);
    return () => window.clearTimeout(timer);
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
            className="relative aspect-[9/5] w-[calc(100%-4rem)] shrink-0 snap-center overflow-hidden rounded-xl bg-white shadow-[0_5px_18px_rgba(42,29,75,0.1)]"
          >
            <SlideMedia
              slide={slide}
              viewport="mobile"
              eager={index === 2}
              videoEnabled={
                videoAllowed && slide.type === "video" && index === position
              }
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 hidden -translate-x-1/2 rounded-full bg-white/90 px-4 py-2.5 shadow-[0_6px_18px_rgba(44,33,59,0.14)] backdrop-blur-sm md:flex">
        <SliderPagination
          active={activeSlide}
          onSelect={(index) => {
            const nextPosition = index + 1;
            if (index === 0) setVideoAllowed(true);
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
  const [videoAllowed, setVideoAllowed] = useState(false);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
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
    }, 15_000);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
      window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setVideoAllowed(true), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  const goTo = (index: number) => {
    if ((index + slides.length) % slides.length === 0) {
      setVideoAllowed(true);
    }
    turnTo(index);
  };

  return (
    <section
      className="relative hidden w-full bg-white lg:block"
      aria-label="پیشنهادهای ویژه"
    >
      <div className="relative aspect-[12/5] w-full overflow-hidden bg-white">
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
              eager={false}
              videoEnabled={
                videoAllowed && slide.type === "video" && index === active
              }
            />
          </div>
        ))}

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

        <div className="absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 rounded-full bg-white/95 px-4 py-3 shadow-[0_6px_18px_rgba(44,33,59,0.14)] backdrop-blur-sm lg:block">
          <SliderPagination active={active} onSelect={goTo} />
        </div>
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
