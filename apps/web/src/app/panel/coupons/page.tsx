"use client";

import { useState } from "react";
import { Pencil, Plus, Tag } from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/data-table";
import { CouponModal } from "@/components/modals";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
} from "@/hooks/use-coupons";
import { useModal } from "@/hooks/use-modal";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/types";

export default function CouponsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCoupons({ page, limit: 20 });
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const formModal = useModal<Coupon>();

  async function handleSubmit(
    payload:
      | { mode: "create"; data: Parameters<typeof createCoupon.mutateAsync>[0] }
      | { mode: "update"; data: Parameters<typeof updateCoupon.mutateAsync>[0]["data"] },
  ) {
    try {
      if (payload.mode === "update") {
        if (!formModal.data) return;
        await updateCoupon.mutateAsync({ id: formModal.data.id, data: payload.data });
        toast.success("کد تخفیف بروزرسانی شد");
      } else {
        await createCoupon.mutateAsync(payload.data);
        toast.success("کد تخفیف ایجاد شد");
      }
      formModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ذخیره");
    }
  }

  async function handleToggle(coupon: Coupon, isActive: boolean) {
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, data: { isActive } });
      toast.success(isActive ? "کد فعال شد" : "کد غیرفعال شد");
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  }

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "کد",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold" dir="ltr">
          {row.code}
        </span>
      ),
    },
    {
      key: "percentage",
      header: "درصد",
      cell: (row) => (
        <span className="font-medium text-primary">
          {row.percentage.toLocaleString("fa-IR")}٪
        </span>
      ),
    },
    {
      key: "maxDiscountAmount",
      header: "سقف تخفیف",
      cell: (row) => (
        <span className="tabular-nums">
          {formatPrice(row.maxDiscountAmount)}{" "}
          <span className="text-xs text-muted-foreground">تومان</span>
        </span>
      ),
    },
    {
      key: "scope",
      header: "اسکوپ",
      cell: (row) => (
        <Badge variant="secondary" className="font-normal">
          {row.scopeType === "product" ? "یک محصول" : "یک دسته‌بندی"}
        </Badge>
      ),
    },
    {
      key: "usage",
      header: "استفاده",
      cell: (row) => {
        const remaining = row.quantity - row.usedCount;
        const exhausted = remaining <= 0;
        return (
          <span
            className={cn(
              "tabular-nums text-sm",
              exhausted && "text-destructive font-medium",
            )}
          >
            {row.usedCount.toLocaleString("fa-IR")} / {row.quantity.toLocaleString("fa-IR")}
          </span>
        );
      },
    },
    {
      key: "isActive",
      header: "وضعیت",
      cell: (row) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={(v) => handleToggle(row, v)}
          disabled={updateCoupon.isPending}
        />
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-16",
      cell: (row) => (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => formModal.open(row)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const isPending = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            کدهای تخفیف
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            مدیریت کدهای تخفیف درصدی با سقف
          </p>
        </div>
        <Button onClick={() => formModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">کد جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="هیچ کد تخفیفی ثبت نشده است"
        pagination={
          data && data.totalPages > 1
            ? {
                page: data.page,
                totalPages: data.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <CouponModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleSubmit}
        isPending={isPending}
        initial={formModal.data}
      />
    </div>
  );
}
