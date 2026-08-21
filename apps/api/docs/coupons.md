# Coupons — Frontend Integration

تخفیف درصدی با سقف، در سطح **یک محصول** یا **یک دسته‌بندی**. هر کاربر فقط **یک بار** می‌تواند از هر کد استفاده کند. کد حذف نمی‌شود؛ ادمین فقط `isActive` را تاگل می‌کند یا ظرفیت/درصد/سقف را تغییر می‌دهد.

> **همه‌ی مبالغ بر حسب تومان است.**

---

## ۱. Storefront — استعلام کد روی سبد فعلی کاربر

از این برای نشان دادن «اگر این کد رو بزنی، چقدر کم میشه» قبل از ثبت سفارش استفاده کن. مصرف نمی‌شود.

```
POST /coupons/quote
Authorization: Bearer <user token>
Content-Type: application/json

{ "code": "SUMMER25" }
```

### پاسخ — کد معتبر (`201`)

```json
{
  "valid": true,
  "code": "SUMMER25",
  "percentage": 20,
  "maxDiscountAmount": 100000,
  "subtotal": 850000,
  "discountAmount": 100000,
  "total": 750000,
  "eligibleVariantIds": ["uuid-...", "uuid-..."]
}
```

- `subtotal` = جمع کل سبد قبل از تخفیف (تومان).
- `discountAmount` = مقدار کم‌شده (تومان). دقیقاً `min(maxDiscountAmount, percentage% × مجموع آیتم‌های مشمول)`.
- `total` = `subtotal - discountAmount`.
- `eligibleVariantIds` = شناسه‌ی واریانت‌هایی از سبد که مشمول کد بودند. مفید برای هایلایت در UI.

### پاسخ — کد نامعتبر (`201`)

```json
{ "valid": false, "reason": "هیچ کالای مشمول این کد در سبد نیست" }
```

دلایل ممکن:
| `reason`                                       | معنی                                       |
|------------------------------------------------|--------------------------------------------|
| `کد تخفیف پیدا نشد`                            | کد در سیستم وجود ندارد                     |
| `کد تخفیف غیرفعال است`                         | ادمین کد را غیرفعال کرده                   |
| `ظرفیت کد تخفیف به اتمام رسیده است`             | `usedCount >= quantity`                    |
| `این کد قبلاً توسط شما استفاده شده است`          | همین کاربر یک بار قبلاً مصرف کرده          |
| `سبد خرید خالی است`                            | کاربر آیتمی در سبد ندارد                   |
| `هیچ کالای مشمول این کد در سبد نیست`            | اسکوپ کد روی آیتم‌های فعلی منطبق نیست       |

پاسخ همیشه `201` است؛ تفاوت با `valid: true/false` مشخص می‌شود، نه با HTTP status. (همان قراردادِ سایر «quote»های فروشگاه.)

---

## ۲. ثبت سفارش با کد تخفیف

به همان `POST /orders` که الان داری، فیلد اختیاری `couponCode` اضافه شده:

```
POST /orders
Authorization: Bearer <user token>

{
  "firstName":    "علی",
  "lastName":     "محمدی",
  "address":      "...",
  "postalCode":   "1234567890",
  "deliveryType": "in_person",
  "paymentMethod":"card_to_card",
  "note":         "...",
  "couponCode":   "SUMMER25"        // اختیاری
}
```

### رفتار سرور

- `couponCode` دوباره **سمت سرور** اعتبارسنجی می‌شود — اعتماد به جواب قبلی `/quote` کافی نیست. اگر بین quote و ثبت سفارش، ظرفیت تمام شده یا کد غیرفعال شده باشد، سفارش با `400` رد می‌شود و چیزی ذخیره نمی‌شود.
- در همان تراکنش: `usedCount` به‌صورت اتمیک افزایش می‌یابد، رکورد در `coupon_redemptions` ثبت می‌شود، اسنپ‌شات کامل روی سفارش نوشته می‌شود.

### کدهای خطای مرتبط با کوپن

| Status | شرح                                          |
|-------:|-----------------------------------------------|
| 400    | کد نامعتبر / غیرفعال / مشمول هیچ آیتمی نیست  |
| 409    | همزمان با کاربر دیگر مصرف شد و ظرفیت تمام شد |

سایر خطاهای `POST /orders` (موجودی، سبد خالی و ...) همان قبلی.

### شکل پاسخ سفارش با تخفیف

فیلدهای **اضافه‌شده** به آبجکت سفارش:

