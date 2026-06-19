"use client";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types";

const ATTR_LABELS: Record<string, string> = {
  color: "رنگ",
  رنگ: "رنگ",
  storage: "حافظه",
  size: "سایز",
  سایز: "سایز",
};

function attrLabel(key: string) {
  return ATTR_LABELS[key] ?? key;
}

function available(v: ProductVariant & { reserved?: number }) {
  return (v.stock ?? 0) - ((v as { reserved?: number }).reserved ?? 0);
}

interface Props {
  variants: (ProductVariant & { reserved?: number })[];
  selected: Record<string, string>;
  onChange: (key: string, val: string) => void;
  valueLabels?: Record<string, string>;
}

export function VariantSelector({ variants, selected, onChange, valueLabels = {} }: Props) {
  if (!variants.length) return null;

  // Extract all unique attribute keys and their values
  const attrKeys = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes)))
  );

  const uniqueValues = (key: string) =>
    Array.from(new Set(variants.map((v) => v.attributes[key]).filter(Boolean)));

  // For a given key+value, check if there's a variant with stock given current other selections
  function isAvailable(key: string, val: string): boolean {
    const partialSel = { ...selected, [key]: val };
    const otherKeys = attrKeys.filter((k) => k !== key && selected[k]);
    return variants.some(
      (v) =>
        v.attributes[key] === val &&
        otherKeys.every((k) => v.attributes[k] === selected[k]) &&
        available(v) > 0
    );
  }

  return (
    <div className="space-y-4">
      {attrKeys.map((key) => (
        <div key={key} className="space-y-2">
          <p className="text-sm font-medium">{attrLabel(key)}</p>
          <div className="flex flex-wrap gap-2">
            {uniqueValues(key).map((val) => {
              const inStock = isAvailable(key, val);
              const isSelected = selected[key] === val;

              // Check if it's a hex color
              const isColor = /^#[0-9A-Fa-f]{6}$/.test(val);

              return (
                <button
                  key={val}
                  onClick={() => onChange(key, val)}
                  title={valueLabels[val] ?? val}
                  className={cn(
                    "relative transition-all border rounded-lg text-sm font-medium",
                    isColor ? "w-9 h-9 p-0.5" : "px-3 py-1.5 min-w-[2.5rem]",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : inStock
                      ? "border-border hover:border-primary/50"
                      : "border-border opacity-50"
                  )}
                >
                  {isColor ? (
                    <>
                      <span
                        className="block w-full h-full rounded-md"
                        style={{ backgroundColor: val }}
                      />
                      {!inStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block w-[130%] h-px bg-muted-foreground/50 rotate-45" />
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={!inStock ? "line-through text-muted-foreground" : ""}>
                      {val}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
