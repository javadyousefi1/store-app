# Robots Meta Tag & X-Robots-Tag

**Source:** https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
**Last synced:** 2026-08-20

## Indexing directives

- `noindex` — do not include in SERP
- `nofollow` — do not follow links on this page (for PageRank; individual links can still use `rel="nofollow"`)
- `none` — equivalent to `noindex, nofollow`
- `noimageindex` — do not index images on this page

## Snippet & preview controls

- `nosnippet` — no text snippet in SERP (static image thumbnail may still show)
- `max-snippet:[number]` — cap snippet length in characters (`0` = none, `-1` = Google decides)
- `max-image-preview:[none|standard|large]` — control image preview size
- `max-video-preview:[number]` — max seconds of video preview

## Time-based

- `unavailable_after:[date]` — remove from SERP after date. Formats: RFC 822, RFC 850, or ISO 8601
  - Example: `unavailable_after: 2026-12-31T23:59:59+00:00`

## Special

- `indexifembedded` — allow indexing when embedded via iframe on another site even if `noindex`
- `notranslate` — do not offer translation in SERP

## Deprecated (do nothing)

- `noarchive`
- `nocache`
- `nositelinkssearchbox`

## Meta tag placement (HTML pages)

```html
<meta name="robots" content="noindex, nofollow">
<meta name="robots" content="max-snippet:150, max-image-preview:large">

<!-- Google-specific -->
<meta name="googlebot" content="noindex">
<meta name="googlebot-news" content="noindex">
```

## X-Robots-Tag (HTTP header) — for non-HTML resources

```
X-Robots-Tag: noindex, nofollow
X-Robots-Tag: googlebot: noindex
```

**Apache** (block PDFs from index):
```apache
<Files ~ "\.pdf$">
  Header set X-Robots-Tag "noindex, nofollow"
</Files>
```

**Nginx** (block image indexing):
```nginx
location ~* \.(png|jpe?g|gif)$ {
  add_header X-Robots-Tag "noindex";
}
```

## Combining rules

- Multiple `<meta>` tags allowed
- Directives can be comma-separated
- Most restrictive wins on conflict (`nosnippet` overrides `max-snippet:50`)
- Rules for different bots additive (`robots` + `googlebot` combine)

## data-nosnippet attribute (granular)

Exclude specific text from snippets:
```html
<p>This appears in snippets, <span data-nosnippet>but this section does not</span>.</p>
```

Valid on `span`, `div`, `section`. Boolean — any value ignored, just presence counts.

## CRITICAL gotcha

**Robots meta / X-Robots-Tag only work if Googlebot can CRAWL the page.**

If URL is blocked by `robots.txt`, Googlebot never sees the `noindex` → the URL may STILL appear in SERP (from external links, without snippet).

**To de-index reliably:** allow crawling + add `noindex`. Once de-indexed, THEN you can block in `robots.txt`.

## Case & parsing

- Directive names + HTTP header values are case-INsensitive
- Whitespace tolerated around commas

## Next.js Metadata API

```ts
export const metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```
