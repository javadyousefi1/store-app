"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDeleteModal } from "@/components/modals";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { useModal } from "@/hooks/use-modal";
import { formatDate } from "@/lib/format";
import type { User } from "@/types";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers(page);
  const deleteUser = useDeleteUser();
  const deleteModal = useModal<User>();

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await deleteUser.mutateAsync(deleteModal.data.id);
      toast.success("کاربر حذف شد");
      deleteModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "نام",
      cell: (row) => (
        <span className="font-medium">
          {row.firstName || row.lastName
            ? `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim()
            : "—"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "موبایل",
      cell: (row) => <span dir="ltr" className="text-sm">{row.phone}</span>,
    },
    {
      key: "role",
      header: "نقش",
      cell: (row) => (
        <Badge variant={row.role === "admin" ? "default" : "secondary"}>
          {row.role === "admin" ? "ادمین" : "کاربر"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "تاریخ ثبت",
      className: "hidden sm:table-cell",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => deleteModal.open(row)}
          disabled={row.role === "admin"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">کاربران</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          مجموع {data?.total ?? 0} کاربر
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        pagination={data ? { page, totalPages: data.totalPages, onPageChange: setPage } : undefined}
        emptyMessage="کاربری یافت نشد"
      />

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={deleteUser.isPending}
        title="حذف کاربر"
        description={`آیا می‌خواهید کاربر ${deleteModal.data?.phone} را حذف کنید؟`}
      />
    </div>
  );
}
