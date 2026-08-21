"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Wand2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateArticle } from "@/hooks/use-articles";
import { useAdminArticleCategories } from "@/hooks/use-article-categories";
import { slugifyForUrl } from "@/lib/slugify";

export default function NewArticlePage() {
  const router = useRouter();
  const create = useCreateArticle();
  const { data: categories, isLoading: catLoading } = useAdminArticleCategories();

  const [form, setForm] = useState({
    title:       "",
    slug:        "",
    categoryId:  "",
    excerpt:     "",
    content:     "",
  });
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from title until the admin edits it manually.
  useEffect(() => {
    if (!slugTouched) {
      setForm((f) => ({ ...f, slug: slugifyForUrl(f.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const article = await create.mutateAsync({
        categoryId: form.categoryId,
        slug:       form.slug.trim(),
        title:      form.title.trim(),
        excerpt:    form.excerpt.trim(),
        content:    form.content.trim(),
        // Deliberately no publishedAt — always starts as draft.
      });
      toast.success("مقاله ایجاد شد (پیش‌نویس)");
      router.push(`/panel/articles/${article.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg ?? "خطا در ایجاد");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/panel/articles" className="flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          مقالات
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">مقاله جدید</span>
      </nav>

      <div>
        <h2 className="text-xl font-bold">مقاله جدید</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          پس از ایجاد پیش‌نویس، در صفحه‌ی ویرایش می‌توانی تصاویر آپلود کنی و SEO را کامل کنی.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="عنوان" required>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="راهنمای انتخاب مانتوی تابستانی"
                required
                maxLength={200}
                autoFocus
              />
            </Field>

            <Field
              label="اسلاگ (URL)"
              required
              hint={
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Wand2 className="h-3 w-3" />
                  با تغییر عنوان خودکار ساخته می‌شود
                </span>
              }
            >
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="how-to-choose-summer-manto"
                dir="ltr"
                required
                maxLength={200}
                pattern="[a-z0-9؀-ۿ]+(-[a-z0-9؀-ۿ]+)*"
                title="فقط حروف/اعداد و - (بدون فاصله)"
              />
            </Field>

            <Field label="دسته‌بندی" required>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                required
                disabled={catLoading}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>— انتخاب کنید —</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {(!catLoading && (!categories || categories.length === 0)) && (
                <p className="text-xs text-amber-700">
                  هیچ دسته‌بندی ثبت نشده. اول از{" "}
                  <Link href="/panel/article-categories" className="text-primary underline">
                    اینجا
                  </Link>{" "}
                  یک دسته‌بندی بساز.
                </p>
              )}
            </Field>

            <Field
              label="خلاصه"
              required
              hint={<span className="text-[11px] text-muted-foreground">۲۰ تا ۳۰۰ کاراکتر — در لیست‌ها و meta description نمایش داده می‌شود</span>}
            >
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="خلاصه‌ای از موضوع مقاله ..."
                required
                minLength={20}
                maxLength={300}
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <p className="text-end text-[10px] tabular-nums text-muted-foreground">
                {form.excerpt.length.toLocaleString("fa-IR")} / ۳۰۰
              </p>
            </Field>

            <Field
              label="محتوا (HTML)"
              required
              hint={<span className="text-[11px] text-muted-foreground">تگ‌های HTML مستقیم پذیرفته می‌شوند. تصاویر را در مرحله‌ی بعد آپلود کن.</span>}
            >
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="<h2>مقدمه</h2>\n<p>...</p>"
                required
                minLength={50}
                rows={10}
                dir="ltr"
                className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                href="/panel/articles"
                className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm hover:bg-muted"
              >
                انصراف
              </Link>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "در حال ایجاد..." : "ایجاد پیش‌نویس"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

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
