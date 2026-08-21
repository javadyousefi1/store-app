# SEO Knowledge Base — Index

Local reference for the `seo-expert` subagent. Cite these files by path when making recommendations.
All docs synced 2026-08-20. When in doubt about currency, `WebFetch` the source URL at the top of each file.

## Google Search Central

- [Search Essentials](google/search-essentials.md) — technical requirements, spam policies, key best practices
- [SEO Starter Guide](google/seo-starter-guide.md) — titles, descriptions, URLs, headings, alt text, internal links
- [JavaScript SEO](google/javascript-seo.md) — how Googlebot renders JS, SSR/CSR trade-offs, common fixes
- [Structured Data (intro)](google/structured-data-intro.md) — JSON-LD rules, placement, validation
- [Product Schema](google/product-structured-data.md) — required props, availability/condition enums, JSON-LD example
- [BreadcrumbList Schema](google/breadcrumb-schema.md) — position numbering, JSON-LD example
- [Canonicalization](google/canonicalization.md) — how Google picks canonicals, declaration methods, mistakes
- [Sitemaps](google/sitemaps.md) — XML format, 50MB/50k limits, sitemap index, tag rules
- [robots.txt](google/robots-txt.md) — syntax, e-commerce example, common mistakes
- [Robots meta & X-Robots-Tag](google/robots-meta-and-xrobotstag.md) — noindex/nofollow directives, HTTP header, data-nosnippet
- [Pagination & Facets](google/pagination-and-facets.md) — self-canonical rule, rel=prev/next deprecation, filter strategy
- [hreflang / International](google/hreflang.md) — three methods, Persian/RTL specifics, bidirectional rule
- [Helpful Content & E-E-A-T](google/helpful-content-eeat.md) — Experience/Expertise/Authority/Trust, YMYL, who/how/why

## MDN & web.dev

- [Meta tags reference](mdn/meta-tags-reference.md) — description, robots, viewport, OG, Twitter Card
- [HTTP status codes for SEO](mdn/http-status-codes-seo.md) — 301/302/307/308, 404 vs 410, 429, 5xx handling
- [Semantic HTML](mdn/semantic-html.md) — headings, landmarks, alt, forms, `lang`/`dir`
- [Core Web Vitals](mdn/core-web-vitals.md) — LCP/INP/CLS thresholds, causes, fixes

## How to use this knowledge base

1. **For every SEO recommendation, cite the relevant doc file** — e.g., "per `seo-docs/google/product-structured-data.md`, `availability` requires the full schema.org URL"
2. If a doc doesn't cover your question, `WebFetch` the source URL from the top of the closest doc
3. If Google or MDN has updated their doc, refresh the local copy — check `Last synced` line
4. For rules NOT covered here (e.g., specific Rich Result feature specs), fetch:
   - `https://developers.google.com/search/docs/appearance/structured-data/<feature>`
   - `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/<element>`
