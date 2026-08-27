# گزارش اجرای اصلاحات سئو

تاریخ: ۲۰۲۶-۰۸-۲۷

این سند لیست کاری‌ست که برای رفع مواردِ `SEO_ISSUES.md` (به‌همراه بخش بحرانیِ افزوده‌شده در انتهای آن فایل) انجام شد. هر بخش شامل: مسئله، اقدامِ انجام‌شده، فایل‌های تغییرکرده و کامیت مربوطه.

---

## ۰. زیرساخت لازم — Slug برای دسته‌بندی محصول

**مسئله**: URLهای دسته‌بندی روی `?categoryId=<uuid>` بود؛ سئوی کلمات کلیدی دسته کار نمی‌کرد. برای ساخت `/category/<slug>` باید ابتدا slug روی دسته‌بندی وجود می‌داشت.

**اقدام**:
- افزوده شدن ستون `slug` روی entity `Category` با partial unique index (`WHERE deletedAt IS NULL`).
- Migration `1749470031000-AddSlugToCategories.ts` با backfill خودکار برای رکوردهای موجود (`c-` + ۱۲ کاراکتر از id).
- افزودن `slug` به DTOهای create/update با validator `SLUG_PATTERN` (سازگار با فارسی).
- `GET /categories/by-slug/:slug` روی کنترلر Category + متد `findBySlug` و `assertSlugFree` روی سرویس.
- Type فرانت (`Category`, `CreateCategoryRequest`, `UpdateCategoryRequest`) به‌روز شد.
- Hook جدید `useCategoryBySlug` مثل الگوی محصول.
- در `CategoryModal`ِ پنل ادمین ورودی slug + auto-slug از نام + پیش‌نمایش URL اضافه شد.
- ستون slug به جدول لیست دسته‌بندی‌های پنل اضافه شد.

**کامیت**: `503316e Add slug to categories with by-slug lookup`

---

## ۱. بررسی مورد «۴ تگ h2 خالی روی صفحه اصلی»

**مسئله (گزارش‌شده)**: کاربر گزارش داد ۴ تگ `<h2>` خالی روی صفحه اصلی وجود دارد و باید حذف شوند.

**اقدام / یافته**: سرچ کامل روی کل کامپوننت‌های `apps/web/src/components/store/*` و صفحه اصلی. تمام ۸ تگ `<h2>` صفحه اصلی (شامل `sr-only`) محتوای فارسی دارند. هیچ تگ `<h2></h2>` خالی یافت نشد. این مورد **غیرقابل اجرا / گزارشِ نادرست** برای وضعیت فعلی کد ثبت می‌شود.

**فایل‌های بررسی‌شده**:
- `elina-home.tsx` (پنج h2 با محتوا)
- `home-catalog-gateway.tsx` (h2 با `sr-only`)
- `newsletter-signup.tsx`
- `reviews-section.tsx`

**کامیت**: —

---

## ۲. تناقض دامنه بین متادیتا و Organization JSON-LD

