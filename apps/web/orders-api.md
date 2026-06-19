# Orders & Payments API

Base URL: `http://localhost:3000`  
All endpoints require: `Authorization: Bearer <token>`

---

## Overview — Order Flow

```
Cart filled
    │
    ▼
POST /orders          ← cart resets, stock reserved
    │
    ▼
status: pending_payment
    │
    ├── user cancels → DELETE /orders/:id
    │       └── reservation released, status: cancelled
    │
    └── user uploads receipt → POST /orders/:id/receipt
            │
            ▼
        status: payment_uploaded
            │
            ├── admin confirms → PATCH /admin/orders/:id/confirm
            │       └── stock deducted, reservation released, status: confirmed
            │
            └── admin rejects → PATCH /admin/orders/:id/reject
                    └── reservation released, status: cancelled
```

---

## Stock Model

| Field      | Meaning                              |
|------------|--------------------------------------|
| `stock`    | Physical inventory                   |
| `reserved` | Held pending payment confirmation    |
| Available  | `stock - reserved`                   |

On **order create**: `reserved += quantity`  
On **confirm**: `stock -= quantity`, `reserved -= quantity`  
On **cancel / reject**: `reserved -= quantity` (stock unchanged)

---

## User Endpoints

### POST `/orders`

Place an order from the active cart. Cart is cleared immediately on success.

**Requires:** JWT (any role)

```json
// Request
{
  "firstName": "علی",
  "lastName": "محمدی",
  "address": "تهران، خیابان ولیعصر، پلاک ۱۲",
  "postalCode": "1234567890",
  "note": "لطفاً زودتر ارسال شود"   // optional
}
```

```json
// Response 201
{
  "id": "uuid",
  "userId": "uuid",
  "status": "pending_payment",
  "firstName": "علی",
  "lastName": "محمدی",
  "address": "تهران، خیابان ولیعصر، پلاک ۱۲",
  "postalCode": "1234567890",
  "note": "لطفاً زودتر ارسال شود",
  "totalAmount": "2980000.00",
  "items": [
    {
      "id": "uuid",
      "variantId": "uuid",
      "productName": "کفش آدیداس",
      "variantSku": "BLK-9A3F2E",
      "variantAttributes": { "رنگ": "مشکی", "سایز": "42" },
      "price": "1490000.00",
      "quantity": 2,
      "createdAt": "2026-06-10T09:00:00.000Z"
    }
  ],
  "payment": {
    "id": "uuid",
    "method": "card_to_card",
    "status": "pending",
    "receiptKey": null,
    "adminNote": null,
    "createdAt": "2026-06-10T09:00:00.000Z",
    "updatedAt": "2026-06-10T09:00:00.000Z"
  },
  "createdAt": "2026-06-10T09:00:00.000Z",
  "updatedAt": "2026-06-10T09:00:00.000Z"
}
```

**Errors:**

| Status | When |
|--------|------|
| 400    | Cart is empty |
| 400    | `Insufficient stock for: BLK-9A3F2E (available: 1), ...` |

---

### GET `/orders`

List the authenticated user's orders, newest first.

**Query params:**

| Param   | Default | Notes       |
|---------|---------|-------------|
| `page`  | 1       |             |
| `limit` | 20      | max 100     |

