"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2, Eye, ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ProductModal, ConfirmDeleteModal } from "@/components/modals";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useModal } from "@/hooks/use-modal";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const { data, isLoading } = useProducts(page, filterCategory);
  const { data: categories } = useCategories();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const formModal = useModal<Product>();
  const deleteModal = useModal<Product>();

  async function handleSubmit(form: { name: string; categoryId: string; description: string; isActive: boolean }) {
    try {
      if (formModal.data) {
        await updateProduct.mutateAsync({ id: formModal.data.id, data: { ...form, description: form.description || undefined } });
        toast.success("محصول ویرایش شد");
      } else {
        await createProduct.mutateAsync({
          name: form.name,
          categoryId: form.categoryId,
          description: form.description || undefined,
          isActive: form.isActive,
        });
        toast.success("محصول ایجاد شد");
      }
      formModal.close();
    } catch {
      toast.error("خطا در ذخیره");
    }
  }

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await deleteProduct.mutateAsync(deleteModal.data.id);
      toast.success("محصول حذف شد");
      deleteModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  const columns: Column<Product>[] = [
    {
      key: "cover",
      header: "",
      className: "w-12",
      cell: (row) =>
        row.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.coverUrl} alt={row.name} className="rounded object-cover w-9 h-9" />
        ) : (
          <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      key: "name",
      header: "نام محصول",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "category",
      header: "دسته‌بندی",
      className: "hidden sm:table-cell",
      cell: (row) => row.category?.name ?? "—",
    },
    {
      key: "isActive",
      header: "وضعیت",
      className: "hidden sm:table-cell w-24",
      cell: (row) =>
        row.isActive ? (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            فعال
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <XCircle className="h-3.5 w-3.5" />
            غیرفعال
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/panel/products/${row.id}`}
            className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">محصولات</h2>
          <p className="text-sm text-muted-foreground mt-0.5">مجموع {data?.total ?? 0} محصول</p>
        </div>
        <Button onClick={() => formModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">محصول جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={filterCategory ?? "all"}
          onValueChange={(v) => { setFilterCategory(v === "all" ? undefined : v ?? undefined); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {(v: string) =>
                v === "all"
                  ? "همه دسته‌بندی‌ها"
                  : (categories?.find((c) => c.id === v)?.name ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        pagination={data ? { page, totalPages: data.totalPages, onPageChange: setPage } : undefined}
        emptyMessage="محصولی یافت نشد"
      />

      <ProductModal
        open={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={handleSubmit}
        isPending={createProduct.isPending || updateProduct.isPending}
        initial={formModal.data}
        categories={categories ?? []}
      />

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={deleteProduct.isPending}
        title="حذف محصول"
        description={`آیا می‌خواهید «${deleteModal.data?.name}» را حذف کنید؟`}
      />
    </div>
  );
}
