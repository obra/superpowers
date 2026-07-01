---
name: frontend-design
description: Use when designing UI components, building layouts, writing CSS, implementing responsive design, or making accessibility decisions in frontend projects
---

# Frontend Design

## Overview

Frontend design spans visual hierarchy, component architecture, responsive layout, and accessibility. **Core principle:** Design for the user's actual context — device, ability, and intent — not just the happy-path desktop view.

## When to Use

- Building or refactoring UI components
- Writing CSS/styling logic (utility-first, CSS-in-JS, vanilla)
- Making layout decisions (flexbox vs grid, spacing, breakpoints)
- Ensuring keyboard navigation and screen reader compatibility
- Choosing between design-system components vs custom elements
- Debugging visual regressions or unexpected layout behavior

## Component Design

**Prefer composition over configuration:**
```tsx
// ❌ Monolithic - hard to extend
<Card title="..." body="..." footer="..." variant="outlined" />

// ✅ Composable - flexible
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>...</Card.Footer>
</Card>
```

**Prop discipline:** Accept `className`/`style` overrides on every visible element. Never hard-code colors or spacing that callers can't override.

## Layout Patterns

| Use case | Tool |
|----------|------|
| One-dimensional flow | Flexbox |
| Two-dimensional grid | CSS Grid |
| Full-page structure | Grid (outer) + Flex (inner) |
| Equal-width columns | `grid-template-columns: repeat(N, 1fr)` |
| Sticky sidebar | `position: sticky; top: 0; height: fit-content` |
| Centered content | `display: grid; place-items: center` |

**Spacing:** Use a consistent scale (4px base: 4, 8, 12, 16, 24, 32, 48, 64). Never use arbitrary pixel values.

## Responsive Design

Mobile-first — write base styles for small screens, layer on `min-width` breakpoints:

```css
.card { padding: 1rem; }

@media (min-width: 768px) {
  .card { padding: 1.5rem; }
}
```

**Common breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

Prefer fluid sizing over fixed breakpoints where possible:
```css
font-size: clamp(1rem, 2.5vw, 1.5rem);
gap: clamp(1rem, 3vw, 2rem);
```

## Accessibility (a11y)

**Non-negotiable minimums:**
- All interactive elements reachable and operable via keyboard (`Tab`, `Enter`, `Space`, arrow keys)
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (WCAG AA)
- Every image has `alt` — empty (`alt=""`) for decorative, descriptive for informational
- Form inputs have associated `<label>` elements (via `for`/`id` or wrapping)
- Focus ring never hidden without an alternative (`outline: none` without `:focus-visible` replacement is a bug)

**ARIA — use sparingly:**
```tsx
// ✅ Native HTML has built-in semantics — prefer these
<button>, <nav>, <main>, <article>, <header>, <footer>

// ✅ ARIA only when native elements can't do the job
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
```

**Live regions for dynamic content:**
```html
<div aria-live="polite" aria-atomic="true">
  <!-- Status messages updated via JS -->
</div>
```

## Typography

```css
/* Readable body text */
body {
  font-size: 1rem;        /* 16px base */
  line-height: 1.5;       /* 1.5× for body, 1.2× for headings */
  max-width: 65ch;        /* ~65 characters per line */
}
```

Heading hierarchy must be sequential (`h1` → `h2` → `h3`). Never skip levels for visual effect — use CSS instead.

## Color

- Define colors as design tokens/CSS custom properties, not inline values
- Always check contrast on both light and dark backgrounds
- Never convey information by color alone (add icon, text, or pattern)

```css
:root {
  --color-brand: #2563eb;
  --color-brand-hover: #1d4ed8;
  --color-text: #111827;
  --color-text-muted: #6b7280;
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `display: none` to hide from sighted users | Use `visibility: hidden` or `opacity: 0` to keep in accessibility tree when needed |
| Fixed `height` on text containers | Use `min-height`; let content expand |
| `100vw` causing horizontal scroll | Use `100%` or `min(100vw, ...)` to avoid scrollbar offset |
| Removing focus outline globally | Replace with `:focus-visible` custom styles |
| Nesting interactive elements (`<a>` inside `<button>`) | Invalid HTML — choose one |
| Z-index arms race (z-index: 9999) | Use stacking contexts intentionally; document z-index scale |
| Media queries in JavaScript | Use CSS custom properties + `matchMedia` sparingly; prefer CSS |
