import { cn } from "@/lib/utils";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

interface Props {
  attributes: Record<string, string> | null | undefined;
  /**
   * Optional lookup that translates a raw attribute value (usually a hex
   * color) to a human-readable label. Live views (cart, product page) pass
   * this from useAttributeOptions; snapshot views (order history) don't
   * have it — the raw value is shown.
   */
  valueLabels?: Record<string, string>;
  /** Compact = smaller pills for cart/summary rows. */
  size?: "sm" | "md";
  /** Layout hint — plain pills or inline chip strip. */
  variant?: "chip" | "row";
  className?: string;
}

/**
 * Displays a set of variant attributes (color, size, etc). When a value is a
 * hex code we render a color swatch next to it — critical for shoppers to
 * confirm the exact color they ordered.
 *
 * Snapshot data on order pages stores the hex code directly (no live label
 * lookup), so we always fall back to showing the raw value when no label
 * is provided.
 */
export function VariantAttributes({
  attributes,
  valueLabels,
  size = "md",
  variant = "chip",
  className,
}: Props) {
  if (!attributes || Object.keys(attributes).length === 0) return null;

  const entries = Object.entries(attributes);
  const chipClass =
    size === "sm"
      ? "gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]"
      : "gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs";
  const swatchClass =
    size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      className={cn(
        variant === "row"
          ? "flex flex-wrap items-center gap-x-3 gap-y-1"
          : "flex flex-wrap items-center gap-1.5",
        className,
      )}
    >
      {entries.map(([key, value]) => {
        const isColor = HEX_COLOR.test(value);
        const label = valueLabels?.[value] ?? value;

        // "row" variant: no pill border, just inline key:value with swatch.
        if (variant === "row") {
          return (
            <span
              key={key}
              className={cn(
                "inline-flex items-center gap-1.5",
                size === "sm" ? "text-[11px]" : "text-xs",
              )}
            >
              <span className="text-muted-foreground">{key}:</span>
              {isColor && (
                <span
                  className={cn(
                    "inline-block shrink-0 rounded-full border border-border/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
                    swatchClass,
                  )}
                  style={{ backgroundColor: value }}
                  title={label}
                  aria-label={label}
                />
              )}
              <span className="font-medium text-foreground">
                {isColor && label === value ? "" : label}
              </span>
            </span>
          );
        }

        // "chip" variant: pill with border.
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center text-muted-foreground",
              chipClass,
            )}
          >
            <span>{key}:</span>
            {isColor && (
              <span
                className={cn(
                  "inline-block shrink-0 rounded-full border border-border/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
                  swatchClass,
                )}
                style={{ backgroundColor: value }}
                title={label}
                aria-label={label}
              />
            )}
            <span className="font-medium text-foreground">
              {isColor && label === value ? "" : label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
