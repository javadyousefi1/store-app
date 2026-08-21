# Canonicalization

**Source:** https://developers.google.com/search/docs/crawling-indexing/canonicalization
**Consolidation guide:** https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
**Last synced:** 2026-08-20

## What it is

Selection of a representative URL among duplicates/near-duplicates. Google clusters similar pages and picks the "most complete and useful" as canonical.

## Common causes of duplicate content

- Regional variants (US vs UK)
- Device variants (mobile vs desktop)
- HTTP vs HTTPS
- Sorting/filtering URLs
- Session IDs, tracking params
- Accidentally exposed demo/staging sites

## How Google chooses

Signals used:
- HTTPS vs HTTP status (HTTPS preferred)
- Redirect chains
- Sitemap inclusion
- `rel="canonical"` link annotations
- Internal linking patterns
- URL cleanliness

**Critical:** Declaring canonical is a HINT, not a rule. Google may pick differently.

## How to declare canonicals

**Best combined signal — use all of these together:**

1. **`<link rel="canonical" href="ABSOLUTE_URL" />`** in `<head>`
2. **301 redirect** from non-canonical → canonical
3. **Sitemap** — include only canonical URLs
4. **HTTP header** — `Link: <URL>; rel="canonical"` (for PDFs, non-HTML)
5. **Consistent internal linking** to canonical version

## Hard rules

- Canonical URL MUST be absolute (include protocol + domain)
- ONE canonical `<link>` per page
- Self-referencing canonicals are recommended on canonical pages themselves
- Canonical target must return 200 (not redirect, not 404)
- Canonical target must not be blocked by `robots.txt` or `noindex`
- Language variants are NOT duplicates if body content differs — use `hreflang` instead

## Language variants

Different language versions are only duplicates when primary content is in the same language. Pages with translated header/footer but identical body ARE duplicates. Use `hreflang` for genuine language variants.

## Search behavior

- Google directs users to canonical in SERP
- Exception: mobile device may be shown mobile URL even if desktop is canonical
- Non-canonicals crawled less frequently (crawl budget saved)
- Canonical page used as PRIMARY source for content quality signals

## Common mistakes

- Relative URLs in canonical (`/product` instead of `https://site.com/product`)
- Multiple `<link rel="canonical">` per page
- Canonical pointing to a 404 or `noindex` page
- Canonical pointing to a URL blocked in `robots.txt`
- Canonical pointing across domains without cross-domain justification
- Canonicalizing pages with SUBSTANTIALLY different content (not duplicates)
- Canonicalizing paginated pages incorrectly (each page should be self-canonical, NOT canonicalize page 2/3/4 → page 1)
