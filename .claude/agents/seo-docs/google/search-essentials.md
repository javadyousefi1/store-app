# Google Search Essentials

**Source:** https://developers.google.com/search/docs/essentials
**Last synced:** 2026-08-20

## Technical requirements

- Pages must return HTTP 200 for successful content
- Googlebot must be able to access and crawl pages (no blocking via `robots.txt`)
- Do NOT block critical resources — CSS, JavaScript, images — from crawlers
- Links must be crawlable (`<a href="...">`, not JS-only handlers) so Google can discover other pages
- Use indexable file types (HTML, PDF, images, video)
- URL structure must be logical and descriptive
- Mobile-first indexing: pages must render correctly on mobile

## Metadata & structure

- Descriptive `<title>` and main heading required on every indexable page
- Every `<img>` needs meaningful `alt` text
- Link text must be descriptive (never "click here")
- Use structured data where applicable

## Spam policies — never do

**Content manipulation:**
- No cloaking or deceptive redirects
- No keyword stuffing or unnatural keyword placement
- No doorway pages designed solely for ranking
- No hidden text/links intended to deceive crawlers

**Link schemes:**
- No paid links passing PageRank
- No link exchanges purely for rankings
- No footer link networks / link farms
- No automated link generation

**UX violations:**
- No intrusive interstitials blocking content
- No deceptive navigation or misleading UI
- No malware / unwanted software distribution
- No social engineering (phishing)

**Technical abuse:**
- No automated queries against Google Search
- No serving different content to users vs. crawlers (cloaking)
- User-generated content must be moderated for spam

## Key best practices

- People-first content: helpful, reliable, focused on user value
- Use language your target audience actually searches for
- Prominent placement of search terms in titles, headings, descriptive body text
- Clear, crawlable site architecture
- Descriptive URLs reflecting content hierarchy
- Proper canonicalization for duplicate content
- 301 redirects when URLs change
- `noindex` only when appropriate
- Follow Core Web Vitals / page experience guidelines
- Monitor site via Search Console

## Key principle

Meeting requirements does NOT guarantee indexing or ranking — Google determines eligibility separately based on quality and relevance signals. Focus on genuine user value.
