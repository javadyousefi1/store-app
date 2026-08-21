import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order } from "@/types";

/**
 * Row card for the orders list. Entire card is clickable — no separate
 * chevron / action icon per design spec.
 */
export function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.length;

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="gap-0 p-4 transition-colors hover:border-primary/40 hover:bg-accent/30">
        {/* Row 1: order number (matches SMS) + status */}
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            #{order.orderNumber}
          </span>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>

        {/* Row 2: date + item count | total (amount separated on the end) */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
            <p>{formatDate(order.createdAt)}</p>
            <p>{itemCount.toLocaleString("fa-IR")} قلم کالا</p>
          </div>
          <p className="shrink-0 text-base font-bold tabular-nums text-foreground">
            {formatPrice(order.totalAmount)}
            <span className="ms-1 text-xs font-normal text-muted-foreground">تومان</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}
