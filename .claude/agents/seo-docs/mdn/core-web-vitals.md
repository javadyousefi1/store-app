# Core Web Vitals (web.dev / MDN)

**Source:** https://web.dev/articles/vitals
**MDN performance:** https://developer.mozilla.org/en-US/docs/Web/Performance
**Last synced:** 2026-08-20

## Thresholds (75th percentile of real users, mobile + desktop separately)

### LCP — Largest Contentful Paint
Time to render the largest visible content element (usually hero image or headline).

| Score | Threshold |
|-------|-----------|
| Good | ≤ 2.5s |
| Needs improvement | 2.5s – 4.0s |
| Poor | > 4.0s |

**Common causes of bad LCP:**
- Slow server response (high TTFB)
- Render-blocking JS/CSS
- Unoptimized hero image
- Client-side rendering delays

**Optimizations:**
- Server-side render the LCP element
- `<link rel="preload">` for the LCP image
- `fetchpriority="high"` on the LCP `<img>`
- Next.js: `priority` prop on `<Image>` for above-fold hero
- Preconnect to critical origins
- Compress + serve modern formats (AVIF/WebP)
- Reduce render-blocking resources (defer non-critical CSS/JS)
- CDN + edge caching for HTML

### INP — Interaction to Next Paint
Latency between user interaction and next visual update. Replaced FID in March 2024.

| Score | Threshold |
|-------|-----------|
| Good | ≤ 200ms |
| Needs improvement | 200ms – 500ms |
| Poor | > 500ms |

**Common causes:**
- Long-running JS on main thread
- Heavy hydration cost (React SPAs)
- Large event handlers
- Excessive React re-renders

**Optimizations:**
- Break long tasks with `scheduler.yield()` or `setTimeout`
- Code-split; defer non-critical JS
- Use `useTransition` / `startTransition` in React
- Debounce/throttle expensive handlers
- Lazy hydration for below-fold interactive components
- Web Workers for heavy computation
- Reduce third-party script impact

### CLS — Cumulative Layout Shift
Sum of unexpected layout shift scores during page lifetime.

| Score | Threshold |
|-------|-----------|
| Good | ≤ 0.1 |
| Needs improvement | 0.1 – 0.25 |
| Poor | > 0.25 |

**Common causes:**
- Images without dimensions
- Ads/embeds without reserved space
- Web fonts causing FOIT/FOUT
- Dynamically injected content above existing content
- CSS animations of layout properties

**Optimizations:**
- ALWAYS set `width` + `height` on `<img>` and `<video>` (or `aspect-ratio` CSS)
- Next.js `<Image>` reserves space automatically when using `width/height` or `fill`
- `font-display: optional` or preload critical fonts
- Reserve space for ads/embeds with min-height
- Use CSS `transform` (compositor) instead of `top`/`left` for animations
- Never inject content above existing content post-load

## Lab tools

- **Lighthouse** (Chrome DevTools) — synthetic run, single load
- **PageSpeed Insights** — Lighthouse + field CrUX data
- **Chrome DevTools Performance panel** — flame graph

## Field tools

- **Chrome UX Report (CrUX)** — real user data, feeds PSI
- **Search Console → Core Web Vitals report** — aggregated CrUX by URL group
- **`web-vitals` npm library** — self-hosted RUM

## Key distinction

Lab metrics (Lighthouse) ≠ Field metrics (CrUX). Google ranks on FIELD data.

- Lab: reproducible, no real users, misses INP entirely (uses TBT as proxy)
- Field: what real users experience — what actually matters for ranking

## Ranking impact

Core Web Vitals is a MINOR ranking factor and applies at page-experience level. But: poor CWV = high bounce = engagement drop, which compounds indirectly.
