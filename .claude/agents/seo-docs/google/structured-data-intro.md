# Structured Data / JSON-LD Intro

**Source:** https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
**Last synced:** 2026-08-20

## Recommended format: JSON-LD

Google's preferred format. Not interleaved with visible content, easier for nested data, allows dynamic injection via JS.

## Placement rules

- `<script type="application/ld+json">` tag
- Place in `<head>` or `<body>`
- ONLY on pages where the information is visible to users
- NEVER create blank pages just to hold structured data
- NEVER mark up invisible or inaccurate information

## Vocabulary

- Use **schema.org** vocabulary
- Google Search Central docs are AUTHORITATIVE (not schema.org alone)
- Google supports JSON-LD, Microdata, RDFa equally
- `data-vocabulary.org` markup is NO LONGER eligible for rich results

## Quality requirements

- Include ALL required properties for rich result eligibility
- Fewer complete + accurate recommended properties > many incomplete/wrong ones
- `sameAs` and other optional properties may enable future features

## Testing

| Tool | Purpose |
|------|---------|
| Rich Results Test | Validate markup + preview features during dev |
| Rich Result Status Reports (Search Console) | Monitor validity post-deployment |
| URL Inspection Tool | Confirm Google found your structured data |

## Do's

- Use JSON-LD for easiest scale implementation
- Validate before AND after deployment
- Include all required properties for the content type
- Data MUST match visible page content
- Test with Rich Results Test
- Monitor Search Console after launch
- Measure impact over 2–3 months

## Don'ts

- Don't create pages just to hold structured data
- Don't mark up invisible/unverifiable info
- Don't rely solely on schema.org docs for Google requirements
- Don't use data-vocabulary.org
- Don't skip validation before deployment

## Implementation flow

1. Choose feature from Google's structured data gallery
2. Implement JSON-LD on relevant pages
3. Validate with Rich Results Test
4. Deploy + verify via URL Inspection Tool
5. Monitor Performance reports 2–3 months
6. Compare metrics vs non-structured baseline
