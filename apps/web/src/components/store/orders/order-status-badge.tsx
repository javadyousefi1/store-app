import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CONFIG } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/**
 * Semantic status pill used everywhere an order status is shown (list card,
 * detail header). Single source of truth for label + color per status —
 * change the palette in `order-status.ts`, not in components.
 */
export function OrderStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: OrderStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const cfg = ORDER_STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border font-medium",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        cfg.className,
        className,
      )}
    >
      {cfg.showPulse && (
        <span
          className={cn(
            "h-1.5 w-1.5 animate-pulse rounded-full",
            cfg.tone === "blue" && "bg-blue-500",
            cfg.tone === "amber" && "bg-amber-500",
            cfg.tone === "green" && "bg-green-500",
            cfg.tone === "red" && "bg-red-500",
          )}
        />
      )}
      {cfg.label}
    </Badge>
  );
}
