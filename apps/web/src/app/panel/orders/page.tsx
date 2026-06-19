"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { useAdminOrders } from "@/hooks/use-orders";
import { ORDER_STATUS_CONFIG } from "@/lib/order-status";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "pending_payment", label: "در انتظار پرداخت" },
  { value: "payment_uploaded", label: "رسید آپلود شده" },
  { value: "confirmed", label: "تأیید شده" },
  { value: "cancelled", label: "لغو شده" },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  const { data, isLoading } = useAdminOrders(
    page,
    activeTab === "all" ? undefined : activeTab
  );

  function handleTabChange(tab: OrderStatus | "all") {
    setActiveTab(tab);
    setPage(1);
  }

  const columns: Column<Order>[] = [
    {
      key: "id",
      header: "شناسه",
      className: "w-28",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
          #{row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "customer",
      header: "مشتری",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          {row.user?.phone && (
            <p className="text-xs text-muted-foreground font-mono" dir="ltr">
              {row.user.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "items",
      header: "اقلام",
      className: "hidden sm:table-cell w-20 text-center",
      cell: (row) => (
        <span className="text-muted-foreground">{row.items.length} قلم</span>
      ),
    },
    {
      key: "totalAmount",
      header: "مبلغ کل",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="font-medium">{formatPrice(row.totalAmount)} ریال</span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (row) => {
        const cfg = ORDER_STATUS_CONFIG[row.status];
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
              cfg.className
            )}
          >
            {row.status === "payment_uploaded" && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "تاریخ",
      className: "hidden lg:table-cell",
      cell: (row) => (
        <span className="text-muted-foreground text-sm">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <Link
          href={`/panel/orders/${row.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">سفارشات</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            مجموع {data?.total ?? 0} سفارش
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value === "payment_uploaded" && (
              <span className="ms-1.5 inline-flex w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        pagination={
          data ? { page, totalPages: data.totalPages, onPageChange: setPage } : undefined
        }
        emptyMessage="سفارشی یافت نشد"
      />
    </div>
  );
}
