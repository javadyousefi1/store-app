"use client";

import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/data-table";
import { StoryModal, ConfirmDeleteModal } from "@/components/modals";
import {
  useCreateStory,
  useDeleteStory,
  useStories,
  useUpdateStory,
} from "@/hooks/use-stories";
import { useModal } from "@/hooks/use-modal";
import type { CreateStoryRequest, Story } from "@/types";

export default function StoriesPage() {
  const { data, isLoading } = useStories();
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();

  const formModal = useModal<Story>();
  const deleteModal = useModal<Story>();

  async function handleSubmit(payload: CreateStoryRequest) {
    try {
      if (formModal.data) {
        await updateStory.mutateAsync({ id: formModal.data.id, data: payload });
        toast.success("استوری ویرایش شد");
      } else {
        await createStory.mutateAsync(payload);
        toast.success("استوری ایجاد شد");
      }
      formModal.close();
    } catch {
      toast.error("خطا در ذخیره");
    }
  }

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await deleteStory.mutateAsync(deleteModal.data.id);
      toast.success("استوری حذف شد");
      deleteModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  async function toggleActive(row: Story) {
    try {
      await updateStory.mutateAsync({ id: row.id, data: { isActive: !row.isActive } });
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  }

  const columns: Column<Story>[] = [
    {
      key: "image",
      header: "تصویر",
      className: "w-20",
      cell: (row) => (
        <div className="flex h-16 w-11 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.imageUrl}
              alt={row.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "عنوان",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.title}</span>
          {row.linkUrl && (
            <span className="text-xs text-muted-foreground" dir="ltr">
              {row.linkUrl}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "sortOrder",
      header: "ترتیب",
      className: "w-20",
      cell: (row) => <span className="tabular-nums">{row.sortOrder}</span>,
    },
    {
      key: "isActive",
      header: "فعال",
      className: "w-24",
      cell: (row) => (
        <Switch checked={row.isActive} onCheckedChange={() => toggleActive(row)} />
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-24",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => formModal.open(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => deleteModal.open(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const isPending = createStory.isPending || updateStory.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">استوری‌ها</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            مدیریت استوری‌های بالای صفحه اصلی
          </p>
        </div>
        <Button onClick={() => formModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">استوری جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="هیچ استوری‌ای ثبت نشده"
      />

      <StoryModal
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
        isPending={deleteStory.isPending}
        title="حذف استوری"
        description={`آیا از حذف «${deleteModal.data?.title}» مطمئن هستید؟`}
      />
    </div>
  );
}
