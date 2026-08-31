"use client";

import { type ReactNode } from "react";

export function HomeHeroScrollArea({
  hero,
  categories = null,
}: {
  hero: ReactNode;
  categories?: ReactNode;
}) {
  return (
    <div className="relative">
      {hero}
      {categories}
    </div>
  );
}
