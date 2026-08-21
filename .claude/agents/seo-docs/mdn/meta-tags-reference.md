# MDN: Meta Tags Reference (SEO-relevant)

**Source:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name
**Also:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
**Last synced:** 2026-08-20

## Critical for SEO

### `description`
Page summary; used as SERP snippet fallback.
```html
<meta name="description" content="Brief 150–160 char summary of the page.">
```

### `robots`
Crawl/index directives.
```html
<meta name="robots" content="index, follow">
<meta name="robots" content="noindex, nofollow">
```
See `robots-meta-and-xrobotstag.md` for full directive list.

### `googlebot` / `googlebot-news`
Google-specific, overrides `robots` for that crawler.
```html
<meta name="googlebot" content="noindex">
```

### `viewport`
Mandatory for mobile SEO / mobile-first indexing.
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Useful for UX & indirect SEO

### `referrer`
Controls what's sent in the HTTP `Referer` header. Affects analytics and outbound tracking.
```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

Values: `no-referrer`, `origin`, `no-referrer-when-downgrade`, `origin-when-cross-origin`, `strict-origin`, `strict-origin-when-cross-origin`, `same-origin`, `unsafe-url`.

### `theme-color`
Toolbar color on mobile browsers. Can include media query.
```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f0f0f" media="(prefers-color-scheme: dark)">
```

### `color-scheme`
Signals dark/light mode support.
```html
<meta name="color-scheme" content="light dark">
```

### `application-name`
For PWA / app-like sites.

### `author`
Author name — useful for E-E-A-T signals when combined with author page bylines.

## Ignored / low-value (skip)

### `keywords`
Google ignores this. Waste of space.

### `generator`
Software that created the page. No SEO value.

## Open Graph (Facebook / social) — separate spec

Not `name=` but `property=`:
```html
<meta property="og:title" content="Page title">
<meta property="og:description" content="Summary">
<meta property="og:image" content="https://example.com/og-image.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/page">
<meta property="og:locale" content="en_US">
```

## Twitter Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@handle">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://example.com/twitter-image.png">
```

## Charset & compatibility

```html
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
```

## Rules

- ALL meta tags MUST be inside `<head>`
- One `<title>` per page (semantic requirement, not just SEO)
- Every indexable page needs a unique `title` + `description`
- `description` 150–160 chars — Google may truncate longer
- OG `og:image` recommended 1200×630 (Facebook, LinkedIn scale down)
- Twitter `summary_large_image` needs 2:1 aspect ratio image
