"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, Clock, Copy, Eye, ImagePlus,
  Loader2, Plus, Save, Trash2, Upload, Wand2, X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDeleteModal } from "@/components/modals";
import {
  useAdminArticle,
  useDeleteArticle,
  useDeleteArticleMedia,
  useUpdateArticle,
  useUploadArticleMedia,
} from "@/hooks/use-articles";
import { useAdminArticleCategories } from "@/hooks/use-article-categories";
import { useModal } from "@/hooks/use-modal";
import { formatDate } from "@/lib/format";
import { slugifyForUrl } from "@/lib/slugify";
import type { ArticleMediaItem } from "@/types";

interface FormState {
  title: string;
  slug: string;
  categoryId: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  coverAlt: string;
  authorName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  published: boolean;
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: article, isLoading } = useAdminArticle(id);
  const { data: categories } = useAdminArticleCategories();

  const update = useUpdateArticle();
  const remove = useDeleteArticle();
  const uploadMedia = useUploadArticleMedia();
  const deleteMedia = useDeleteArticleMedia();
  const deleteModal = useModal();

  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState(false);

  // Load article → seed the form ONCE.
  useEffect(() => {
    if (!article) return;
    setForm({
      title:           article.title,
      slug:            article.slug,
      categoryId:      article.categoryId,
      excerpt:         article.excerpt,
      content:         article.content,
      coverUrl:        article.coverUrl ?? "",
      coverAlt:        article.coverAlt ?? "",
      authorName:      article.authorName,
      metaTitle:       article.metaTitle ?? "",
      metaDescription: article.metaDescription ?? "",
      keywords:        article.keywords,
      published:       !!article.publishedAt,
    });
    setDirty(false);
  }, [article]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  }

  async function handleSave() {
    if (!form) return;
    try {
      const wasPublished = !!article?.publishedAt;
      await update.mutateAsync({
        id,
        data: {
          categoryId:      form.categoryId,
          slug:            form.slug.trim(),
          title:           form.title.trim(),
          excerpt:         form.excerpt.trim(),
          content:         form.content,
          coverUrl:        form.coverUrl.trim() || undefined,
          coverAlt:        form.coverAlt.trim() || undefined,
          authorName:      form.authorName.trim() || undefined,
          metaTitle:       form.metaTitle.trim() || undefined,
          metaDescription: form.metaDescription.trim() || undefined,
          keywords:        form.keywords,
          // Only send publishedAt when the toggle actually changed — avoids
          // overwriting the original publish date on every save.
          publishedAt: form.published
            ? (wasPublished ? undefined : new Date().toISOString())
            : (wasPublished ? null : undefined),
        },
      });
      toast.success(form.published ? "ذخیره و منتشر شد" : "ذخیره شد");
      setDirty(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg ?? "خطا در ذخیره");
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(id);
      toast.success("مقاله حذف شد");
      router.push("/panel/articles");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در حذف");
    }
  }

  if (isLoading || !form || !article) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-lg lg:col-span-2" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/panel/articles" className="flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          مقالات
        </Link>
        <span aria-hidden>/</span>
        <span className="line-clamp-1 text-foreground">{article.title}</span>
      </nav>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          {article.publishedAt ? (
            <Badge className="border-transparent bg-emerald-100 text-emerald-800">
              منتشرشده
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              پیش‌نویس
            </Badge>
          )}
          {article.publishedAt && (
            <span className="text-xs text-muted-foreground">
              انتشار: {formatDate(article.publishedAt)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            · {article.readTimeMinutes.toLocaleString("fa-IR")} دقیقه مطالعه
          </span>
          <span className="text-xs text-muted-foreground">
            · {article.viewCount.toLocaleString("fa-IR")} بازدید
          </span>
        </div>
        <div className="flex items-center gap-2">
          {article.publishedAt && (
            <a
              href={`/articles/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
            >
              <Eye className="h-3.5 w-3.5" />
              مشاهده
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => deleteModal.open()}
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={update.isPending || !dirty}>
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {update.isPending ? "در حال ذخیره..." : dirty ? "ذخیره تغییرات" : "ذخیره شد"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Left / main ─────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Field label="عنوان" required>
                <Input
                  value={form.title}
                  onChange={(e) => patch("title", e.target.value)}
                  maxLength={200}
                />
              </Field>

              <Field
                label="اسلاگ (URL)"
                required
                hint={
                  <button
                    type="button"
                    onClick={() => patch("slug", slugifyForUrl(form.title))}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <Wand2 className="h-3 w-3" />
                    از عنوان بساز
                  </button>
                }
              >
                <Input
                  value={form.slug}
                  onChange={(e) => patch("slug", e.target.value)}
                  dir="ltr"
                  maxLength={200}
                  pattern="[a-z0-9؀-ۿ]+(-[a-z0-9؀-ۿ]+)*"
                />
              </Field>

              <Field
                label="خلاصه"
                required
                hint={<CharCounter value={form.excerpt.length} max={300} />}
              >
                <textarea
                  value={form.excerpt}
                  onChange={(e) => patch("excerpt", e.target.value)}
                  minLength={20}
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </Field>

              <Field
                label="محتوا (HTML)"
                required
                hint={
                  <span className="text-[11px] text-muted-foreground">
                    برای درج تصویر، در پنل «مدیا» آپلود کن و لینکش را کپی کن.
                  </span>
                }
              >
                <textarea
                  value={form.content}
                  onChange={(e) => patch("content", e.target.value)}
                  minLength={50}
                  rows={20}
                  dir="ltr"
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </Field>
            </CardContent>
          </Card>

          {/* Media panel — lives under the content since admin bounces between them */}
          <MediaPanel
            articleId={id}
            media={article.media ?? []}
            onUpload={(file, alt) => uploadMedia.mutateAsync({ articleId: id, file, alt })}
            onDelete={async (key) => { await deleteMedia.mutateAsync({ articleId: id, key }); }}
            uploading={uploadMedia.isPending}
            deleting={deleteMedia.isPending}
          />
        </div>

        {/* ── Right / side ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Publish */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">وضعیت انتشار</p>
                <p className="text-xs text-muted-foreground">
                  خاموش = پیش‌نویس. روشن = برای عموم قابل مشاهده.
                </p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => patch("published", v)}
              />
            </CardContent>
          </Card>

          {/* Meta / categorization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">دسته‌بندی و نویسنده</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Field label="دسته‌بندی" required>
                <select
                  value={form.categoryId}
                  onChange={(e) => patch("categoryId", e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="نویسنده">
                <Input
                  value={form.authorName}
                  onChange={(e) => patch("authorName", e.target.value)}
                  maxLength={120}
                  placeholder="تیم الینا"
                />
              </Field>
            </CardContent>
          </Card>

          {/* Cover image */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">تصویر کاور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Field
                label="URL کاور"
                hint={<span className="text-[11px] text-muted-foreground">از پنل مدیا یکی را کپی کن</span>}
              >
                <Input
                  value={form.coverUrl}
                  onChange={(e) => patch("coverUrl", e.target.value)}
                  dir="ltr"
                  type="url"
                  placeholder="https://..."
                />
              </Field>
              <Field
                label="Alt کاور"
                hint={<span className="text-[11px] text-muted-foreground">برای Image SEO</span>}
              >
                <Input
                  value={form.coverAlt}
                  onChange={(e) => patch("coverAlt", e.target.value)}
                  maxLength={200}
                  placeholder="توضیح کوتاه تصویر"
                />
              </Field>
              {form.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.coverUrl}
                  alt={form.coverAlt || "cover preview"}
                  className="max-h-48 w-full rounded-lg border object-cover"
                />
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Field
                label="عنوان SEO"
                hint={<span className="text-[11px] text-muted-foreground">اگر خالی، «عنوان» استفاده می‌شود</span>}
              >
                <Input
                  value={form.metaTitle}
                  onChange={(e) => patch("metaTitle", e.target.value)}
                  maxLength={160}
                  placeholder={form.title}
                />
              </Field>
              <Field
                label="توضیحات SEO"
                hint={<CharCounter value={form.metaDescription.length} max={320} />}
              >
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => patch("metaDescription", e.target.value)}
                  maxLength={320}
                  rows={3}
                  placeholder={form.excerpt || "اگر خالی، «خلاصه» استفاده می‌شود"}
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </Field>
              <Field label="کلمات کلیدی">
                <KeywordsInput
                  keywords={form.keywords}
                  onChange={(next) => patch("keywords", next)}
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        isPending={remove.isPending}
        title="حذف مقاله"
        description={`«${article.title}» حذف شود؟ همه‌ی تصاویر آپلود شده هم پاک می‌شوند.`}
      />
    </div>
  );
}

/* ─────────────────────────── Media panel ─────────────────────────── */

function MediaPanel({
  articleId,
  media,
  onUpload,
  onDelete,
  uploading,
  deleting,
}: {
  articleId: string;
  media: ArticleMediaItem[];
  onUpload: (file: File, alt?: string) => Promise<ArticleMediaItem>;
  onDelete: (key: string) => Promise<void>;
  uploading: boolean;
  deleting: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const item = await onUpload(file);
      toast.success("تصویر آپلود شد و لینکش کپی شد");
      await copyToClipboard(item.url);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "آپلود ناموفق بود");
    }
  }

  async function handleDelete(key: string) {
    try {
      await onDelete(key);
      toast.success("تصویر حذف شد");
    } catch {
      toast.error("خطا در حذف تصویر");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ImagePlus className="h-4 w-4 text-primary" />
          تصاویر مقاله
          <span className="text-xs font-normal text-muted-foreground">
            ({media.length.toLocaleString("fa-IR")})
          </span>
        </CardTitle>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !articleId}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "در حال آپلود..." : "آپلود تصویر"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {media.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              هنوز تصویری آپلود نشده. با «آپلود تصویر» عکس اضافه کن و لینکش را در HTML بچسبان.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {media.map((item) => (
              <MediaItemCard
                key={item.key}
                item={item}
                onDelete={() => handleDelete(item.key)}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MediaItemCard({
  item, onDelete, deleting,
}: {
  item: ArticleMediaItem;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await copyToClipboard(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("لینک کپی شد");
  }

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.alt ?? ""}
        className="h-16 w-16 shrink-0 rounded-md border object-cover"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-xs font-medium">{item.originalName}</p>
        <div className="flex items-center gap-1">
          <input
            readOnly
            value={item.url}
            className="min-w-0 flex-1 rounded border border-input bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground outline-none"
            dir="ltr"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={handleCopy}
            aria-label="کپی لینک"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(item.uploadedAt)}
          </span>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-destructive/70 hover:text-destructive disabled:opacity-50"
            aria-label="حذف تصویر"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Keywords chip input ─────────────────────────── */

function KeywordsInput({
  keywords, onChange,
}: {
  keywords: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState("");

  function add() {
    const v = text.trim();
    if (!v) return;
    if (keywords.includes(v)) { setText(""); return; }
    onChange([...keywords, v]);
    setText("");
  }
  function remove(k: string) {
    onChange(keywords.filter((x) => x !== k));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-[11px]"
          >
            {k}
            <button
              type="button"
              onClick={() => remove(k)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`حذف ${k}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <span className="text-[11px] text-muted-foreground">
            هنوز کلمه‌ی کلیدی اضافه نشده
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="مثال: مانتو تابستانی"
          className="h-9 text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="gap-1 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          افزودن
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Bits ─────────────────────────── */

function Field({
  label, required, hint, children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </Label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function CharCounter({ value, max }: { value: number; max: number }) {
  const near = value > max * 0.9;
  return (
    <span
      className={
        "text-[10px] tabular-nums " +
        (near ? "text-amber-700" : "text-muted-foreground")
      }
    >
      {value.toLocaleString("fa-IR")} / {max.toLocaleString("fa-IR")}
    </span>
  );
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard API may be blocked in some browsers — swallow, caller can toast
  }
}
