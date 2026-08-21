# HTTP Status Codes for SEO

**Source:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
**Google's take:** https://developers.google.com/search/docs/crawling-indexing/http-network-errors
**Last synced:** 2026-08-20

## Summary table

| Status | Meaning | Passes authority | Crawl impact | Use for |
|--------|---------|------------------|--------------|---------|
| 200 | OK | N/A | Normal indexing | All indexable content |
| 301 | Moved Permanently | ✓ Yes | Follows | Permanent moves |
| 302 | Found | ✗ No | Keeps original | Temporary only |
| 307 | Temporary Redirect | ✗ No | Keeps original | Temporary, preserves method |
| 308 | Permanent Redirect | ✓ Yes | Follows | Permanent, preserves method |
| 404 | Not Found | N/A | Retries periodically | Might return |
| 410 | Gone | N/A | Removes faster | Permanently deleted |
| 429 | Too Many Requests | N/A | Reduces crawl rate | Avoid for Googlebot |
| 5xx | Server Errors | N/A | Retries later | Fix immediately |

## Redirect specifics

**301 vs 308:** Both permanent, both pass authority. Difference: 308 preserves HTTP method (POST stays POST). For GET-heavy sites, 301 is fine.

**302 vs 307:** Both temporary. 307 preserves method. Neither passes full authority.

**Rules:**
- Avoid redirect chains — direct 301 to final destination
- Keep chains under 5 hops (Googlebot may abandon)
- Never redirect all 404s to homepage — creates "soft 404" signal, hurts trust
- Redirect old URL → best-matching new URL (not homepage) after site changes

## 404 vs 410 for deletion

**404** — "not found, may return"
- Google keeps URL in queue, retries periodically
- Fine for occasional missing pages

**410** — "gone permanently"
- Google removes from index FASTER
- Saves crawl budget
- Use for: discontinued products (unless URL will return), deleted user content, old campaign URLs

**E-commerce rule:** Out-of-stock products should NOT 404/410 — keep the URL with `Product` schema `availability: OutOfStock`. Only 410 if the product is discontinued forever.

## Soft 404 (avoid)

Occurs when:
- Page returns 200 but content says "not found"
- Empty search result pages returning 200
- Thin content pages
- 404s that redirect to homepage

Google flags these in Search Console → Pages report. Fix by returning proper 404/410 status.

## 429 & rate limiting

Googlebot respects `Retry-After` header. If crawlers hit 429 frequently:
- Google reduces crawl rate
- New content indexes slower
- May de-index existing content in extreme cases

**Fix:** exempt known crawler user-agents from rate limits, or configure generous limits.

## 5xx handling

- Transient: Google retries. OK for brief incidents.
- Sustained: Google reduces crawl rate, may de-index.

**503 Service Unavailable + `Retry-After`** is the CORRECT way to signal planned maintenance:
```
HTTP/1.1 503 Service Unavailable
Retry-After: 3600
```

Never return 200 with a "maintenance" page — that's a soft 404 pattern.

## Next.js status code patterns

```ts
// Correct 404 in app router
import { notFound } from 'next/navigation'
if (!product) notFound() // renders app/not-found.tsx with 404

// Permanent redirect (301) in middleware or next.config
{ source: '/old', destination: '/new', permanent: true }

// Temporary redirect (307)
{ source: '/promo', destination: '/summer', permanent: false }

// 410 Gone — needs custom response
return new Response(null, { status: 410 })
```

## Diagnostic commands

```bash
# Check status for a URL
curl -sI https://example.com/page | head -1

# Check redirect chain
curl -sILA "Googlebot" https://example.com/page

# Simulate Googlebot
curl -sIA "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" URL
```
