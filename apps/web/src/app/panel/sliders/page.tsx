"use client";

import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { SliderModal, ConfirmDeleteModal } from "@/components/modals";
import {
  useCreateSlider,
  useDeleteSlider,
  useSliders,
  useUpdateSlider,
} from "@/hooks/use-sliders";
import { useModal } from "@/hooks/use-modal";
import type { CreateSliderRequest, Slider } from "@/types";

export default function SlidersPage() {
  const { data, isLoading } = useSliders();
  const createSlider = useCreateSlider();
  const updateSlider = useUpdateSlider();
  const deleteSlider = useDeleteSlider();

  const formModal = useModal<Slider>();
  const deleteModal = useModal<Slider>();

  async function handleSubmit(payload: CreateSliderRequest) {
    try {
      if (formModal.data) {
        await updateSlider.mutateAsync({ id: formModal.data.id, data: payload });
        toast.success("اسلاید ویرایش شد");
      } else {
        await createSlider.mutateAsync(payload);
        toast.success("اسلاید ایجاد شد");
      }
      formModal.close();
    } catch {
      toast.error("خطا در ذخیره");
    }
  }

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await deleteSlider.mutateAsync(deleteModal.data.id);
      toast.success("اسلاید حذف شد");
      deleteModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  async function toggleActive(row: Slider) {
    try {
      await updateSlider.mutateAsync({ id: row.id, data: { isActive: !row.isActive } });
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  }

  const columns: Column<Slider>[] = [
    {
      key: "image",
      header: "تصویر",
      className: "w-24",
      cell: (row) => (
        <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {row.desktopImageUrl ?? row.mobileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.desktopImageUrl ?? row.mobileImageUrl ?? ""}
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
      key: "assets",
      header: "تصاویر",
      className: "w-32",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.desktopImageUrl ? "default" : "outline"}>دسکتاپ</Badge>
          <Badge variant={row.mobileImageUrl ? "default" : "outline"}>موبایل</Badge>
        </div>
      ),
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

  const isPending = createSlider.isPending || updateSlider.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">اسلایدر لندینگ</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            مدیریت اسلایدهای صفحه اصلی
          </p>
        </div>
        <Button onClick={() => formModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">اسلاید جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="هیچ اسلایدی ثبت نشده"
      />

      <SliderModal
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
        isPending={deleteSlider.isPending}
        title="حذف اسلاید"
        description={`آیا از حذف «${deleteModal.data?.title}» مطمئن هستید؟`}
      />
    </div>
  );
}
