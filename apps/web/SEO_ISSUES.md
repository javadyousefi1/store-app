# گزارش مشکلات سئو فروشگاه الینا

تاریخ: ۲۰۲۶-۰۸-۲۱
منبع: ایجنت `seo-expert`

---

## مشکلات بحرانی (Blocker)

### ۱. نبود Product JSON-LD روی صفحه محصول
- **فایل**: `apps/web/src/app/(store)/products/[slug]/page.tsx:48-88`
- **مشکل**: صفحه محصول هیچ اسکیمای `Product` یا `BreadcrumbList` سرور-رندر ندارد. از Rich Results گوگل (قیمت، موجودی، ستاره) کاملاً محروم است.
- **اصلاح**: افزودن `<script type="application/ld+json">` با نوع `Product` شامل `name`, `image`, `description`, `sku`, `offers` (price, priceCurrency: "IRR", availability, url, priceValidUntil), `brand`. مقدار `availability` از مجموع stock واریانت‌ها.

### ۲. رندر client-only در صفحه محصول
- **فایل**: `apps/web/src/components/store/product-detail-client.tsx:1` و `apps/web/src/app/(store)/products/[slug]/page.tsx:80`
- **مشکل**: فقط نام و breadcrumb ساده در HTML سرور می‌آید. **قیمت، توضیحات، دسته، مشخصات (سایز/رنگ) و گالری تصاویر همه client render می‌شوند**. Googlebot در فاز اول crawl این‌ها را نمی‌بیند.
- **اصلاح**: قسمت‌های ثابت (نام، توضیحات، قیمت، دسته، breadcrumb، همه تصاویر گالری) در Server Component. فقط تعامل‌ها (VariantSelector, AddToCart, FavoriteButton, useNotifyMe) در child کلاینت.

### ۳. کانونیکال ناسازگار و ایندکس بدون کنترل صفحات فیلتر
- **فایل**: `apps/web/src/app/(store)/products/page.tsx:31-34`
- **مشکل**: `canonical: "/products"` هارد کد شده. صفحات pagination (`?page=2`) هم به `/products` کانونیکال می‌شن که اشتباه است. صفحات فیلتر بدون `noindex`.
- **اصلاح**:
  - تبدیل `metadata` به `generateMetadata({ searchParams })`
  - اگر فقط `page=n` (n>1) → کانونیکال به `?page=n`
  - اگر فیلتر/search دارد → `robots: { index: false, follow: true }`

### ۴. عدم تطابق دامنه بین متادیتا و JSON-LD صفحه اصلی
- **فایل**: `apps/web/src/components/store/elina-home.tsx:44-53`
- **مشکل**: `organizationJsonLd` هارد‌کد به `https://elina.ir` است، اما `layout.tsx:17-18` و `sitemap.ts:5-6` از `elinaclothes.com` استفاده می‌کنند. دو دامنه رقیب در ساختار داده.
- **اصلاح**: حذف بلوک JSON-LD در `elina-home.tsx` چون `layout.tsx:89-117` قبلاً یک `Organization` جامع‌تر دارد.

### ۵. اسکیمای صفحه اصلی هم تکرار و هم اشتباه
- **فایل**: `apps/web/src/components/store/elina-home.tsx:42-53`
- **مشکل**: دو Organization تعریف شده که هم @id ندارد و هم دامنه‌ها متضاد.
- **اصلاح**: حذف در `elina-home.tsx`. در `layout.tsx` نوع را از `"Organization"` به `"OnlineStore"` تغییر و افزودن `areaServed`, `currenciesAccepted`, `paymentAccepted`.

---

## مشکلات با اولویت بالا

### ۶. استفاده از `<img>` خام به‌جای `next/image`
- **فایل‌ها**:
  - `apps/web/src/components/store/product-card.tsx:22-28`
  - `apps/web/src/components/store/home-product-grid.tsx:24-30`
  - `apps/web/src/components/store/home-catalog-gateway.tsx:88-94`
  - `apps/web/src/components/store/image-gallery.tsx:26-32,54-61`
  - `apps/web/src/components/store/bestsellers-section.tsx:65-71`
  - `apps/web/src/components/store/article-card.tsx:36-42`
  - `apps/web/src/components/store/cart-sidebar.tsx:104-110`
  - `apps/web/src/components/store/category-filter.tsx:109`
  - `apps/web/src/app/(store)/articles/[slug]/page.tsx:268-276`
- **مشکل**: AVIF/WebP خودکار نمی‌شود، srcset responsive تولید نمی‌شود، CLS بالا، fetchPriority تنظیم نمی‌شود.
- **اصلاح**: تبدیل به `<Image>` با width/height/sizes. برای LCP (تصویر اول محصول در گالری و اولین کارت home) از `priority` استفاده.

