"use client";

import { useEffect, useState, type ReactNode } from "react";

export function HomeHeroScrollArea({
  hero,
  categories,
}: {
  hero: ReactNode;
  categories: ReactNode;
}) {
  const [mobileStickyTop, setMobileStickyTop] = useState(60);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const measureStickyTop = () => {
      if (desktopQuery.matches) return;

      const stickyHeader = document.querySelector<HTMLElement>(
        "[data-store-sticky-header]",
      );
      if (stickyHeader) {
        setMobileStickyTop(stickyHeader.offsetHeight);
      }
    };

    measureStickyTop();
    window.addEventListener("resize", measureStickyTop, { passive: true });
    desktopQuery.addEventListener("change", measureStickyTop);

    const stickyHeader = document.querySelector<HTMLElement>(
      "[data-store-sticky-header]",
    );
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureStickyTop)
        : null;

    if (stickyHeader && resizeObserver) {
      resizeObserver.observe(stickyHeader);
    }

    return () => {
      window.removeEventListener("resize", measureStickyTop);
      desktopQuery.removeEventListener("change", measureStickyTop);
      resizeObserver?.disconnect();
    };
  }, []);

  const cssVars = {
    "--home-mobile-sticky-top": `${mobileStickyTop}px`,
  } as Record<string, string>;

  return (
    <div className="relative overflow-visible">
      <div
        data-home-hero-pin
        className="relative z-0 max-md:sticky max-md:top-[var(--home-mobile-sticky-top,60px)] md:static"
        style={cssVars}
      >
        {hero}
      </div>

      <div data-home-hero-end className="pointer-events-none h-px" />

      <div
        data-home-categories-shell
        className="relative z-10 bg-white"
      >
        {categories}
      </div>
    </div>
  );
}
