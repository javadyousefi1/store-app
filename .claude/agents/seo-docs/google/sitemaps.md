# XML Sitemaps

**Source:** https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
**Build guide:** https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
**Last synced:** 2026-08-20

## When you need one

- Large sites (500+ pages)
- New sites with few external backlinks
- Rich media content (videos, images, news)
- Content not well-linked internally

Skip only if: small site, comprehensively linked, no specialized content.

## Hard limits

- **50 MB** uncompressed max per sitemap file
- **50,000 URLs** max per sitemap file
- If exceeded, use a **sitemap index** file referencing multiple sitemaps

## Format requirements

- UTF-8 encoding
- Absolute URLs only (`https://example.com/page` not `/page`)
- URLs must be from the SAME host as the sitemap location
- Escape special characters: `&` → `&amp;`, `<` → `&lt;`, etc.

## Minimal valid XML sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2026-08-20</lastmod>
  </url>
  <url>
    <loc>https://example.com/page2</loc>
    <lastmod>2026-08-19</lastmod>
  </url>
</urlset>
```

## Sitemap index format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-products.xml</loc>
    <lastmod>2026-08-20</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-categories.xml</loc>
    <lastmod>2026-08-20</lastmod>
  </sitemap>
</sitemapindex>
```

## Tags

- **`<loc>`** (required) — the URL
- **`<lastmod>`** (recommended) — W3C Datetime format; must be accurate or Google ignores it
- **`<changefreq>`** — Google ignores this
- **`<priority>`** — Google ignores this

Only `lastmod` matters to Google. Set it to the ACTUAL last content modification date.

## What to include

- All canonical URLs you want indexed
- 200-status pages only
- URLs matching the sitemap's host + protocol

## What to EXCLUDE

- Non-canonical duplicates
- `noindex` pages
- Redirected URLs (3xx)
- Broken URLs (4xx, 5xx)
- URLs blocked by `robots.txt`
- Session-ID/tracking-param URLs
- Login-required or paywalled pages

## Submission

- Reference in `robots.txt`: `Sitemap: https://example.com/sitemap.xml`
- Submit via Google Search Console (Sitemaps report)
- Ping via `https://www.google.com/ping?sitemap=URL` (deprecated but still works)

## Extensions

- **Image sitemap** — for image indexing (limits: 1,000 images per URL entry)
- **Video sitemap** — running time, rating, age
- **News sitemap** — for Google News (48-hour window)
- **hreflang** — via `xhtml:link` tags in URL entries

## Next.js note

Use `app/sitemap.ts` (or `sitemap.xml/route.ts`) to generate dynamically. For >50k URLs, use `sitemap.ts` returning array split by `generateSitemaps()`.