### ۷. `alt=""` روی تصاویر اصلی محصول
- **فایل**: `apps/web/src/components/store/image-gallery.tsx:28,56`
- **مشکل**: از Google Images پنهان می‌شود (ترافیک آلی مهم برای پوشاک).
- **اصلاح**: `alt` از `product.name` + رنگ/سایز واریانت. مثال: `${product.name} — رنگ ${valueLabels[selectedColor]}`.

### ۸. صفحه محصول ۴۰۴ صحیح ندارد (soft-404)
- **فایل**: `apps/web/src/app/(store)/products/[slug]/page.tsx:37-45`
- **مشکل**: در catch فقط `noindex` برمی‌گردانده می‌شود. `apiFetch` throw می‌کند و runtime error ایجاد می‌شود، نه ۴۰۴.
- **اصلاح**: try/catch در تابع صفحه با `notFound()` از `next/navigation`. ساخت `app/(store)/products/[slug]/not-found.tsx`.

### ۹. Header client-only و لینک‌های داخلی کم
- **فایل**: `apps/web/src/components/store/header.tsx:1` (`"use client"`)
- **مشکل**: کل `StoreHeader` client component است. منوی «دسته‌بندی کالاها» کامنت شده → لینک داخلی به دسته‌ها ندارید.
- **اصلاح**: بخش لینک‌های استاتیک در Server Component جدا. حذف/فعال‌سازی کد کامنت‌شده خطوط 447-483. نمایان کردن لینک‌ها به `/products?categoryId=…`.

### ۱۰. breadcrumb صفحه محصول: نه semantic نه schema
- **فایل**: `apps/web/src/app/(store)/products/[slug]/page.tsx:66-78`
- **مشکل**: دسته محصول در breadcrumb نیست. `BreadcrumbList` JSON-LD ندارد.
- **اصلاح**: افزودن سطح دسته (`خانه › محصولات › {category.name} › {product.name}`) + `BreadcrumbList` JSON-LD (الگو: `articles/[slug]/page.tsx:161-189`).

### ۱۱. کانونیکال URL برای slug فارسی
- **فایل**: `apps/web/src/app/(store)/articles/[slug]/page.tsx:79` و `apps/web/src/app/sitemap.ts:104`
- **مشکل**: slug فارسی باید URL-encoded باشد.
- **اصلاح**: `canonical: \`/articles/${encodeURIComponent(article.slug)}\``.

### ۱۲. صفحه اصلی h1 قابل مشاهده ندارد
- **فایل**: `apps/web/src/components/store/elina-home.tsx:183-185`
- **مشکل**: فقط `<h1 className="sr-only">`. سیگنال ضعیف‌تر و گاهی به‌عنوان hidden content علامت‌گذاری می‌شود.
- **اصلاح**: h1 قابل مشاهده در hero یا بلاک "درباره الینا".

---

## مشکلات با اولویت متوسط

### ۱۳. نبود `CollectionPage`/`ItemList` روی صفحات دسته
- **فایل**: `apps/web/src/app/(store)/products/page.tsx`
- **اصلاح**: JSON-LD `CollectionPage` با `mainEntity: ItemList`.

### ۱۴. H1 صفحه لیست محصولات کامنت شده
- **فایل**: `apps/web/src/app/(store)/products/page.tsx:73-80`
- **اصلاح**: uncomment یا اضافه کردن H1 dynamic بر اساس فیلتر انتخاب‌شده.

### ۱۵. sitemap.ts — صفحات query-based
- **فایل**: `apps/web/src/app/sitemap.ts:96-101`
- **مشکل**: `/articles?category=slug` به sitemap اضافه شده. صفحات query-based کیفیت index را کاهش می‌دهند.
- **اصلاح**: حذف مسیرهای query-based یا ساخت route اختصاصی `/articles/category/[slug]`.

### ۱۶. manifest icons ناکافی
- **فایل**: `apps/web/src/app/manifest.ts:14-21`
- **مشکل**: فقط یک آیکون 1254x1254.
- **اصلاح**: افزودن آیکون‌های 192/512 (any و maskable) و apple-touch-icon 180x180.

### ۱۷. صفحه پرداخت در robots.ts disallow نشده
- **فایل**: `apps/web/src/app/robots.ts:13`
- **مشکل**: `/payment/callback` هر بار با query متفاوت خوانده می‌شود.
- **اصلاح**: افزودن `/payment/` به disallow.

