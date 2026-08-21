# Semantic HTML (SEO + Accessibility)

**Source:** https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML
**Also:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements
**Last synced:** 2026-08-20

## Core principle

Right element for right job. Search engines and screen readers both depend on semantic markup. `<div>` and `<span>` carry NO semantic meaning.

## Heading structure

- ONE `<h1>` per page (the page's primary topic)
- Logical hierarchy: `h1 > h2 > h3` — don't skip levels for style
- Google gives more importance to keywords in headings than body divs
- Screen readers use headings for navigation (table-of-contents)
- Never use `<span style="font-size:2em">` to look like a heading — kills semantics

## Landmark elements

```html
<header>
  <nav>...</nav>
</header>
<main>
  <article>
    <h1>Page title</h1>
    <section>...</section>
  </article>
  <aside>...</aside>
</main>
<footer>...</footer>
```

- `<header>` — top of page or section
- `<nav>` — primary/secondary navigation
- `<main>` — page's main content (ONE per page)
- `<article>` — self-contained content (blog post, product card)
- `<section>` — thematic grouping (usually with a heading)
- `<aside>` — tangentially related (sidebar, related products)
- `<footer>` — bottom of page or section

Screen readers announce landmarks; crawlers use them to parse content hierarchy.

## Link text

```html
<!-- Good -->
<a href="/whales">Find out more about whales</a>

<!-- Bad -->
<a href="/whales">click here</a>
<a href="/whales">read more</a>
```

- Descriptive anchor text is a ranking signal (topical relevance)
- Screen readers list all links; vague text is useless
- NEVER use `<a href="#" onclick>` — use `<button>` for actions
- `<a>` only for actual navigation to URLs

## Image alt text

```html
<!-- Meaningful, descriptive -->
<img src="rex.png" alt="Red Tyrannosaurus Rex standing on two legs with small arms and large teeth">

<!-- Decorative (background/icon with no semantic value) -->
<img src="divider.png" alt="">

<!-- Product image example -->
<img src="/prod/123.jpg" alt="Blue Nike Air Max 90 sneakers, side view">
```

- NEVER omit `alt` — missing attr causes screen readers to read filename
- Empty `alt=""` = decorative (explicitly ignored)
- Product images: describe what's SHOWN (model, color, angle) not brand fluff
- Alt text feeds Google Image Search + provides context to text crawler

## Form labels

```html
<div>
  <label for="email">Email address:</label>
  <input type="email" id="email" name="email">
</div>
```

- `<label for="ID">` associates label ↔ input
- Clicking label focuses input (larger target)
- Never rely on `placeholder` as label

## Buttons vs Links

- `<button>` — triggers action (submit, open modal, toggle)
- `<a href>` — navigates to URL

Never swap these. Screen readers announce them differently, and crawlers only follow `<a href>`.

## Source order

- CSS can reorder VISUAL layout (flex/grid)
- Screen readers + crawlers use DOM order
- Keep DOM order = reading order

## Tables

```html
<table>
  <caption>Q3 sales by region</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">EMEA</th>
      <td>$2.1M</td>
    </tr>
  </tbody>
</table>
```

- `<th scope="col|row">` for header cells
- `<caption>` describes the table
- Never use `<table>` for layout

## Language attribute

```html
<html lang="fa" dir="rtl">
<!-- OR -->
<html lang="en">
```

- Set on `<html>` — signals content language to browsers, crawlers, screen readers
- Use language switching inline: `<span lang="en">English phrase</span>` in Persian content
- `dir="rtl"` for Persian/Arabic/Hebrew

## Abbreviations

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

- Improves comprehension
- Screen readers can announce full form

## Plain language

- Expand abbreviations ("January" not "Jan" in prose)
- Avoid dashes for ranges — write "5 to 7" not "5–7"
- Screen readers may misread dashes and abbreviations

## Why this matters for SEO

Search crawlers parse semantic HTML to understand:
- Page topic (h1, article, main)
- Content sections (section, article)
- Navigation structure (nav, header, footer)
- Image content (alt)
- Relationships (label→input, th→td, caption→table)

Semantic HTML also correlates with accessibility, and accessibility correlates with Core Web Vitals + user engagement — all indirect ranking signals.
