"use client";

import { useState } from "react";
import { BookOpenText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { ArticleCategoryModal, ConfirmDeleteModal } from "@/components/modals";
import {
  useAdminArticleCategories,
  useCreateArticleCategory,
  useDeleteArticleCategory,
  useUpdateArticleCategory,
} from "@/hooks/use-article-categories";
import { useModal } from "@/hooks/use-modal";
import type { ArticleCategory } from "@/types";

export default function ArticleCategoriesPage() {
  const { data, isLoading } = useAdminArticleCategories();
  const create = useCreateArticleCategory();
  const update = useUpdateArticleCategory();
  const remove = useDeleteArticleCategory();
  const formModal = useModal<ArticleCategory>();
  const deleteModal = useModal<ArticleCategory>();

  async function handleSubmit(
    payload:
      | { mode: "create"; data: Parameters<typeof create.mutateAsync>[0] }
      | { mode: "update"; data: Parameters<typeof update.mutateAsync>[0]["data"] },
  ) {
    try {
      if (payload.mode === "update") {
        if (!formModal.data) return;
        await update.mutateAsync({ id: formModal.data.id, data: payload.data });
        toast.success("دسته‌بندی بروزرسانی شد");
      } else {
        await create.mutateAsync(payload.data);
        toast.success("دسته‌بندی ایجاد شد");
      }
      formModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ذخیره");
    }
  }

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await remove.mutateAsync(deleteModal.data.id);
      toast.success("حذف شد");
      deleteModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      // The most common reason: RESTRICT FK — category has articles.
      toast.error(msg ?? "حذف ناموفق بود — احتمالاً مقاله‌ای در این دسته وجود دارد.");
    }
  }

  const columns: Column<ArticleCategory>[] = [
    {
      key: "name",
      header: "نام",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "slug",
      header: "اسلاگ",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
          {row.slug}
        </span>
      ),
    },
    {
      key: "description",
      header: "توضیح",
      className: "hidden md:table-cell",
      cell: (row) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {row.description ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-24",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => formModal.open(row)}
            aria-label="ویرایش"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => deleteModal.open(row)}
            aria-label="حذف"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BookOpenText className="h-5 w-5 text-primary" />
            دسته‌بندی مقالات
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            گروه‌بندی مقالات وبلاگ برای SEO و ناوبری
          </p>
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
        emptyMessage="هیچ دسته‌بندی ثبت نشده است"
      />

      <ArticleCategoryModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleSubmit}
        isPending={create.isPending || update.isPending}
        initial={formModal.data ?? undefined}
      />

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={remove.isPending}
        title="حذف دسته‌بندی"
        description={`آیا از حذف «${deleteModal.data?.name ?? ""}» مطمئنید؟ اگر مقاله‌ای در این دسته باشد، حذف انجام نمی‌شود.`}
      />
    </div>
  );
}
