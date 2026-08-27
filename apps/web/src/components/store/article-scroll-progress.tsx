"use client";

import { useEffect, useState } from "react";

export function ArticleScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(
      "[data-store-sticky-header]",
    );
    const target = document.querySelector<HTMLElement>("article");

    const update = () => {
      if (header) {
        setTop(Math.max(0, header.getBoundingClientRect().bottom));
      }

      if (!target) {
        setProgress(0);
        return;
      }
      const rect = target.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height - viewportH;
      const scrolled = -rect.top;
      const p =
        total > 0
          ? Math.min(100, Math.max(0, (scrolled / total) * 100))
          : rect.top <= 0
            ? 100
            : 0;
      setProgress(p);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let ro: ResizeObserver | undefined;
    if (header && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(header);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-40 h-[3px] bg-transparent"
      style={{ top: `${top}px` }}
    >
      <div
        className="h-full origin-right bg-primary transition-transform duration-75 ease-out"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
