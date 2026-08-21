"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageSearch, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserOrders } from "@/hooks/use-user-orders";
import { OrderCard } from "@/components/store/orders/order-card";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

type Tab = "all" | OrderStatus;

const TABS: { value: Tab; label: string }[] = [
  { value: "all",              label: "همه" },
  { value: "pending_payment",  label: "در انتظار پرداخت" },
  { value: "payment_uploaded", label: "در حال بررسی" },
  { value: "confirmed",        label: "تأیید شده" },
  { value: "cancelled",        label: "لغو شده" },
];

export default function UserOrdersPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("all");
  const { data, isLoading } = useUserOrders(page);

  const allOrders = data?.data ?? [];
  const filtered = useMemo(
    () => (tab === "all" ? allOrders : allOrders.filter((o) => o.status === tab)),
    [allOrders, tab],
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-5 pb-8 sm:px-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl font-bold">سفارشات من</h1>
        <p className="text-xs text-muted-foreground">
          {data ? `${data.total.toLocaleString("fa-IR")} سفارش` : " "}
        </p>
      </header>

      {/* Status tabs */}
      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasOrders={allOrders.length > 0} tab={tab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 1) > 1 && filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            قبلی
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
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

/* ─────────────────────────── Empty state ─────────────────────────── */

function EmptyState({ hasOrders, tab }: { hasOrders: boolean; tab: Tab }) {
  // Two flavors: no orders at all vs no orders matching the active filter.
  if (!hasOrders) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </span>
          <div className="space-y-1">
            <p className="text-base font-semibold">هنوز سفارشی ثبت نکرده‌اید</p>
            <p className="text-sm text-muted-foreground">
              با اولین خرید خود، تاریخچه‌ی سفارش‌ها اینجا نمایش داده می‌شود.
            </p>
          </div>
          <Link href="/products">
            <Button className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              مشاهده فروشگاه
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">در این وضعیت سفارشی ندارید</p>
        <p className="text-xs text-muted-foreground">
          فیلتر «{TABS.find((t) => t.value === tab)?.label}» فعال است.
        </p>
      </CardContent>
    </Card>
  );
}