```json
// Response 200
{
  "data": [ { ...order } ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### GET `/orders/:id`

Get a single order. Only returns the authenticated user's own order.

```json
// Response 200 — same shape as POST /orders response
```

**Errors:** `404` if not found or belongs to another user.

---

### DELETE `/orders/:id`

Cancel a `pending_payment` order. Reserved stock is released.

**Errors:**

| Status | When |
|--------|------|
| 400    | Order is not in `pending_payment` status |
| 404    | Order not found |

```json
// Response 200
{}
```

---

### POST `/orders/:id/receipt`

Upload the card-to-card receipt image.  
Order must be in `pending_payment` status.  
Moves order to `payment_uploaded`.

**Content-Type:** `multipart/form-data`  
**Field name:** `file`  
**Constraints:** image only, max 1 MB

```json
// Response 201
{
  "id": "uuid",
  "orderId": "uuid",
  "method": "card_to_card",
  "status": "uploaded",
  "receiptKey": "orders/uuid/receipts/uuid.jpg",
  "adminNote": null,
  "createdAt": "2026-06-10T09:05:00.000Z",
  "updatedAt": "2026-06-10T09:05:00.000Z"
}
```

**Errors:**

| Status | When |
|--------|------|
| 400    | Order is not in `pending_payment` status |
| 400    | File missing, too large, or not an image |
| 404    | Order not found |

---

## Admin Endpoints

> All admin endpoints require role `admin`.

---

### GET `/admin/orders`

List all orders across all users. Filter by status.

**Query params:**

| Param    | Default | Notes                                                               |
|----------|---------|---------------------------------------------------------------------|
| `status` | —       | `pending_payment` \| `payment_uploaded` \| `confirmed` \| `cancelled` |
| `page`   | 1       |                                                                     |
| `limit`  | 20      | max 100                                                             |

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "status": "payment_uploaded",
      "firstName": "علی",
      "lastName": "محمدی",
      "address": "تهران، خیابان ولیعصر، پلاک ۱۲",
      "postalCode": "1234567890",
      "note": null,
      "totalAmount": "2980000.00",
      "items": [ { ...orderItem } ],
      "payment": {
        "id": "uuid",
        "method": "card_to_card",
        "status": "uploaded",
        "receiptKey": "orders/uuid/receipts/uuid.jpg",
        "adminNote": null,
        "createdAt": "...",
        "updatedAt": "..."
      },
      "createdAt": "2026-06-10T09:00:00.000Z",
      "updatedAt": "2026-06-10T09:05:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### GET `/admin/orders/:id`

Get full order detail. If a receipt has been uploaded, `receiptUrl` is a presigned GET URL (valid 1 hour).

```json
// Response 200
{
  "id": "uuid",
  "userId": "uuid",
  "status": "payment_uploaded",
  "firstName": "علی",
  "lastName": "محمدی",
  "address": "تهران، خیابان ولیعصر، پلاک ۱۲",
  "postalCode": "1234567890",
  "note": null,
  "totalAmount": "2980000.00",
  "items": [
    {
      "id": "uuid",
      "variantId": "uuid",
      "productName": "کفش آدیداس",
      "variantSku": "BLK-9A3F2E",
      "variantAttributes": { "رنگ": "مشکی", "سایز": "42" },
      "price": "1490000.00",
      "quantity": 2,
      "createdAt": "2026-06-10T09:00:00.000Z"
    }
  ],
  "payment": {
    "id": "uuid",
    "method": "card_to_card",
    "status": "uploaded",
    "receiptKey": "orders/uuid/receipts/uuid.jpg",
    "adminNote": null,
    "createdAt": "2026-06-10T09:00:00.000Z",
    "updatedAt": "2026-06-10T09:05:00.000Z"
  },
  "receiptUrl": "https://minio.../orders/uuid/receipts/uuid.jpg?X-Amz-Expires=3600&...",
  "createdAt": "2026-06-10T09:00:00.000Z",
  "updatedAt": "2026-06-10T09:05:00.000Z"
}
```

> `receiptUrl` is only present when `payment.status` is `uploaded`, `confirmed`, or `rejected`.

**Errors:** `404` if not found.

---

### PATCH `/admin/orders/:id/confirm`

Confirm payment. Deducts `quantity` from `stock` and releases `reserved` for each item.

**Order must be in:** `payment_uploaded`

```json
// Request body — none

// Response 200
{
  "id": "uuid",
  "status": "confirmed",
  "payment": { "status": "confirmed", ... },
  ...
}
```

**Errors:**

| Status | When |
|--------|------|
| 400    | Order is not in `payment_uploaded` status |
| 404    | Order not found |

---

### PATCH `/admin/orders/:id/reject`

Reject payment. Releases `reserved` stock (physical stock unchanged). Order status → `cancelled`.

**Order must be in:** `payment_uploaded`

```json
// Request body (optional)
{
  "adminNote": "مبلغ واریزی مغایرت دارد"
}

// Response 200
{
  "id": "uuid",
  "status": "cancelled",
  "payment": {
    "status": "rejected",
    "adminNote": "مبلغ واریزی مغایرت دارد",
    ...
  },
  ...
}
```

**Errors:**

| Status | When |
|--------|------|
| 400    | Order is not in `payment_uploaded` status |
| 404    | Order not found |

---

## Order Status Reference

| Status             | Description                                    | Next states                       |
|--------------------|------------------------------------------------|-----------------------------------|
| `pending_payment`  | Order placed, waiting for receipt upload       | `payment_uploaded`, `cancelled`   |
| `payment_uploaded` | Receipt uploaded, waiting for admin review     | `confirmed`, `cancelled`          |
| `confirmed`        | Payment confirmed, stock deducted              | —                                 |
| `cancelled`        | Cancelled by user or rejected by admin         | —                                 |

## Payment Status Reference

| Status      | Description                     |
|-------------|---------------------------------|
| `pending`   | No receipt uploaded yet         |
| `uploaded`  | Receipt uploaded, under review  |
| `confirmed` | Admin confirmed                 |
| `rejected`  | Admin rejected                  |

## OrderItem Fields (snapshot — never changes)

| Field               | Type    | Description                     |
|---------------------|---------|---------------------------------|
| `productName`       | string  | Product name at order time      |
| `variantSku`        | string  | SKU at order time               |
| `variantAttributes` | object  | Attributes at order time        |
| `price`             | decimal | Unit price at order time        |
| `quantity`          | int     | Quantity ordered                |
| `variantId`         | uuid    | Reference (nullable if deleted) |
