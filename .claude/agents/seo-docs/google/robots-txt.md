# robots.txt

**Source:** https://developers.google.com/search/docs/crawling-indexing/robots/intro
**Syntax reference:** https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
**Last synced:** 2026-08-20

## What robots.txt does (and doesn't)

- **Does:** manage crawler traffic — tells crawlers which URLs they CAN access
- **Does NOT:** hide pages from search results (blocked pages can still be indexed if linked from elsewhere — they may appear without snippet)
- **Does NOT:** provide security (respectable crawlers obey; malicious ones don't)

**For de-indexing use `noindex`, NOT `robots.txt` disallow.** Disallowed pages Google cannot crawl → cannot see the `noindex` → may still index from external links.

## Location

- MUST be at site root: `https://example.com/robots.txt`
- One file per (protocol, host, port) combination
- UTF-8 encoded

## Syntax

- **`User-agent:`** — target crawler (`*` = all, `Googlebot`, `Googlebot-Image`, etc.)
- **`Disallow:`** — path to block
- **`Allow:`** — path to allow (overrides more general Disallow)
- **`Sitemap:`** — absolute URL to sitemap (can appear multiple times)
- **`#`** — comment

## Pattern matching

- `*` — matches any sequence of characters
- `$` — end-of-URL anchor
- `/path/` — matches paths starting with `/path/`
- Rules are case-sensitive

Longest matching rule wins for Allow vs Disallow conflicts.

## Practical e-commerce example

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /account/
Disallow: /cart
Disallow: /checkout
Disallow: /api/
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /search?
Disallow: /*.pdf$

# Never block resources the page NEEDS to render
Allow: /_next/static/
Allow: /images/
Allow: /*.css$
Allow: /*.js$

Sitemap: https://example.com/sitemap.xml
```

## Common mistakes

1. **Blocking CSS/JS/images** — prevents Google from rendering pages properly, hurts rankings
2. **Using `robots.txt` for de-indexing** — use `noindex` meta or `X-Robots-Tag` header instead
3. **Assuming security** — non-standard crawlers ignore it
4. **Mixing conflicting rules** without understanding longest-match wins
5. **Forgetting `Sitemap:` directive**
6. **Blocking `?utm_*` tracking params** — usually you want these crawlable + canonicalized

## Key limits

- Google reads first 500 KiB; rest is ignored
- Rules unsupported by all crawlers — Googlebot is the reference

## Next.js note

Use `app/robots.ts`:
```ts
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```
