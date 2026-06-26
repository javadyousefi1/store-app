"use client";

import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { CategoryModal, ConfirmDeleteModal } from "@/components/modals";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories";
import { useModal } from "@/hooks/use-modal";
import { formatDate } from "@/lib/format";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const formModal = useModal<Category>();
  const deleteModal = useModal<Category>();

  async function handleSubmit(name: string) {
    try {
      if (formModal.data) {
        await updateCategory.mutateAsync({ id: formModal.data.id, data: { name } });
        toast.success("دسته‌بندی ویرایش شد");
      } else {
        await createCategory.mutateAsync({ name });
        toast.success("دسته‌بندی ایجاد شد");
      }
      formModal.close();
    } catch {
      toast.error("خطا در ذخیره");
    }
  }

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await deleteCategory.mutateAsync(deleteModal.data.id);
      toast.success("دسته‌بندی حذف شد");
      deleteModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در حذف");
    }
  }

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "نام دسته‌بندی",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "createdAt",
      header: "تاریخ ایجاد",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-24",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => formModal.open(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteModal.open(row)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">دسته‌بندی‌ها</h2>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت دسته‌بندی محصولات</p>
        </div>
        <Button onClick={() => formModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">دسته‌بندی جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="هیچ دسته‌بندی‌ای وجود ندارد"
      />

      <CategoryModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleSubmit}
        isPending={isPending}
        initial={formModal.data}
      />

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={deleteCategory.isPending}
        title="حذف دسته‌بندی"
        description={`آیا مطمئن هستید که می‌خواهید «${deleteModal.data?.name}» را حذف کنید؟`}
      />
    </div>
  );
}
