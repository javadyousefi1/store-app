# Pagination & Faceted Navigation (E-commerce)

**Source:** https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
**Last synced:** 2026-08-20

## Pagination — hard rules

- **Each paginated page needs SELF-referencing canonical** (not page 1)
  - `?page=2` canonical → `?page=2`, NOT `?page=1`
- **`rel="prev"` / `rel="next"` are DEPRECATED** — Google no longer uses them
- **Each paginated page needs a unique URL** — `?page=2` (query param) not `#page2` (fragment)
- Google IGNORES fragment identifiers for pagination
- Include `<a href>` to next page on each page for crawl discoverability
- OK to reuse identical `<title>` / meta description across paginated pages — Google recognizes sequences

## Faceted navigation — the problem

Filters/facets generate near-infinite URL combinations:
- `/products?color=red&size=lg&sort=price&brand=nike`
- Each combination is a "new URL" to crawlers
- Wastes crawl budget, creates duplicate content

## Faceted navigation — strategy

**For useful, indexable filter combos (e.g., "red nike shoes"):**
- Let Google crawl + index
- Add proper `<title>` / description reflecting the filter
- Self-referencing canonical
- Include in sitemap if high-value

**For low-value filter combos (sort variants, deep filter stacks):**
- Add `<meta name="robots" content="noindex, follow">` — Google won't index but WILL follow links
- OR block via `robots.txt` — saves crawl budget but Google can't see `noindex`

**For pure UX filters not intended for SEO:**
- Load via POST or fragment (`#filter=...`) — invisible to crawlers
- OR block parameters in `robots.txt`

## robots.txt patterns for parameters

```
# Block sort variants (duplicate content)
Disallow: /*?*sort=
Disallow: /*?*order=

# Block tracking that shouldn't create index entries
Disallow: /*?utm_
Disallow: /*?fbclid=

# Block session IDs
Disallow: /*?sid=

# Allow pagination
Allow: /*?page=
```

## noindex approach

```html
<!-- On non-canonical filter/sort variants -->
<meta name="robots" content="noindex, follow">
```

`follow` matters: Google still traverses links to discover indexable content.

## Best practice: hybrid

- Use canonicals to consolidate near-duplicates
- Use `noindex, follow` for filter variants you want crawled-but-not-indexed
- Use `robots.txt` to block parameter combinations you don't want crawled at all
- Include ONLY canonical URLs in sitemap
- Serve `<a href="?page=N">` links for pagination discoverability
- Provide sitemap or Merchant Center feed as backup discovery mechanism

## Common mistakes

1. Canonicalizing all paginated pages to page 1 (loses ranking for deep products)
2. Using `rel="prev"/"next"` and expecting Google to use them
3. Using fragments for pagination (invisible to Google)
4. `robots.txt` blocking pages that have `noindex` (Google can't see the noindex → may still index from external links)
5. Not blocking sort/filter parameter combos → wasted crawl budget
