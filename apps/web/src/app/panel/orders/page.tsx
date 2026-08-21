"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Eye, Landmark, Search, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/data-table";
import { useAdminOrders } from "@/hooks/use-orders";
import {
  ORDER_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, PAYMENT_STATUS_CONFIG,
} from "@/lib/order-status";
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

  // Debounced search — keystrokes don't fire a request per character.
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  // Any search change should reset to page 1 or the shopper sees "no results"
  // on a valid query just because the previous filter was on page 4.
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useAdminOrders(
    page,
    activeTab === "all" ? undefined : activeTab,
    debouncedSearch || undefined,
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
          #{row.orderNumber}
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
      key: "payment",
      header: "پرداخت",
      className: "hidden md:table-cell",
      cell: (row) => {
        const methodCfg = PAYMENT_METHOD_CONFIG[row.payment.method];
        const payCfg = PAYMENT_STATUS_CONFIG[row.payment.status];
        const isOnline = row.payment.method === "online_gateway";
        return (
          <div className="space-y-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                methodCfg.className,
              )}
            >
              {isOnline ? <CreditCard className="h-3 w-3" /> : <Landmark className="h-3 w-3" />}
              {methodCfg.short}
            </span>
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                  payCfg.className,
                )}
              >
                {row.payment.status === "initiated" && (
                  <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                )}
                {payCfg.label}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "وضعیت سفارش",
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">سفارشات</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debouncedSearch
              ? `${data?.total ?? 0} نتیجه برای «${debouncedSearch}»`
              : `مجموع ${data?.total ?? 0} سفارش`}
          </p>
        </div>

        {/* Search: order number / customer name / phone */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="جستجو: شماره سفارش، نام، شماره تماس"
            className="h-10 pr-9 pl-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="پاک کردن جستجو"
              className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
