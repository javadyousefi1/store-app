# Back-office API

Base URL: `http://localhost:3000`  
All protected endpoints require header: `Authorization: Bearer <token>`

---

## Auth

ورود فقط با شماره موبایل ایرانی (فرمت `09XXXXXXXXX`) و کد OTP انجام می‌شه.  
توکن JWT با اعتبار ۴۸ ساعت برگردانده می‌شه.

### POST `/api/getOtp`
ارسال کد OTP به شماره موبایل.  
محدودیت: حداکثر ۵ بار در ساعت.

```json
// Request
{ "phone": "09128989900" }

// Response 200
{ "message": "کد تأیید ارسال شد" }
```

---

### POST `/api/verifyOtp`
تأیید کد و دریافت توکن.  
اگه کاربر وجود نداشته باشه، اکانت جدید ساخته می‌شه.

```json
// Request
{ "phone": "09128989900", "otp": "123456" }

// Response 200
{
  "accessToken": "eyJ...",
  "isNew": false
}
```

---

### POST `/api/resendOtp`
ارسال مجدد کد. بین هر بار ۹۰ ثانیه cooldown.

```json
// Request
{ "phone": "09128989900" }

// Response 200
{ "message": "کد تأیید ارسال شد" }

// Response 409 — cooldown فعاله
{ "message": "لطفاً 67 ثانیه دیگر برای ارسال مجدد کد صبر کنید" }
```

---

## User

### GET `/user?page=1&limit=20` 🔒 Admin
لیست همه کاربران با pagination.

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "firstName": "علی",
      "lastName": "محمدی",
      "phone": "09128989900",
      "role": "user",
      "createdAt": "2026-06-09T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### PATCH `/user` 🔒
آپدیت نام و نام‌خانوادگی کاربر جاری.  
فقط `firstName` و `lastName` قابل تغییرن.

```json
// Request
{ "firstName": "علی", "lastName": "محمدی" }

// Response 200 — اطلاعات کاربر آپدیت‌شده
```

---

### DELETE `/user/:id` 🔒 Admin
حذف نرم (soft delete) کاربر. کاربر از لیست پنهان می‌شه ولی داده‌هاش باقی می‌مونه.

---

## Category

دسته‌بندی‌ها flat هستن (بدون زیرمجموعه).  
قبل از حذف، اگه محصول فعال داشته باشه خطا می‌ده.

### GET `/categories`
لیست همه دسته‌بندی‌های فعال (بدون pagination).

```json
// Response 200
[
  { "id": "uuid", "name": "موبایل", "createdAt": "..." }
]
```

---

### POST `/categories` 🔒 Admin

```json
// Request
{ "name": "لپ‌تاپ" }
```

---

### PATCH `/categories/:id` 🔒 Admin

```json
// Request
{ "name": "لپ‌تاپ و کامپیوتر" }
```

---

### DELETE `/categories/:id` 🔒 Admin
حذف نرم. اگه محصول فعال داشته باشه:

```json
// Response 409
{ "message": "Cannot delete category. It has 3 active product(s) assigned to it." }
```

---

## Attributes

جدول کمکی برای کنترل مقادیر مجاز variant. ساختار دو سطحیه:
- **Attribute** — اسم ویژگی (مثلاً `color`, `storage`)
- **Value** — مقادیر مجاز هر ویژگی (مثلاً `red`, `blue`, `256GB`)

قبل از اضافه کردن variant، باید attribute و value‌های موردنظر از قبل ثبت شده باشن.

### GET `/attributes` 🔒 Admin
لیست همه attribute‌ها به‌همراه value‌هاشون.

```json
// Response 200
[
  {
    "id": "uuid",
    "name": "color",
    "values": [
      { "id": "uuid", "value": "black" },
      { "id": "uuid", "value": "white" },
      { "id": "uuid", "value": "red" }
    ]
  },
  {
    "id": "uuid",
    "name": "storage",
    "values": [
      { "id": "uuid", "value": "128GB" },
      { "id": "uuid", "value": "256GB" }
    ]
  }
]
```

---

### POST `/attributes` 🔒 Admin
ساخت ویژگی جدید. اسم باید unique باشه.

```json
// Request
{ "name": "color" }

// Response 409 — اگه قبلاً وجود داشته باشه
{ "message": "Attribute \"color\" already exists" }
```

---

### DELETE `/attributes/:id` 🔒 Admin
حذف نرم attribute و تمام value‌هاش.

---

### POST `/attributes/:id/values` 🔒 Admin
اضافه کردن value به یه attribute. می‌شه چند بار زد برای value‌های مختلف.

```json
// Request
{ "value": "red" }

// Response 409 — اگه این value قبلاً برای این attribute وجود داشته باشه
{ "message": "Value \"red\" already exists for this attribute" }
```

---

### DELETE `/attributes/:id/values/:valueId` 🔒 Admin
حذف نرم یک value.

---

## Product