### ۱۸. login و admin/login بدون noindex
- **فایل‌ها**: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/admin/login/page.tsx`
- **اصلاح**: `export const metadata = { robots: { index: false, follow: false } }`.

### ۱۹. hreflang و چندزبانه‌سازی
- **فایل**: `apps/web/src/app/layout.tsx:20-82`
- **اصلاح**: `alternates: { canonical: '/', languages: { 'fa-IR': '/', 'x-default': '/' } }`.

### ۲۰. صفحات client-only robots meta ندارند
- **فایل‌ها**: `apps/web/src/app/(store)/{checkout,cart,favorites,orders,account}/page.tsx`
- **مشکل**: robots.txt کافی نیست — اگر لینکی از خارج بیاید، Google URL را در index قرار می‌دهد.
- **اصلاح**: افزودن `export const metadata: Metadata = { robots: { index: false, follow: true } }`.

### ۲۱. کد duplicate: bestsellers-section.tsx
- **فایل**: `apps/web/src/components/store/bestsellers-section.tsx`
- **اصلاح**: اگر استفاده نمی‌شود، حذف.

### ۲۲. `<title>` صفحه محصول ممکن است طولانی شود
- **فایل**: `apps/web/src/app/(store)/products/[slug]/page.tsx:24`
- **مشکل**: `product.name` + ` | الینا` می‌تواند از حد گوگل بگذرد.
- **اصلاح**: استفاده از `title: { absolute: product.name }` یا trim نام.

---

## توصیه‌های بهبود (Low Priority)

### ۲۳. alt تصویر Enamad
- **فایل**: `apps/web/src/components/store/footer.tsx:184`
- **اصلاح**: `"نماد اعتماد الکترونیکی فروشگاه الینا"`.

### ۲۴. لینک‌های خالی (`href="#"`) در footer
- **فایل**: `apps/web/src/components/store/footer.tsx:120,125,130,135`
- **اصلاح**: ساخت صفحات `/faq`, `/size-guide`, `/return-policy`, `/privacy` (سیگنال E-E-A-T).

### ۲۵. hreflang مقاله
- **فایل**: `apps/web/src/app/(store)/articles/[slug]/page.tsx:78-80`
- **اصلاح**: `alternates.languages` مشابه layout.

### ۲۶. dateModified روی محصول (پس از افزودن Product JSON-LD)
- **اصلاح**: از `product.updatedAt` برای `dateModified` استفاده شود.

### ۲۷. MerchantReturnPolicy روی Product schema
- **اصلاح**: طبق بروزرسانی 2023 Google، بدون `hasMerchantReturnPolicy` warning می‌دهد.

### ۲۸. AggregateRating و Review روی PDP
- **اصلاح**: پس از ساخت بخش نظرات محصول، افزودن `AggregateRating` (ratingValue, reviewCount) و چند `Review`.

### ۲۹. next/font — preload تنظیمات
- **فایل**: `apps/web/src/app/layout.tsx:8-14`
- **اصلاح**: اگر چند وزن دارید که در above-the-fold استفاده نمی‌شوند، `preload: false`.

### ۳۰. sizes attribute برای next/image (پس از مهاجرت)
- **اصلاح**: مثال گرید 2/3/4 ستونی: `sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"`.

### ۳۱. ISR — revalidate صفحه محصول
- **فایل**: `apps/web/src/app/(store)/products/[slug]/page.tsx:50-53`
- **اصلاح**: افزودن `{ revalidate: 300 }` به `apiFetch`.

### ۳۲. generateStaticParams برای Product و Article
- **اصلاح**: برای محصولات پرفروش (top 50) `generateStaticParams` با `dynamicParams=true`.

---

## اولویت اقدام (خلاصه اجرایی)

1. Product JSON-LD + Breadcrumb JSON-LD روی PDP — بزرگ‌ترین برد سئو
2. مهاجرت `<img>` به `next/image` برای LCP
3. Server-render قیمت + توضیحات + گالری محصول
4. رفع تناقض دامنه بین `elina.ir` و `elinaclothes.com` + حذف JSON-LD تکراری Organization
5. noindex روی صفحات فیلتر/سرت PLP + self-canonical روی pagination
6. `notFound()` روی PDP
7. `robots: noindex` روی `/login`, `/admin/login`, `/checkout`, `/cart`, `/account`, `/orders`, `/favorites`, `/payment/callback`
8. افزودن صفحات policy (`/faq`, `/return-policy`, `/privacy`, `/size-guide`)

---

## نکات مثبت فعلی

- `metadataBase` و template عنوان `%s | الینا`
- `sitemap.ts` پویا با articles + products + categories
- `robots.ts` پویا با disallow صحیح
- JSON-LD مقالات (`BlogPosting` + `BreadcrumbList`) کامل
- JSON-LD صفحه لیست مقالات (`Blog`)
- FAQ JSON-LD صفحه اصلی
- RSS feed `/articles/feed.xml` حرفه‌ای
- `<html lang="fa-IR" dir="rtl">` صحیح
- skip link برای دسترسی‌پذیری
- Font optimization با `localFont`, `display: swap`, `preload`, fallback chain
- `next.config.ts` images با AVIF/WebP و minimumCacheTTL طولانی
- `manifest.ts` با lang/dir/theme_color
- بخش «درباره فروشگاه» با کلمات کلیدی و لینک داخلی
- cache header روی assets فونت (immutable یک ساله)
