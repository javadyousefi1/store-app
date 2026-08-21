# JavaScript SEO Basics

**Source:** https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
**Last synced:** 2026-08-20

## How Googlebot processes JavaScript

Three sequential phases:
1. **Crawling** — Googlebot fetches URL, checks `robots.txt`
2. **Rendering** — 200-status pages queue for headless Chromium
3. **Indexing** — Rendered HTML indexed, links extracted

All 200-status pages enter render queue regardless of JS presence. Non-200 may skip rendering.

## Critical rules

### HTTP status codes
- Meaningful codes: 404 for missing, 401 for auth-required
- Avoid soft 404 in SPAs — either:
  - Redirect to server-side 404 via JS, OR
  - Inject `<meta name="robots" content="noindex">` on error page

### URL structure
- **DO:** History API for client routing with real URLs (`/products`, `/services`)
- **DON'T:** Fragment routing (`#/products`) — Googlebot cannot reliably resolve fragments
- All navigable links must be `<a href="...">`

### Canonical URLs
- Set canonicals in original HTML when possible
- If injecting via JS: keep same value as HTML version
- Never change canonical via JS after initial render
- One canonical tag per page — never multiple

### Meta tags & robots
- `<title>` and meta description can be JS-modified
- Robots meta: careful — Google may SKIP rendering pages marked `noindex`
- Never try to REMOVE `noindex` via JS; it should not exist in original markup

### Caching
- Long-lived caching with content fingerprinting: `main.2bb85551.js`
- Rename files when content changes to bypass Googlebot cache

## Common issues → fixes

| Issue | Fix |
|-------|-----|
| Lazy-loaded images not discovered | Follow Google's lazy-loading guidelines; use `loading="lazy"` |
| JavaScript not executing | Use polyfills; ensure browser API compat |
| Infinite scroll content missed | Implement paginated crawlable links alongside |
| Web Components shadow DOM hidden | Use `<slot>` to expose light DOM content |

## Rendering strategy

- **SSR** — recommended for perf + crawler compat
- **CSR** — works with Googlebot but slower render queue
- **Pre-rendering / SSG** — optimal for search visibility

## Testing tools

- **URL Inspection Tool** — see exact rendered HTML Google sees
- **Rich Results Test** — validate structured data in rendered output
- **Search Console** — monitor crawl/index coverage

Check that rendered HTML contains: all critical content, discoverable `<a href>` links, injected JSON-LD, correct image `src`.

## Next.js / React specific

- Use SSG or SSR whenever possible
- CSR routes: ensure meaningful 404 for non-existent pages via `notFound()`
- Don't rely on JS-only meta tags for critical SEO
- Test dynamic routes in URL Inspection Tool BEFORE launch
- Inject structured data during server render, not client-side

## Do / Don't summary

**DO:**
- Meaningful HTTP status codes
- History API SPA routing
- Canonicals in HTML
- Test with Google tools before launch
- Semantic HTML for links

**DON'T:**
- Block JS resources in `robots.txt`
- Use fragments for routing
- Rely solely on JS for critical meta tags
- Create multiple/conflicting canonicals
- Ignore cache headers without content fingerprinting

**Key takeaway:** SSR remains superior for SEO. CSR works with proper status codes, URL structure, and validation.
