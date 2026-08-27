"use client";

import { useState } from "react";
import { StoryViewer, type ViewerStory } from "./story-viewer";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";

const INSTAGRAM_HANDLE = "elina.clothes_";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
const INSTAGRAM_GRADIENT =
  "bg-[conic-gradient(from_215deg_at_50%_50%,#feda75_0%,#fa7e1e_25%,#d62976_50%,#962fbf_75%,#4f5bd5_100%)]";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
    </svg>
  );
}

interface Props {
  stories: Story[];
}

export function StoriesBar({ stories }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const uploaded: ViewerStory[] = stories
    .filter((s) => s.imageUrl)
    .map((s) => ({
      kind: "image",
      id: s.id,
      title: s.title,
      linkUrl: s.linkUrl,
      imageUrl: s.imageUrl!,
    }));

  const instagramStory: ViewerStory = {
    kind: "instagram",
    id: "__instagram__",
    title: INSTAGRAM_HANDLE,
    linkUrl: INSTAGRAM_URL,
  };

  const items: ViewerStory[] = [instagramStory, ...uploaded];

  return (
    <>
      <section
        aria-label="استوری‌ها"
        className="mx-auto w-full max-w-[1440px] px-3 pt-3 sm:px-6 lg:px-10"
      >
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {items.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="group flex snap-start flex-col items-center gap-1.5 focus:outline-none"
              aria-label={`باز کردن استوری ${story.title}`}
            >
              <span
                className={cn(
                  "flex h-[72px] w-[72px] items-center justify-center rounded-full p-[2.5px] transition-transform group-active:scale-95 sm:h-20 sm:w-20",
                  story.kind === "instagram"
                    ? INSTAGRAM_GRADIENT
                    : "bg-[conic-gradient(from_180deg,#f7c8b2,#e3b3d4,#c5b0e8,#f7c8b2)]",
                )}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-white p-[2px]">
                  {story.kind === "instagram" ? (
                    <span
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded-full",
                        INSTAGRAM_GRADIENT,
                      )}
                    >
                      <InstagramGlyph className="h-8 w-8 sm:h-9 sm:w-9" />
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.imageUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </span>
              </span>
              <span className="max-w-[76px] truncate text-[11px] font-medium text-[#3f4064] sm:max-w-[84px]">
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {openIndex !== null && (
        <StoryViewer
          stories={items}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
