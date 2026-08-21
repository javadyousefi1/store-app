# BreadcrumbList Structured Data

**Source:** https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
**Last synced:** 2026-08-20

## Required properties

- `itemListElement` — array of `ListItem`
- Each `ListItem` needs:
  - `position` — integer, starts at 1, increments
  - `name` — display text
  - `item` — URL (OPTIONAL for the LAST item, since it's the current page)

## Minimum

At least 2 `ListItem` entries.

## Canonical JSON-LD example

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Books",
      "item": "https://example.com/books"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Science Fiction",
      "item": "https://example.com/books/sciencefiction"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Award Winners"
    }
  ]
}
```

## Rules

- Position must start at 1
- Sequential incrementing positions
- URLs must be absolute
- Represent a TYPICAL user path, not necessarily URL structure
- Not required to include top-level path (homepage)
- Last item URL optional — Google uses containing page URL

## E-commerce pattern

For category pages: `Home > Category > Subcategory` (mark last item)
For product pages: `Home > Category > Subcategory > Product Name`

## Notes

- Available on desktop across all Google Search regions
- Validate via Rich Results Test before deploy
- Multiple breadcrumb trails allowed on one page (different paths to same content)
