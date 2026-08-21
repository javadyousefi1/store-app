# Category Cover Upload — Frontend Integration

Cover images for a category are uploaded **directly from the browser to MinIO** using a presigned URL. The API only mints the URL and records the result. Everything goes through **one endpoint** with an `action` discriminator.

```
POST /categories/:id/cover
Authorization: Bearer <admin token>
Content-Type: application/json
```

The same endpoint covers presign, confirm, and remove — pick one via `action`.

---

## Flow (upload or replace)

```
 1. POST /categories/:id/cover   { action: "presign", mimeType }
       → { mediaKey, uploadUrl, expiresIn, requiredHeaders }

 2. PUT  <uploadUrl>             (the file bytes)
         headers: Content-Type: <mimeType>

 3. POST /categories/:id/cover   { action: "confirm", mediaKey }
       → updated category with coverUrl
```

Replacing an existing cover is **the same flow** — no extra call. `confirm` automatically deletes the previous cover from MinIO.

To remove without replacing:

```
POST /categories/:id/cover   { action: "remove" }   → { removed: true }
```

---

## 1. Presign

**Request**

```json
{ "action": "presign", "mimeType": "image/jpeg" }
```

Allowed `mimeType`: `image/jpeg`, `image/png`, `image/webp`.

**Response — 201**

```json
{
  "mediaKey":       "categories/3f0a.../cover/8e1b....jpg",
  "uploadUrl":      "http://minio:9000/store-media/categories/3f0a.../cover/8e1b....jpg?X-Amz-...",
  "expiresIn":      600,
  "requiredHeaders": { "Content-Type": "image/jpeg" }
}
```

- `uploadUrl` is valid for `expiresIn` seconds (10 minutes).
- Keep `mediaKey` — you need it for step 3.

---

## 2. PUT the file to `uploadUrl`

Browser example:

```ts
await fetch(uploadUrl, {
  method: 'PUT',
  headers: requiredHeaders,         // { 'Content-Type': 'image/jpeg' }
  body: file,                       // the raw File / Blob — no FormData
});
```

Important:
- Use `PUT`, not `POST`.
- Send the raw file as body. **Do not** wrap it in `FormData`.
- Send `Content-Type` exactly as returned in `requiredHeaders` — anything else and confirm will reject the file.
- Do **not** send the `Authorization` header on this request (it goes straight to MinIO).

A successful upload returns `200 OK` from MinIO with an empty body.

---

## 3. Confirm

**Request**

```json
{ "action": "confirm", "mediaKey": "categories/3f0a.../cover/8e1b....jpg" }
```

Optional `originalName` (string, ≤ 255) is stored on the media record for display only.

**Response — 201** — the updated category:

```json
{
  "id":        "3f0a...",
  "name":      "Electronics",
  "coverId":   "9d2c...",
  "coverUrl":  "http://minio:9000/store-media/categories/3f0a.../cover/8e1b....jpg?X-Amz-...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

The server `stat`s the object on MinIO and rejects it if:
- it isn't there yet (`422`) — you didn't PUT, or PUT failed.
- its mime type isn't on the allow-list (`400`).
- it's larger than **5 MB** (`400`).

If rejected, the object is deleted from MinIO automatically.

---

## 4. Remove

```json
{ "action": "remove" }
```

Response: `{ "removed": true }`. Safe to call when no cover exists — it returns the same shape.

---

## Reading covers

`GET /categories` returns each category with a `coverUrl` field when a cover exists. The URL is a presigned GET valid for ~1 hour — cache it, but expect to refetch the category list (or rebuild it) past that.

```json
[
  { "id": "...", "name": "Electronics", "coverUrl": "https://..." },
  { "id": "...", "name": "Books"       /* no coverUrl */ }
]
```

---

## Error reference

| Status | When                                                              |
|-------:|-------------------------------------------------------------------|
| 400    | `mimeType` not in allow-list / `mediaKey` doesn't match category / uploaded file too large or wrong type |
| 401    | Missing or invalid bearer token                                    |
| 403    | Token is not admin                                                 |
| 404    | Category id not found                                              |
| 422    | `confirm` called but object isn't on MinIO yet                     |

---

## Minimal end-to-end example

```ts
async function setCategoryCover(categoryId: string, file: File) {
  const presign = await api.post(`/categories/${categoryId}/cover`, {
    action:   'presign',
    mimeType: file.type,
  });

  await fetch(presign.uploadUrl, {
    method:  'PUT',
    headers: presign.requiredHeaders,
    body:    file,
  });

  return api.post(`/categories/${categoryId}/cover`, {
    action:       'confirm',
    mediaKey:     presign.mediaKey,
    originalName: file.name,
  });
}
```

---

# Favorites — Frontend Integration

Per-user favorite products. All endpoints require a normal user bearer token. There is **no FK** between favorites and products; a deleted product simply disappears from the list on the next read.

## Endpoints

| Method | Path                       | Purpose                                  |
|--------|----------------------------|------------------------------------------|
| GET    | `/favorites`               | List my favorites, newest first.         |
| POST   | `/favorites`               | Add a product to my favorites.           |
| DELETE | `/favorites/:productId`    | Remove a product from my favorites.      |

All require: `Authorization: Bearer <user token>`.

---

## 1. Add to favorites

```
POST /favorites
{ "productId": "d290f1ee-6c54-4b01-90e6-d701748f0851" }
```

Response — **201**:

```json
{
  "id":        "5a1f...",
  "userId":    "...",
  "productId": "d290f1ee-...",
  "createdAt": "2026-06-26T13:00:00.000Z"
}
```

Idempotent — calling it again with the same `productId` returns the existing favorite, no error. The API does **not** validate that the product exists; you can store the id even if the product was deleted (it just won't show up in the list).

---

## 2. List favorites

```
GET /favorites
```

Response — **200**:

```json
[
  {
    "favoriteId": "5a1f...",
    "productId":  "d290f1ee-...",
    "product": {
      "id":       "d290f1ee-...",
      "name":     "iPhone 16 Pro",
      "coverUrl": "http://minio:9000/store-media/...?X-Amz-..."
    },
    "createdAt": "2026-06-26T13:00:00.000Z"
  }
]
```

Notes:
- Items are sorted **newest first**.
- Favorites whose product was deleted are **silently skipped** — the list contains only items you can still render.
- `product.coverUrl` is presigned (~1h). If `null`, the product has no cover.
- The count of items in the response can therefore be **smaller than** the number of `POST /favorites` calls the user has made — that's expected.

---

## 3. Remove from favorites

```
DELETE /favorites/d290f1ee-6c54-4b01-90e6-d701748f0851
```

Response — **200**:

```json
{ "removed": true }
```

Returns `{ "removed": false }` if the product wasn't favorited. Either way it's safe to call optimistically from the UI.

---

## Error reference

| Status | When                                              |
|-------:|---------------------------------------------------|
| 400    | `productId` is not a valid UUID                   |
| 401    | Missing or invalid bearer token                   |

---

## Minimal end-to-end example

```ts
// toggle button
async function toggleFavorite(productId: string, isFavorite: boolean) {
  if (isFavorite) {
    await api.delete(`/favorites/${productId}`);
  } else {
    await api.post('/favorites', { productId });
  }
}

// favorites page
const items = await api.get('/favorites');
// items[i].product.{id,name,coverUrl}
```
