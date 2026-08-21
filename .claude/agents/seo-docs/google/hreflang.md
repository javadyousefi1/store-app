# hreflang / International SEO

**Source:** https://developers.google.com/search/docs/specialty/international/localized-versions
**Last synced:** 2026-08-20

## Three implementation methods (pick ONE)

### 1. HTML link tags (`<head>`)
```html
<link rel="alternate" hreflang="en" href="https://en.example.com/page" />
<link rel="alternate" hreflang="de" href="https://de.example.com/page" />
<link rel="alternate" hreflang="de-ch" href="https://de-ch.example.com/page" />
<link rel="alternate" hreflang="fa" href="https://example.com/fa/page" />
<link rel="alternate" hreflang="fa-IR" href="https://example.com/fa-ir/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

### 2. HTTP Link header (best for non-HTML like PDFs)
```
Link: <https://en.example.com/page>; rel="alternate"; hreflang="en",
      <https://de.example.com/page>; rel="alternate"; hreflang="de"
```

### 3. XML sitemap (`xhtml:link` children)
```xml
<url>
  <loc>https://en.example.com/page</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://en.example.com/page"/>
  <xhtml:link rel="alternate" hreflang="fa" href="https://example.com/fa/page"/>
</url>
```

**Do NOT combine multiple methods** — offers no benefit, complicates maintenance.

## Hard rules

- **Self-referencing required** — every page must reference itself + all variants
- **Bidirectional required** — if EN links to FA, FA MUST link back to EN, or Google may ignore all annotations
- **Absolute URLs only** (include protocol)
- **Valid codes only**:
  - Language: ISO 639-1 (`en`, `fa`, `de`, `ar`)
  - Region: ISO 3166-1 Alpha 2 (`US`, `IR`, `CH`, `AF`)
  - Script: ISO 15924 (`Hans`, `Hant`) — optional
- Format: `language[-Script][-REGION]` (language MUST come first)

## Common mistakes

1. Missing bidirectional links (DE→EN without EN→DE)
2. Region code alone: `be` (should be `nl-BE` or `fr-BE`)
3. Invalid codes: `EU`, `UN`, `UK` (use `GB`)
4. Wrong order: `us-en` instead of `en-US`
5. Missing self-reference

## x-default

Reserved value for unmatched languages — usually the language selector or auto-redirect homepage:
```html
<link rel="alternate" href="https://example.com/" hreflang="x-default" />
```

## Persian / Farsi specifics

- Use `fa` for language-only
- Use `fa-IR` for Iran, `fa-AF` for Afghanistan (Dari)
- Set `<html lang="fa" dir="rtl">` in layout
- URLs can be Persian-encoded (`/محصولات/`) — Google handles UTF-8 URLs, but ASCII slugs are safer for sharing/backlinks

## Notes

- Google does NOT use `hreflang` or `<html lang>` to detect content language — it uses algorithmic analysis
- URLs need NOT share a domain (subdomains, subdirs, ccTLDs all work)
- For multiple regional English variants (en-IE, en-CA, en-AU), provide generic `en` fallback for unspecified users
- Hreflang is a HINT — Google may still pick differently