```json
{
  "id": "...",
  "subtotalAmount": 850000,
  "discountAmount": 100000,
  "totalAmount":    750000,
  "couponId":       "uuid-...",
  "couponSnapshot": {
    "id": "uuid-...",
    "code": "SUMMER25",
    "percentage": 20,
    "maxDiscountAmount": 100000,
    "scope": { "type": "product", "id": "uuid-..." },
    "eligibleItemIds": ["variant-uuid-...", "variant-uuid-..."],
    "computedDiscountAmount": 100000
  },
  "items": [ /* بدون تغییر */ ],
  ...
}
```

اگر سفارش بدون کوپن باشد: `discountAmount: 0`, `couponId: null`, `couponSnapshot: null`، و `subtotalAmount == totalAmount`.

> `couponSnapshot` اسنپ‌شات کامل و **ثابت** کوپن در لحظه‌ی ثبت سفارش است. حتی اگر بعداً ادمین درصد یا سقف کد را تغییر بدهد، تاریخچه‌ی سفارش دست‌نخورده می‌ماند. برای نمایش رسید/تاریخچه از همین فیلد استفاده کن، نه از منبع جداگانه.

---

## ۳. Back-office — Admin endpoints

همه نیاز به توکن ادمین دارند: `Authorization: Bearer <admin token>`.

### ۳-۱. ساخت کد

```
POST /admin/coupons

{
  "code":              "SUMMER25",
  "percentage":        20,
  "maxDiscountAmount": 100000,
  "quantity":          100,
  "scopeType":         "product",        // یا "category"
  "scopeId":           "uuid-...",
  "isActive":          true               // اختیاری، پیش‌فرض true
}
```

- `code` به upper-case نرمالایز می‌شود و باید **یکتا** باشد.
- `scopeId` باید به یک محصول (وقتی `scopeType=product`) یا دسته (وقتی `scopeType=category`) موجود اشاره کند، در غیر این‌صورت `404`.
- پاسخ `201`: شیء کوپن کامل (با `id`, `usedCount: 0`, ...).
- `409` اگر کد تکراری باشد.

### ۳-۲. لیست کدها

```
GET /admin/coupons?page=1&limit=20&isActive=true
```

پاسخ:

```json
{
  "data": [ /* Coupon[] */ ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### ۳-۳. جزئیات یک کد

```
GET /admin/coupons/:id
```

پاسخ: شیء کوپن کامل شامل `usedCount` فعلی.

### ۳-۴. ویرایش

```
PATCH /admin/coupons/:id

{
  "isActive":          false,             // فقط همینا قابل ویرایش‌اند
  "quantity":          200,
  "percentage":        25,
  "maxDiscountAmount": 150000
}
```

- همه فیلدها اختیاری‌اند؛ هرکدوم رو خواستی بفرست.
- `code`, `scopeType`, `scopeId` **قابل تغییر نیستند** — اگر اشتباه ساخته شده، یه کد جدید بساز و قدیمی رو `isActive=false` کن.
- `quantity` نمی‌تواند کمتر از `usedCount` فعلی بشود (`400`).
- تغییر `percentage` یا `maxDiscountAmount` فقط روی سفارش‌های **آینده** اثر می‌گذارد؛ سفارش‌های قبلی اسنپ‌شات خودشان را نگه می‌دارند.

### ۳-۵. حذف؟ ندارد.

برای از کار انداختن یک کد، `PATCH /admin/coupons/:id { "isActive": false }` بفرست.

---

## ۴. منطق محاسبه (برای UI)

```ts
const eligibleLines = cart.filter(line =>
  coupon.scopeType === 'product'
    ? line.productId === coupon.scopeId
    : line.categoryId === coupon.scopeId,
);

const eligibleBase  = sum(eligibleLines, l => l.price * l.quantity);
const rawDiscount   = Math.floor(eligibleBase * coupon.percentage / 100);
const discount      = Math.min(rawDiscount, coupon.maxDiscountAmount);
const subtotal      = sum(cart, l => l.price * l.quantity);
const total         = subtotal - discount;
```

دقیقاً همین فرمول سمت سرور هم اجرا می‌شود؛ اگر UI نتیجه‌ی متفاوت نشان داد، سمت سرور برنده است.

---

## ۵. مثال انتها به انتها

```ts
// قبل از ثبت سفارش: نمایش پیش‌نمایش تخفیف
const preview = await api.post('/coupons/quote', { code });
if (preview.valid) {
  showDiscount(preview.discountAmount, preview.total);
} else {
  showError(preview.reason);
}

// ثبت سفارش با همون کد
const order = await api.post('/orders', {
  ...shippingAndPayment,
  couponCode: code,                  // اختیاری
});
// order.totalAmount, order.discountAmount, order.couponSnapshot
```
