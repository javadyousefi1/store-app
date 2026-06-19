"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronLeft, Eye } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserOrders } from "@/hooks/use-user-orders";
import { ORDER_STATUS_CONFIG } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function UserOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserOrders(page);

  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders.length && page === 1) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-lg font-medium">هنوز سفارشی ثبت نشده</p>
        <Link href="/products">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            شروع خرید
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold">سفارشات من</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {data?.total.toLocaleString("fa-IR")} سفارش
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const cfg = ORDER_STATUS_CONFIG[order.status];
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm hover:border-primary/20 transition-all group"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                      cfg.className
                    )}
                  >
                    {order.status === "payment_uploaded" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="font-semibold">{formatPrice(order.totalAmount)} ریال</span>
                  <span className="text-muted-foreground">{order.items.length} قلم</span>
                  <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            قبلی
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page.toLocaleString("fa-IR")} از {data?.totalPages.toLocaleString("fa-IR")}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data?.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
