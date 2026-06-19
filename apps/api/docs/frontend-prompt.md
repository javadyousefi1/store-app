# Frontend Prompt — Product Listing & Detail with Cart

## Stack

- **Next.js 14+ App Router** — server components by default, client components only where needed
- **shadcn/ui** — all base components (Button, Badge, Card, Skeleton, Sheet, etc.)
- **Tailwind CSS** — responsive, RTL-ready
- **Persian UI** — `dir="rtl"`, font: `Vazirmatn` (Google Fonts or cdn.fontcdn.ir)
- **State:** Zustand or React Context for cart
- **Fetching:** native `fetch` in server components, `SWR` or `TanStack Query` in client components

---

## Backend

```
Base URL: http://localhost:3000
All API responses are wrapped:
  success → { statusCode, data: { ... }, timestamp }
  error   → { statusCode, error, message, timestamp, path }

Auth: JWT in Authorization: Bearer <token> header
JWT expires in 48h
```

---

## API Reference — what this UI needs

### Products

#### `GET /products`

```
Query: page=1 | limit=20 | categoryId=uuid (optional)
Auth: not required
```

```jsonc
// Response
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 16 Pro",
      "description": "توضیحات ...",
      "categoryId": "uuid",
      "category": { "id": "uuid", "name": "موبایل" },
      "coverUrl": "https://minio.../...?X-Amz-Expires=3600&..."   // presigned, 1h TTL
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

> `coverUrl` is null if no cover is set. Always render a fallback placeholder.

---

#### `GET /products/:id`

```
Auth: not required
```

```jsonc
// Response
{
  "id": "uuid",
  "name": "iPhone 16 Pro",
  "description": "توضیحات",
  "category": { "id": "uuid", "name": "موبایل" },
  "coverUrl": "https://...",   // presigned, 1h TTL — null if no cover
  "variants": [
    {
      "id": "uuid",
      "sku": "BLK256-9A3F2E",
      "price": "59900000",       // string decimal — format as number in UI
      "stock": 10,
      "reserved": 2,             // stock - reserved = actual available
      "attributes": { "color": "black", "storage": "256GB" },
      "imageIds": ["uuid1", "uuid2"],   // UUIDs of media records — fetch URLs separately
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Available stock formula:** `available = stock - reserved`
- `available > 0` → in stock
- `available === 0` → out of stock

---

#### `GET /products/:productId/variants/:variantId/images`

```
Auth: JWT required (any role)
```

```jsonc
// Response — ordered array
[
  { "mediaId": "uuid", "url": "https://minio.../...?X-Amz-Expires=3600&..." }
]
```

> URLs expire in 1h. Don't cache them past that. Fetch on variant select.

---

### Categories

#### `GET /categories`

```
Auth: not required
```

```jsonc
// Response
[
  { "id": "uuid", "name": "موبایل", "createdAt": "..." },
  { "id": "uuid", "name": "لپ‌تاپ", "createdAt": "..." }
]
```

---

### Cart

The cart is **server-side** (PostgreSQL, tied to JWT user). Guest cart should be kept in localStorage and synced after login.

Cart **expires** if idle for **1 hour** (based on `updatedAt`). On expiry, `GET /cart` returns null.

#### `GET /cart`

```
Auth: JWT required
```

```jsonc
// Response — null if no active cart or expired
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "variantId": "uuid",
      "quantity": 2,
      "variant": {
        "id": "uuid",
        "sku": "BLK256-9A3F2E",
        "price": "59900000",
        "stock": 10,
        "reserved": 0,
        "attributes": { "color": "black", "storage": "256GB" },
        "imageIds": ["uuid1"]
      }
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `PUT /cart`

Replaces the **entire cart** in one shot. To add an item, GET current cart, add the item, PUT the full list.

```
Auth: JWT required
```

```jsonc
// Request
{
  "items": [
    { "variantId": "uuid", "quantity": 2 },
    { "variantId": "uuid", "quantity": 1 }
  ]
}

// Response — same shape as GET /cart
```

> To remove an item: PUT without it. To clear cart: `{ "items": [] }`.

---

## Pages to Build

### 1. `/products` — Product Listing

**Data fetching:** server component  
**Pattern:** `fetch('/products?page=X&limit=20&categoryId=Y')` on server, pass to client for interactions

#### Layout

```
┌────────────────────────────────────────────────────┐
│  [Header — logo + cart icon with item count badge] │
├────────────────────────────────────────────────────┤
│  Category filter chips (horizontal scroll on mobile)│
│  [همه] [موبایل] [لپ‌تاپ] [پوشاک] ...              │
├────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ card │ │ card │ │ card │ │ card │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ card │ │ card │ │ card │ │ card │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
├────────────────────────────────────────────────────┤
│            [← ۱  ۲  ۳  ۴  ۵ →]                   │
└────────────────────────────────────────────────────┘
```

**Grid:** 2 cols mobile → 3 cols md → 4 cols xl

#### Product Card

- Cover image (aspect-ratio: 4/3 or 1/1, object-cover). Show grey placeholder if coverUrl is null.
- Product name — 2-line clamp
- Category badge (shadcn Badge, subtle variant)
- Price range: show `از X تومان` using the lowest variant price. Format: `۵۹٬۹۰۰٬۰۰۰ تومان`. If no variants, don't show price.
- Subtle hover animation (scale + shadow)
- Entire card is a link → `/products/:id`

**Skeleton:** show 8 skeleton cards while loading (same grid, shimmer effect)

**Category filter:** client component — updates `categoryId` query param and resets to page 1. Active category has filled/primary style.

**Pagination:** shadcn Pagination component. URL-based (`?page=X`). Server component re-fetches on param change.

---

### 2. `/products/:id` — Product Detail

**Data fetching:** server component fetches `GET /products/:id`  
**Variant selector + cart logic:** client components

#### Layout

```
┌──────────────────────────┬────────────────────────┐
│                          │  iPhone 16 Pro         │
│   Image Gallery          │  موبایل                │
│   [main image]           │                        │
│                          │  رنگ                   │
│   [thumb][thumb][thumb]  │  ● مشکی  ○ سفید       │
│                          │                        │
│                          │  حافظه                 │
│                          │  ● ۲۵۶ گیگ  ○ ۵۱۲ گیگ │
│                          │                        │
│                          │  ۵۹٬۹۰۰٬۰۰۰ تومان     │
│                          │  ✓ موجود (۸ عدد)       │
│                          │                        │
│                          │  [افزودن به سبد خرید]  │
└──────────────────────────┴────────────────────────┘
│  توضیحات محصول                                    │
└──────────────────────────────────────────────────┘
```

**Mobile:** image on top, details below (stacked)

#### Image Gallery (client component)

- Main image: large, rounded corners, `object-contain` on white/light background
- Thumbnails: horizontal scroll row below main image
- Clicking thumbnail updates main image
- On variant change: fetch `GET /products/:id/variants/:variantId/images` → update gallery
- While fetching: show skeleton overlay on main image
- If no images: show product cover or a branded placeholder

#### Attribute / Variant Selector (client component)

Build a **selection UI** from variant attributes. Each unique attribute key becomes a row of toggle buttons.

**Algorithm:**
1. Extract all unique attribute keys from `variants[]` (e.g., `color`, `storage`)
2. For each key, extract unique values across all variants
3. Render a row of `Toggle` buttons per key
4. On each selection, filter available variants to determine:
   - Which values for the next attribute are still selectable
   - Which selected combination matches a real variant

```typescript
// Determine available variant from selections
const selected = { color: "black", storage: "256GB" }
const matchedVariant = variants.find(v =>
  Object.entries(selected).every(([k, val]) => v.attributes[k] === val)
)
```

**Visual states per option button:**
- `available` → default/outline style, clickable
- `selected` → primary/filled style
- `out-of-stock for this selection` → muted, strikethrough, still clickable (user can choose it, just show warning)

**Stock indicator** (shows after a variant is matched):
- `available > 0` → green dot + `موجود (X عدد)` — if X > 10 just say `موجود`
- `available === 0` → red dot + `ناموجود`

**Price** — update on variant match. Format in Persian numerals: use `toLocaleString('fa-IR')`. Show `—` if no variant matched yet.

#### Add to Cart (client component)

- Disabled if: no variant matched OR available === 0 OR user not logged in
- If user not logged in: button says `برای خرید وارد شوید` → redirect to login
- On click: GET current cart → merge item (increment qty if exists, add if new) → PUT updated cart
- Show loading spinner inside button during request
- On success: show toast "به سبد خرید اضافه شد" + update cart icon count in header
- On error (e.g., stock changed between page load and click): show toast with error message from API

**Quantity selector** (optional, before the button):
- Default: 1
- Max: `available` from matched variant
- `+` / `−` buttons

---

## Cart UX

Cart state lives in a client-side Zustand store (or Context). On app load:
1. If user is logged in → `GET /cart` → hydrate store
2. If no cart or null response → store is empty

**Cart icon in header:** badge showing total item count (`items.reduce((s, i) => s + i.quantity, 0)`). Animate on change.

**Cart sidebar** (shadcn Sheet, slides from right in RTL):
- List of items with variant name, attributes, quantity, price
- Remove item (PUT cart without that item)
- Checkout button → `/checkout` (not in scope, just the button)

---

## Formatting Helpers

```typescript
// Price — Persian numerals + تومان
export function formatPrice(price: string | number): string {
  return Number(price).toLocaleString('fa-IR') + ' تومان'
}

// Stock
export function available(variant: Variant): number {
  return variant.stock - variant.reserved
}

// Attribute display — map English keys to Persian if needed
const attrLabels: Record<string, string> = {
  color: 'رنگ',
  storage: 'حافظه',
  size: 'سایز',
  // add more as needed
}
```

---

## Key Rules

| Rule | Detail |
|------|--------|
| Server components | Products list page and product detail initial render must be server components |
| No layout shift | Reserve image space with aspect-ratio before image loads |
| presigned URLs | Never store `coverUrl` / image `url` in localStorage — they expire in 1h |
| RTL | `html dir="rtl"`, all shadcn components are RTL-compatible out of the box |
| Persian font | Load `Vazirmatn` for all text |
| Skeleton always | Show skeleton cards/lines for every async data, no blank states |
| Error boundaries | Each section should have its own error boundary with a retry button |
| Available stock | Always compute as `stock - reserved`, never use `stock` alone |
| Cart sync | Always GET current cart before PUT to avoid overwriting concurrent changes |
| 401 handling | On 401, clear token, redirect to `/login` with `?redirect=` current path |
