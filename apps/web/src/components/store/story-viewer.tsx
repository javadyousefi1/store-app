"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

const INSTAGRAM_HANDLE = "elina.clothes_";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
const INSTAGRAM_GRADIENT =
  "bg-[conic-gradient(from_215deg_at_50%_50%,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)]";
const STORY_DURATION_MS = 5000;

export type ViewerStory =
  | {
      kind: "image";
      id: string;
      title: string;
      linkUrl: string | null;
      imageUrl: string;
    }
  | {
      kind: "instagram";
      id: string;
      title: string;
      linkUrl: string;
    };

interface Props {
  stories: ViewerStory[];
  startIndex: number;
  onClose: () => void;
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
    </svg>
  );
}

export function StoryViewer({ stories, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  const current = stories[index];

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= stories.length) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // reset progress on story change
  useEffect(() => {
    setProgress(0);
    accumulatedRef.current = 0;
    startedAtRef.current = performance.now();
  }, [index]);

  // Progress timer via rAF — pauses cleanly, resumes without jumping.
  useEffect(() => {
    if (paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      accumulatedRef.current += performance.now() - startedAtRef.current;
      return;
    }

    startedAtRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = accumulatedRef.current + (now - startedAtRef.current);
      const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, goNext, index]);

  // keyboard nav + esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goNext(); // RTL: left = next
      else if (e.key === "ArrowRight") goPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  const isInstagram = current.kind === "instagram";
  const handle = isInstagram ? INSTAGRAM_HANDLE : "elina.clothes_";
  const primaryLink = isInstagram
    ? INSTAGRAM_URL
    : current.linkUrl || undefined;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="نمایش استوری"
    >
      {/* Prev tap zone (right in RTL — visually previous) */}
      <button
        type="button"
        aria-label="استوری قبل"
        onClick={goPrev}
        className="absolute inset-y-0 right-0 z-10 w-1/3 focus:outline-none"
      />
      {/* Next tap zone */}
      <button
        type="button"
        aria-label="استوری بعد"
        onClick={goNext}
        className="absolute inset-y-0 left-0 z-10 w-1/3 focus:outline-none"
      />

      {/* Desktop arrows */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="قبلی"
        className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 lg:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="بعدی"
        className="absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 lg:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        className="relative flex h-full max-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-black lg:my-6 lg:h-[92vh] lg:rounded-2xl"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex gap-1 p-2 pt-3">
          {stories.map((_, i) => (
            <div
              key={i}
              className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className="h-full bg-white transition-[width]"
                style={{
                  width:
                    i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-6 z-30 flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full p-[1.5px]",
                INSTAGRAM_GRADIENT,
              )}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
                <InstagramGlyph className="h-4 w-4" />
              </span>
            </span>
            <span className="text-sm font-semibold text-white" dir="ltr">
              {handle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="rounded-full p-1.5 text-white transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 items-center justify-center">
          {isInstagram ? (
            <div
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-6 px-8 text-center text-white",
                INSTAGRAM_GRADIENT,
              )}
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md">
                <InstagramGlyph className="h-14 w-14" />
              </span>
              <div className="space-y-2">
                <p className="text-xl font-bold" dir="ltr">
                  @{INSTAGRAM_HANDLE}
                </p>
                <p className="text-sm leading-6 text-white/90">
                  ما رو در اینستاگرام دنبال کنید تا از جدیدترین کالکشن‌ها،
                  تخفیف‌ها و پشت صحنه‌های تولید مطلع بشید.
                </p>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.imageUrl}
              alt={current.title}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          )}
        </div>

        {/* Footer CTA */}
        {primaryLink && (
          <a
            href={primaryLink}
            target={isInstagram ? "_blank" : undefined}
            rel={isInstagram ? "noreferrer" : undefined}
            onClick={onClose}
            className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10 text-sm font-medium text-white"
          >
            {isInstagram ? "مشاهده پروفایل اینستاگرام" : current.title}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
