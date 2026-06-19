"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Clock,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import type {
  DashboardData,
  OrdersByStatus,
  RecentOrder,
  LowStockVariant,
  TopProduct,
  RevenueChartItem,
  NewUsersChartItem,
} from "@/types";
import { ORDER_STATUS_CONFIG } from "@/lib/order-status";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " م";
  if (n >= 1_000) return Math.round(n / 1_000) + " ه";
  return n.toLocaleString("fa-IR");
}

function fmtMoneyFull(n: number): string {
  return n.toLocaleString("fa-IR") + " تومان";
}

function fmtAxisDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fa-IR");
}

function isHexColor(val: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e",
  pending_payment: "#f59e0b",
  payment_uploaded: "#3b82f6",
  cancelled: "#9ca3af",
};

const TOOLTIP_STYLE = "rounded-lg border bg-background p-3 text-xs shadow-md space-y-1.5 min-w-[150px]";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36 mb-1.5" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  sublabel?: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, sublabel, value, icon: Icon, iconBg, iconColor }: KpiCardProps) {
  return (
    <Card>
      <CardContent >
        <div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground leading-tight">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground/60">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Revenue Area Chart ───────────────────────────────────────────────────────

function RevenueChart({ data }: { data: RevenueChartItem[] }) {
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            درآمد روزانه
          </CardTitle>
          <div className="text-left">
            <p className="text-base font-bold leading-none tabular-nums">
              {totalOrders.toLocaleString("fa-IR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">سفارش / ۳۰ روز</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-3 pt-0 pb-4">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtAxisDate}
                interval={4}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => fmtMoney(v)}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as RevenueChartItem;
                  return (
                    <div className={TOOLTIP_STYLE}>
                      <p className="font-medium">{fmtAxisDate(label as string)}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">درآمد</span>
                        <span className="font-semibold text-indigo-600">
                          {fmtMoneyFull(item.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">سفارش</span>
                        <span className="font-semibold">{item.orders} عدد</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Orders Donut ─────────────────────────────────────────────────────────────

function OrdersDonut({ data }: { data: OrdersByStatus[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieChartIcon className="h-4 w-4 text-amber-500" />
          وضعیت سفارش‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-4 pt-0 pb-5">
        {/* Donut with center label */}
        <div className="relative h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={80}
                dataKey="count"
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#d1d5db"} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as OrdersByStatus;
                  const cfg = ORDER_STATUS_CONFIG[d.status];
                  return (
                    <div className={TOOLTIP_STYLE}>
                      <p className="font-medium">{cfg?.label ?? d.status}</p>
                      <p className="text-muted-foreground">{d.count} سفارش</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none tabular-nums">
              {total.toLocaleString("fa-IR")}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">کل سفارش</span>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-4 space-y-2">
          {data.map((item) => {
            const cfg = ORDER_STATUS_CONFIG[item.status];
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status] ?? "#d1d5db" }}
                  />
                  <span className="text-muted-foreground">{cfg?.label ?? item.status}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-muted-foreground/70">{pct}٪</span>
                  <span className="font-semibold w-6 text-right">{item.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top Products — CSS Progress Bars ────────────────────────────────────────

function TopProductsChart({ data }: { data: TopProduct[] }) {
  const top7 = data.slice(0, 7);
  const maxRevenue = Math.max(...top7.map((d) => d.revenue), 1);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart2 className="h-4 w-4 text-violet-500" />
          پرفروش‌ترین محصولات
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 space-y-4">
        {top7.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">داده‌ای موجود نیست</p>
        ) : (
          top7.map((item, i) => {
            const pct = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
            return (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1.5 gap-3">
                  <span className="text-sm font-medium leading-none truncate flex-1">
                    {item.productName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {fmtMoney(item.revenue)} · {item.unitsSold} فروش
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: "#8b5cf6" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── New Users Line Chart ─────────────────────────────────────────────────────

function NewUsersChart({ data }: { data: NewUsersChartItem[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-cyan-500" />
            کاربران جدید
          </CardTitle>
          <div className="text-left">
            <p className="text-base font-bold leading-none tabular-nums">
              {total.toLocaleString("fa-IR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">۳۰ روز اخیر</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-3 pt-0 pb-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtAxisDate}
                interval={6}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className={TOOLTIP_STYLE}>
                      <p className="font-medium">{fmtAxisDate(label as string)}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">کاربر جدید</span>
                        <span className="font-semibold text-cyan-600">
                          {(payload[0].value as number).toLocaleString("fa-IR")}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────

function RecentOrdersTable({ data }: { data: RecentOrder[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ShoppingCart className="h-4 w-4 text-blue-500" />
          سفارش‌های اخیر
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">مشتری</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">مبلغ</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">وضعیت</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground hidden sm:table-cell">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((order) => {
                const cfg = ORDER_STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{order.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                      {fmtMoney(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg?.className ?? ""}`}>
                        {cfg?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums hidden sm:table-cell">
                      {fmtDate(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Low Stock Table ──────────────────────────────────────────────────────────

function LowStockTable({ data }: { data: LowStockVariant[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          موجودی رو به اتمام
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">محصول</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">ویژگی</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">کل</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">رزرو</th>
                <th className="px-4 py-2.5 text-right font-medium text-xs text-muted-foreground">موجود</th>
              </tr>
            </thead>
            <tbody>
              {data.map((v) => {
                const availColor =
                  v.available <= 2 ? "text-red-600 font-bold" :
                  v.available <= 4 ? "text-amber-600 font-semibold" :
                  "";
                return (
                  <tr key={v.sku} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight text-xs">{v.productName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{v.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.attributes).map(([k, val]) => (
                          <span key={k} className="inline-flex items-center gap-1 rounded border bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {isHexColor(val) ? (
                              <span className="inline-block h-3 w-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: val }} />
                            ) : val}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">{v.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">{v.reserved}</td>
                    <td className={`px-4 py-3 tabular-nums text-sm ${availColor}`}>{v.available}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Content ────────────────────────────────────────────────────────

function DashboardContent({ data }: { data: DashboardData }) {
  const { summary } = data;

  const kpiCards: KpiCardProps[] = [
    {
      label: "درآمد ماه جاری",
      value: `${(summary.revenueThisMonth / 1_000_000).toFixed(1)} م`,
      icon: TrendingUp,
      iconBg: "#eef2ff",
      iconColor: "#6366f1",
    },
    {
      label: "در انتظار پرداخت",
      value: summary.pendingPaymentOrders,
      icon: Clock,
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
    },
    {
      label: "سفارش‌های امروز",
      value: summary.ordersToday,
      icon: ShoppingBag,
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
    },
    {
      label: "کل کاربران",
      value: summary.totalUsers,
      icon: Users,
      iconBg: "#ecfeff",
      iconColor: "#06b6d4",
    },
    {
      label: "محصولات فعال",
      value: summary.activeProducts,
      icon: Package,
      iconBg: "#f0fdf4",
      iconColor: "#22c55e",
    },
    {
      label: "موجودی کم",
      sublabel: "واریانت",
      value: summary.lowStockCount,
      icon: AlertTriangle,
      iconBg: "#fef2f2",
      iconColor: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">داشبورد</h2>
        <p className="text-sm text-muted-foreground mt-0.5">خلاصه عملکرد فروشگاه</p>
      </div>

      {/* KPI Cards — 2 rows of 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => (
          <KpiCard key={i} {...card} />
        ))}
      </div>

      {/* Row 2: Revenue + Orders Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 min-h-0">
          <RevenueChart data={data.revenueChart} />
        </div>
        <div className="min-h-0">
          <OrdersDonut data={data.ordersByStatus} />
        </div>
      </div>

      {/* Row 3: Top Products + New Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 min-h-0">
          <TopProductsChart data={data.topProducts} />
        </div>
        <div className="min-h-0">
          <NewUsersChart data={data.newUsersChart} />
        </div>
      </div>

      {/* Row 4: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrdersTable data={data.recentOrders} />
        <LowStockTable data={data.lowStockVariants} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        خطا در بارگذاری. لطفاً صفحه را بازنشانی کنید.
      </div>
    );
  }

  return <DashboardContent data={data} />;
}
