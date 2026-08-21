# Product Structured Data

**Source:** https://developers.google.com/search/docs/appearance/structured-data/product
**Also see:** https://developers.google.com/search/docs/appearance/structured-data/product-snippet
**Also see:** https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
**Last synced:** 2026-08-20

## Two variants of Product markup

- **Product snippets** — editorial/informational pages (no direct purchase). Supports pros/cons highlighting.
- **Merchant listings** — transactional pages where users can purchase. Supports shipping, returns, apparel sizing.

Implementing merchant-listing required properties makes you eligible for product snippets too.

## Required properties (merchant listing)

- `@type: Product`
- `name` — product name
- `image` — one or more high-quality URLs (Google recommends 16:9, 4:3, 1:1)
- `offers` with:
  - `@type: Offer`
  - `price` (number, no currency symbol) OR `priceSpecification`
  - `priceCurrency` (ISO 4217 code, e.g., `USD`, `EUR`, `IRR`)
  - `availability` — schema.org enum URL
  - `itemCondition` — schema.org enum URL

## Recommended properties

- `description` — plain text description
- `sku`, `gtin`, `mpn`, `brand`, `identifier_exists`
- `aggregateRating` with `ratingValue` and `reviewCount`
- `review` array
- `priceValidUntil` — ISO 8601 date; SERP may DROP price after this date
- `shippingDetails` — for shipping cost display
- `hasMerchantReturnPolicy` — for return info in SERP

## Availability enum values

Use full schema.org URL:
- `https://schema.org/InStock`
- `https://schema.org/OutOfStock`
- `https://schema.org/PreOrder`
- `https://schema.org/BackOrder`
- `https://schema.org/Discontinued`
- `https://schema.org/SoldOut`
- `https://schema.org/LimitedAvailability`

**Out-of-stock rule:** Never 404 the URL — keep the page, mark `availability: OutOfStock`.

## ItemCondition enum values

- `https://schema.org/NewCondition`
- `https://schema.org/UsedCondition`
- `https://schema.org/RefurbishedCondition`
- `https://schema.org/DamagedCondition`

## Canonical JSON-LD example

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Executive Anvil",
  "image": [
    "https://example.com/photos/1x1/photo.jpg",
    "https://example.com/photos/4x3/photo.jpg",
    "https://example.com/photos/16x9/photo.jpg"
  ],
  "description": "Sleeker than ACME's Classic Anvil...",
  "sku": "0446310786",
  "mpn": "925872",
  "brand": {
    "@type": "Brand",
    "name": "ACME"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.4",
    "reviewCount": "89"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/anvil",
    "priceCurrency": "USD",
    "price": "119.99",
    "priceValidUntil": "2026-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock"
  }
}
```

## Rules

- Only mark up products actually on the page — no hidden markup
- Structured data must match visible content (price, name, image, availability)
- For product variants: use `ProductGroup` + `hasVariant`
- Merchant Center feed + on-page JSON-LD together maximizes eligibility
- Never inject/change markup client-side after render (JS injection risk with rendering delays)

## Rich result enhancements available

- Star ratings
- Pros/cons callouts
- Free shipping badge
- Stock status
- Price-drop indicator (Google-computed)
- Return-policy summary