### GET `/products?page=1&limit=20&categoryId=uuid`
لیست محصولات با pagination. `categoryId` اختیاریه برای فیلتر.  
عکس کاور به‌صورت presigned URL توی `coverUrl` برمی‌گرده.

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 16 Pro",
      "description": "...",
      "categoryId": "uuid",
      "category": { "id": "uuid", "name": "موبایل" },
      "coverUrl": "http://minio:9000/store-media/...?X-Amz-Signature=..."
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### GET `/products/:id`
جزئیات یک محصول به‌همراه همه variant‌ها و عکس‌هاشون.

```json
// Response 200
{
  "id": "uuid",
  "name": "iPhone 16 Pro",
  "category": { "id": "uuid", "name": "موبایل" },
  "coverUrl": "http://...",
  "variants": [
    {
      "id": "uuid",
      "sku": "BLA256-A3F2C1",
      "price": "59900000",
      "stock": 10,
      "attributes": { "color": "black", "storage": "256GB" },
      "images": [
        { "id": "uuid", "order": 0, "media": { ... } }
      ]
    }
  ]
}
```

---

### POST `/products` 🔒 Admin

```json
// Request
{
  "categoryId": "uuid",
  "name": "iPhone 16 Pro",
  "description": "توضیحات محصول"
}
```

---

### PATCH `/products/:id` 🔒 Admin

```json
// Request — همه فیلدها optional
{
  "categoryId": "uuid",
  "name": "iPhone 16 Pro Max",
  "description": "..."
}
```

---

### DELETE `/products/:id` 🔒 Admin
حذف نرم.

---

### POST `/products/:id/cover` 🔒 Admin
آپلود عکس کاور محصول. اگه کاور قبلی داشته باشه، **از MinIO حذف می‌شه** و جایگزین می‌شه.

```
Content-Type: multipart/form-data
field name: file
max size: 1MB
formats: image/*
```

---

### DELETE `/products/:id/cover` 🔒 Admin
حذف کاور. فایل از MinIO **به‌صورت واقعی** پاک می‌شه.

---

## Product Variant

هر محصول می‌تونه چند variant داشته باشه (مثلاً رنگ و ظرفیت متفاوت).  
هر ترکیب `attributes` باید unique باشه.  
SKU اگه ارسال نشه، سیستم خودش generate می‌کنه.

### POST `/products/:productId/variants` 🔒 Admin

```json
// Request
{
  "sku": "IPH-16P-BLK-256",
  "price": 59900000,
  "stock": 10,
  "attributes": { "color": "black", "storage": "256GB" }
}
```

- `sku` اختیاریه، اگه نباشه auto-generate می‌شه
- مقادیر `attributes` باید در جدول `AttributeOption` ثبت شده باشن وگرنه `400` برمی‌گرده
- ترکیب تکراری `attributes` برای یه محصول `409` برمی‌گرده

---

### PATCH `/products/:productId/variants/:variantId` 🔒 Admin

```json
// Request — همه فیلدها optional
{
  "price": 64900000,
  "stock": 5,
  "attributes": { "color": "white", "storage": "256GB" }
}
```

---

### DELETE `/products/:productId/variants/:variantId` 🔒 Admin
حذف نرم.

---

## Variant Images

هر variant می‌تونه چند عکس داشته باشه.  
عکس‌ها با **presigned URL** (اعتبار ۱ ساعت) سرو می‌شن — لینک مستقیم نیست و باید هر بار از API گرفته بشه.

### GET `/products/:productId/variants/:variantId/images` 🔒
لیست عکس‌های variant مرتب‌شده بر اساس `order`.

```json
// Response 200
[
  {
    "id": "uuid",
    "order": 0,
    "media": {
      "id": "uuid",
      "originalName": "front.jpg",
      "mimeType": "image/jpeg",
      "size": 524288
    },
    "url": "http://minio:9000/store-media/products/.../...jpg?X-Amz-Signature=..."
  }
]
```

---

### POST `/products/:productId/variants/:variantId/images` 🔒 Admin
آپلود عکس جدید به variant.

```
Content-Type: multipart/form-data
field name: file
max size: 1MB
formats: image/*
```

---

### DELETE `/products/:productId/variants/:variantId/images/:imageId` 🔒 Admin
حذف عکس. فایل از MinIO **به‌صورت واقعی** پاک می‌شه.

---

## Response format

همه responseها این شکل دارن:

```json
// موفق
{ "statusCode": 200, "data": { ... }, "timestamp": "..." }

// خطا
{ "statusCode": 400, "error": "Bad Request", "message": "...", "timestamp": "...", "path": "..." }
```

## HTTP status codes

| Code | معنی |
|------|------|
| 400 | validation خطا / کد OTP اشتباه |
| 401 | توکن نداری یا منقضی شده |
| 403 | دسترسی نداری (نیاز به admin) |
| 404 | آیتم پیدا نشد |
| 409 | تکراری / conflict |
| 429 | rate limit |
| 503 | MinIO در دسترس نیست |