**مسئله (Issues #4, #5 + بخش بحرانی مورد ۲)**: در `elina-home.tsx` یک بلاک `organizationJsonLd` وجود داشت با `url: "https://elina.com"` (اشتباهاً روی دامنه‌ای که وجود ندارد). هم‌زمان `layout.tsx` هم Organization خودش را با `siteUrl` تولید می‌کرد → دو Organization متضاد.

**اقدام**:
- حذف کاملِ بلاک `organizationJsonLd` از `elina-home.tsx` و اسکریپت مربوطه.
- ارتقاء گرافِ `structuredData` در `layout.tsx` از `Organization` به `["Organization", "OnlineStore"]` + افزودن `description`, `areaServed: "IR"`, `currenciesAccepted: "IRR"`, `paymentAccepted`.

**فایل‌ها**:
- `apps/web/src/components/store/elina-home.tsx`
- `apps/web/src/app/layout.tsx`

**کامیت**: `eaa582e Fix duplicate/misdomained Organization JSON-LD`

---

## ۳. noindex روی صفحات خصوصی و تراکنشی

**مسئله (بخش بحرانی مورد ۱ + Issue #20)**: `/cart` جزو صفحات پربازدید Search Console بود چون noindex نداشت. `crawl budget` صرف صفحات خالی می‌شد.

**اقدام**:
- افزودن `export const metadata: Metadata = { robots: { index: false, follow: true } }` مستقیم به صفحات که server component بودند (`/login`, `/payment/callback`).
- ساخت `layout.tsx` نازک server-side برای هر روت client-only که metadata از طریقش export شود:
  - `/cart/layout.tsx`
  - `/checkout/layout.tsx`
  - `/favorites/layout.tsx`
  - `/account/layout.tsx`
  - `/orders/layout.tsx`
  - `/admin/login/layout.tsx` (با `noindex, nofollow`)
- گسترش `disallow` در `robots.ts` به: `/favorites`, `/payment/`, `/admin/`.

**کامیت**: `7852b01 Add noindex robots meta to private and utility routes`

---

## ۴. Product / Offer / BreadcrumbList JSON-LD در PDP

**مسئله (Issue #1, #10 + بخش بحرانی مورد ۱ زیرین)**: صفحه محصول فقط اسکیمای عمومی layout را داشت. Google قیمت، موجودی، برند را نمی‌دید و breadcrumb ساختاریافته نداشت.

**اقدام**:
- در `apps/web/src/app/(store)/products/[slug]/page.tsx`:
  - افزودن `Product` JSON-LD با فیلدهای: `name`, `description`, `sku` (از اولین variant)، `image` (کاور + تصاویر variant)، `brand: { name: "الینا" }`، `category`.
  - افزودن `Offer` (وقتی همه variantها یک قیمت دارند) یا `AggregateOffer` (`lowPrice`/`highPrice`/`offerCount`) — با `priceCurrency: "IRR"`, `availability` (`InStock`/`OutOfStock` بر اساس مجموع stock)، `priceValidUntil` یک‌سال آینده.
  - افزودن `BreadcrumbList` سه/چهارسطحی (خانه → محصولات → دسته‌بندی → محصول). سطح دسته‌بندی به‌صورت لینک به `/category/<slug>` است.
- افزودن سطح دسته‌بندی در breadcrumb بصری (nav) روی PDP.
- گسترش نوع `Product.category` به `Pick<Category, "id" | "name" | "slug">`.
- encode شدن slug فارسی در canonical (بحث Issue #11 هم پوشش داده شد).

**کامیت**: `9f25899 Add Product/Offer/BreadcrumbList JSON-LD to PDP`

---

## ۵. Landing Pageهای دسته‌بندی `/category/[slug]`

**مسئله (بخش بحرانی مورد ۵)**: URL دسته‌بندی به‌شکل `?categoryId=<uuid>` بود؛ Google صفحه‌ی مستقل و ایندکس‌شدنی‌ای برای «مانتو»، «شومیز»، «تیشرت» و ... نداشت.

**اقدام**:
- ساخت route جدید `apps/web/src/app/(store)/category/[slug]/page.tsx`:
  - Server component که با endpoint جدید `/categories/by-slug/:slug` دسته را می‌گیرد و در صورت نبود، `notFound()`.
  - Metadata داینامیک: title `{name} — خرید آنلاین {name} زنانه`، description کامل، canonical `/category/<slug>` (encoded)، OpenGraph.
  - H1 قابل‌مشاهده + پاراگراف ~۱۵۰-۲۰۰ کلمه‌ای متنی برای سیگنال محتوایی (طبق توصیه گزارش).
  - JSON-LD: `CollectionPage` با `mainEntity: ItemList` (تا ۲۰ آیتم اول با position مطلق) + `BreadcrumbList`.
  - نمایش grid محصولات با pagination و `CategoryFilter` و FAB موبایل، هم‌شکل با `/products`.
- ساخت `not-found.tsx` مربوطه.
- به‌روزرسانی `sitemap.ts`:
  - افزودن URL‌های `${siteUrl}/category/<encoded-slug>` برای همه دسته‌ها با تصویر کاور و changeFrequency `weekly`, priority `0.8`.
  - حذف entryهای query-based قدیمی `/articles?category=<slug>` (Issue #15).
  - encode شدن slug مقاله و محصول در همه URLهای sitemap.
- به‌روزرسانی لینک دسته‌بندی در `elina-home.tsx` تا در صورت وجود slug به `/category/<slug>` برود (با fallback به روش قدیمی).

**کامیت**: `b3a4142 Add /category/[slug] SEO landing pages`

---

## ۶. `notFound()` روی PDP + `/category/[slug]` — رفع soft-404

**مسئله (Issue #8)**: کد قبلی PDP فقط `robots: noindex` برمی‌گرداند و runtime error می‌داد، ۴۰۴ واقعی نداشت.

**اقدام**:
- PDP در `catch` از `apiFetch` حالا `notFound()` از `next/navigation` صدا می‌زند.
- ساخت `apps/web/src/app/(store)/products/[slug]/not-found.tsx` با UI فارسی (H1 + دعوت به `/products`).
- همین کار برای `/category/[slug]/not-found.tsx`.

**کامیت‌ها**:
- `9f25899` (تغییر PDP به `notFound()`)
- `a741e89 Add not-found pages for product + category routes`

---

## ۷. alt text تصاویر محصول

**مسئله (Issue #7)**: `ImageGallery` روی همه تصاویر (اصلی و thumbnails) `alt=""` می‌گذاشت → از Google Images پنهان.

**اقدام**:
- `ImageGallery` حالا `productName` و `colorLabel` می‌گیرد.
- alt تصویر اصلی: `productName` یا `productName — رنگ <color>` وقتی رنگ انتخاب باشد.
- thumbnails: `{baseAlt} — تصویر {i+1}` + `aria-label` مناسب روی button.
- در `ProductDetailClient` رنگِ انتخاب‌شده از `valueLabels` استخراج و به gallery پاس می‌شود.

**کامیت**: `f5d1d6b Set descriptive alt text on PDP image gallery`

---

## ۸. کانونیکال داینامیک و noindex روی فیلترهای `/products`

**مسئله (Issue #3)**: `alternates.canonical: "/products"` هارد‌کد شده بود؛ همه صفحات فیلتر و pagination به یک URL کانونیکال می‌شدند و noindex نداشتند.

**اقدام**:
- `metadata` تبدیل به `generateMetadata({ searchParams })`.
- Pagination: `?page=n` (n>1) → self-canonical به `/products?page=n`. صفحه اول → `/products`.
- هر فیلتر/سرچ/سرت → `robots: { index: false, follow: true }`.

**کامیت**: `87a4c27 Add dynamic canonical + noindex on filtered /products PLP`

---

## ۹. Encode کردن slug فارسی

**مسئله (Issue #11)**: canonical و URLهای JSON-LD برای مقاله فارسی encode نمی‌شدند.

**اقدام**:
- `apps/web/src/app/(store)/articles/[slug]/page.tsx`: slug مقاله و slug محصول ویژه در تمام مصادیق URL (canonical, JSON-LD `url`, mainEntityOfPage `@id`) با `encodeURIComponent` بسته شد.
- `sitemap.ts` هم‌زمان با کامیت landing categoryها به‌روزرسانی شد (بند ۵).

**کامیت**: `ef39140 Encode Persian slug in article canonical + JSON-LD URL`

---

## مواردی که پوشش داده نشده و پیشنهاد اقدام بعدی

اینها با scope فعلی خارج ماندند ولی از `SEO_ISSUES.md` مهم‌اند و به راحتی می‌شود در PR بعدی برداشت:

| مسئله | چرا مهم | حجم تخمینی |
|-------|---------|-----------|
| Issue #2 — Server-render قیمت/توضیحات/گالری محصول | Googlebot در پاس اول رندر ندارد و بخشی از سیگنال قیمت گم می‌شود (JSON-LD کمک کرده ولی HTML اولیه هم مهم است) | متوسط — refactor `ProductDetailClient` |
| Issue #6 — مهاجرت `<img>` خام به `next/image` | LCP و CLS در PLP و PDP | متوسط — تعداد فایل زیاد |
| Issue #9 — Header client-only + منوی دسته‌بندی داخلی | لینک داخلی به `/category/<slug>` روی هدر باعث می‌شود سطح ایندکس دسته‌ها بهتر شود | کوچک |
| Issue #12 — H1 قابل‌مشاهده روی صفحه اصلی | فعلاً `sr-only` است | کوچک |
| Issue #13, #14 — H1 قابل‌مشاهده و `CollectionPage` روی `/products` | | کوچک |
| Issue #16 — icons manifest ناکافی (۱۹۲/۵۱۲ + apple-touch) | نصب PWA و آیکن iOS | کوچک ولی نیاز به asset |
| Issue #22 — trim کردن `title` PDP | | کوچک |
| Issue #23-#25 — alt تصویر Enamad، صفحات policy، hreflang مقاله | E-E-A-T | متوسط |
| Issue #27-#28 — MerchantReturnPolicy، AggregateRating | نیاز به داده مرچنت و بخش نظرات | متوسط |
| Issue #31 — ISR revalidate روی PDP | perf | کوچک |

## خلاصه اجرایی

- **۱۰ کامیت** روی branch `main`.
- **۱ migration جدید** روی API (نیاز به اجرا: `pnpm --filter api typeorm migration:run` روی محیط پروداکشن).
- **۲ صفحه `not-found.tsx` جدید**، **۶ `layout.tsx` نازک برای noindex**.
- **۱ روت جدید** (`/category/[slug]`) با UI, JSON-LD, و sitemap کامل.
- **بدون tsc error**.

## دستورهای احتیاطی پیش از دیپلوی

```bash
# اجرای migration جدید categories.slug
pnpm --filter api typeorm migration:run

# در صورت داشتن دیتای واقعی، بعد از migration به هر دسته‌بندی
# یک slug معنادار (مانتو، شومیز، تیشرت) از پنل ادمین بدهید.
# تا آن زمان، slugهای backfilled (`c-xxxxxxxxxxxx`) کار می‌کنند
# ولی برای سئو باید ویرایش شوند.
```
