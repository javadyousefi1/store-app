"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

interface Props {
  variantImageUrls: string[];
  coverUrl: string | null;
}

export function ImageGallery({ variantImageUrls, coverUrl }: Props) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setActive(variantImageUrls[0] ?? coverUrl ?? null);
  }, [variantImageUrls, coverUrl]);

  const thumbs = variantImageUrls.length > 0 ? variantImageUrls : coverUrl ? [coverUrl] : [];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl border bg-muted/30 overflow-hidden">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {thumbs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {thumbs.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(url)}
              className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden transition-all ${
                active === url
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/30 opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
