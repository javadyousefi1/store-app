"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookText, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDeleteModal } from "@/components/modals";
import { useAdminArticles, useDeleteArticle } from "@/hooks/use-articles";
import { useAdminArticleCategories } from "@/hooks/use-article-categories";
import { useModal } from "@/hooks/use-modal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Article } from "@/types";

type StatusTab = "all" | "published" | "draft";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all",       label: "همه" },
  { value: "published", label: "منتشرشده" },
  { value: "draft",     label: "پیش‌نویس" },
];

export default function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusTab>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounced search — one request per pause, not per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [debouncedSearch, status, categoryId]);

  const { data, isLoading } = useAdminArticles({
    page,
    status:     status === "all" ? undefined : status,
    categoryId: categoryId === "all" ? undefined : categoryId,
    search:     debouncedSearch || undefined,
  });
  const { data: categories } = useAdminArticleCategories();

  const remove = useDeleteArticle();
  const deleteModal = useModal<Article>();

  async function handleDelete() {
    if (!deleteModal.data) return;
    try {
      await remove.mutateAsync(deleteModal.data.id);
      toast.success("مقاله حذف شد");
      deleteModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در حذف");
    }
  }

  const columns: Column<Article>[] = [
    {
      key: "title",
      header: "عنوان",
      cell: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="line-clamp-1 font-medium">{row.title}</p>
          <p className="line-clamp-1 font-mono text-[11px] text-muted-foreground" dir="ltr">
            /{row.slug}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "دسته",
      className: "hidden md:table-cell w-40",
      cell: (row) => (
        <span className="text-sm">{row.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      className: "w-28",
      cell: (row) =>
        row.publishedAt ? (
          <Badge className="border-transparent bg-emerald-100 text-emerald-800">
            منتشرشده
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            پیش‌نویس
          </Badge>
        ),
    },
    {
      key: "publishedAt",
      header: "تاریخ انتشار",
      className: "hidden lg:table-cell w-32",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.publishedAt ? formatDate(row.publishedAt) : "—"}
        </span>
      ),
    },
    {
      key: "views",
      header: "بازدید",
      className: "hidden lg:table-cell w-20 text-center",
      cell: (row) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {row.viewCount.toLocaleString("fa-IR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-28",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.publishedAt && (
            <a
              href={`/articles/${row.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
              aria-label="مشاهده در سایت"
              title="مشاهده در سایت"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
          )}
          <Link
            href={`/panel/articles/${row.id}`}
            className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
            aria-label="ویرایش"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BookText className="h-5 w-5 text-primary" />
            مقالات
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {debouncedSearch
              ? `${data?.total ?? 0} نتیجه برای «${debouncedSearch}»`
              : `مجموع ${data?.total ?? 0} مقاله`}
          </p>
        </div>
        <Link
          href="/panel/articles/new"
          className={buttonVariants({ className: "gap-2" })}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">مقاله جدید</span>
          <span className="sm:hidden">جدید</span>
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="جستجو در عنوان"
            className="h-10 pr-9 pl-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="پاک کردن جستجو"
              className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">همه‌ی دسته‌ها</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status tabs */}
        <div className="flex rounded-lg border border-input p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                status === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyMessage="مقاله‌ای یافت نشد"
        pagination={
          data && data.totalPages > 1
            ? { page: data.page, totalPages: data.totalPages, onPageChange: setPage }
            : undefined
        }
      />

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={remove.isPending}
        title="حذف مقاله"
        description={`«${deleteModal.data?.title ?? ""}» حذف شود؟ همه‌ی عکس‌های آپلود شده هم پاک می‌شوند.`}
      />
    </div>
  );
}
