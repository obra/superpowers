# Tailwind CSS v4 Reference

_Version: 4.x — Last updated: April 2026. If this stamp is >12 months old or a v5 release exists, fetch https://tailwindcss.com/docs before scaffolding._

**Why this file exists:** Training data is biased toward Tailwind v3 patterns. Reading this file before any Tailwind work overrides that bias with verified v4 patterns.

---

## Quick Version Detection

Check the project before writing any code:

| Signal | Version |
|---|---|
| `tailwind.config.js` exists | v3 |
| `@tailwind base;` in CSS | v3 |
| `tailwindcss: "^3"` in package.json | v3 |
| `@import "tailwindcss"` in CSS | v4 |
| `@tailwindcss/vite` in package.json | v4 |
| `@tailwindcss/postcss` in package.json | v4 |
| `tailwindcss: "^4"` in package.json | v4 |

If v3 is detected in an existing project: use v3 patterns. Do not silently upgrade. Ask user if they want to upgrade first.

---

## Installation

### Vite (recommended for new projects)

```bash
npm create vite@latest my-project
cd my-project
npm install tailwindcss @tailwindcss/vite
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

**src/style.css (or app.css — whatever your CSS entry is):**
```css
@import "tailwindcss";
```

Done. No `tailwind.config.js`. No PostCSS config. No content array. No autoprefixer.

### PostCSS (non-Vite projects)

```bash
npm install tailwindcss @tailwindcss/postcss
```

**postcss.config.js:**
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**CSS entry:**
```css
@import "tailwindcss";
```

### CLI (standalone, no bundler)

```bash
npm install @tailwindcss/cli
npx @tailwindcss/cli -i input.css -o output.css --watch
```

### React + Vite (full example)

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install tailwindcss @tailwindcss/vite
```

Add to `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'
// add tailwindcss() to plugins array
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

---

## Configuration: @theme (replaces tailwind.config.js)

All customization happens in CSS. There is no `tailwind.config.js` for v4 projects.

```css
@import "tailwindcss";

@theme {
  /* Colors — automatically creates bg-*, text-*, border-*, ring-* utilities */
  --color-brand: oklch(0.72 0.19 260);
  --color-brand-light: oklch(0.85 0.12 260);
  --color-surface: oklch(0.98 0 0);

  /* Fonts — creates font-* utilities */
  --font-display: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Breakpoints */
  --breakpoint-3xl: 120rem;

  /* Border radius */
  --radius-card: 1rem;

  /* Custom animation */
  --animate-fade-in: fade-in 0.3s ease-out;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
```

### Extending vs. resetting

```css
/* Extend defaults — add your tokens alongside built-in ones */
@theme {
  --color-brand: oklch(0.72 0.19 260);
}

/* Reset an entire namespace — removes all built-in colors */
@theme {
  --color-*: initial;
  --color-white: #fff;
  --color-black: #000;
  --color-brand: oklch(0.72 0.19 260);
}

/* Full custom theme — removes everything */
@theme {
  --*: initial;
  --spacing: 4px;
  --font-body: Inter, sans-serif;
  --color-brand: oklch(0.72 0.19 260);
}
```

### @theme namespace → utility mapping

| Namespace | Utilities generated |
|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*` |
| `--font-*` | `font-*` |
| `--text-*` | `text-*` (size) |
| `--font-weight-*` | `font-*` (weight) |
| `--spacing-*` / `--spacing` | `p-*`, `m-*`, `w-*`, `h-*`, `gap-*` |
| `--breakpoint-*` | `sm:*`, `md:*`, `lg:*`, `xl:*` variants |
| `--radius-*` | `rounded-*` |
| `--shadow-*` | `shadow-*` |
| `--blur-*` | `blur-*` |
| `--animate-*` | `animate-*` |
| `--ease-*` | `ease-*` |

### Custom utilities (@utility replaces @layer utilities)

```css
/* v3 — DO NOT USE */
@layer utilities {
  .tab-4 { tab-size: 4; }
}

/* v4 — correct */
@utility tab-4 {
  tab-size: 4;
}

/* Custom component-style utility */
@utility btn {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
}
```

---

## Critical Class Name Changes (v3 → v4)

These are the classes training data will get wrong. Check every instance.

### Scale shifts (entire scale shifted by one step)

| v3 | v4 |
|---|---|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `shadow-md` | `shadow-md` ✓ (unchanged) |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur` | `backdrop-blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `rounded-md` | `rounded-md` ✓ (unchanged) |

### Renamed utilities

| v3 | v4 |
|---|---|
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `outline-none` | `outline-hidden` (for focus — preserves forced-colors a11y) |
| `ring` (3px default) | `ring-3` (default is now 1px) |
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

### Removed deprecated utilities — use opacity modifier syntax instead

| Remove | Use instead |
|---|---|
| `bg-opacity-50` | `bg-black/50` |
| `text-opacity-75` | `text-black/75` |
| `border-opacity-25` | `border-black/25` |
| `ring-opacity-50` | `ring-black/50` |
| `placeholder-opacity-40` | `placeholder-black/40` |

---

## Default Behavior Changes (Defaults You Must Know)

### Border color
- v3 default: `gray-200`
- v4 default: `currentColor`
- **Fix:** Add `border-gray-200` explicitly, or restore v3 default:
```css
@layer base {
  *, ::after, ::before, ::backdrop {
    border-color: var(--color-gray-200, currentColor);
  }
}
```

### Ring
- v3 default: `blue-500` / `3px`
- v4 default: `currentColor` / `1px`
- **Fix:** Use `ring-3 ring-blue-500` explicitly for focus styles

### Button cursor
- v3 default: `pointer`
- v4 default: `default`
- **Fix if needed:**
```css
@layer base {
  button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }
}
```

### Hover variant scope
- v4 `hover:` only fires on devices that support hover (`@media (hover: hover)`)
- Override: `@custom-variant hover (&:hover);`

---

## Syntax Changes

### Arbitrary CSS variables

```html
<!-- v3 -->
<div class="bg-[--brand-color]">

<!-- v4 -->
<div class="bg-(--brand-color)">
```

### Important modifier

```html
<!-- v3: ! prefix -->
<div class="!flex !bg-red-500">

<!-- v4: ! suffix -->
<div class="flex! bg-red-500!">
```

### Variant stacking order

```html
<!-- v3: right to left -->
<ul class="first:*:pt-0">

<!-- v4: left to right -->
<ul class="*:first:pt-0">
```

### Grid/arbitrary values with commas

```html
<!-- v3 -->
<div class="grid-cols-[max-content,auto]">

<!-- v4: use underscores for spaces -->
<div class="grid-cols-[max-content_auto]">
```

### theme() function → CSS variables

```css
/* v3 */
background-color: theme(colors.red.500);

/* v4 — use CSS variables directly */
background-color: var(--color-red-500);

/* For media queries (CSS vars not supported there): */
@media (width >= theme(--breakpoint-xl)) { ... }
```

---

## New Features to Use in v4

### Container queries (no plugin required)

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    <!-- Responds to container width, not viewport -->
  </div>
</div>

<!-- Max-width container query -->
<div class="grid-cols-3 @max-md:grid-cols-1">

<!-- Range query -->
<div class="@min-md:@max-xl:hidden">
```

### 3D transforms

```html
<div class="perspective-normal">
  <div class="rotate-x-12 transform-3d hover:rotate-x-0 transition-transform">
    <!-- 3D card flip -->
  </div>
</div>
```

New: `rotate-x-*`, `rotate-y-*`, `rotate-z-*`, `scale-z-*`, `translate-z-*`, `perspective-*`, `perspective-origin-*`, `transform-3d`, `backface-hidden`

### @starting-style (animate elements on first paint)

```html
<dialog class="open:opacity-100 open:translate-y-0
               starting:open:opacity-0 starting:open:translate-y-4
               transition-all duration-200">
  Animates in when dialog opens
</dialog>
```

### not-* variant

```html
<li class="not-last:border-b">Divider between items except last</li>
<div class="not-hover:opacity-50">Dim when not hovered</div>
```

### Gradient improvements

```html
<!-- Angle-based -->
<div class="bg-linear-45 from-indigo-500 to-pink-500">

<!-- Color space interpolation (more vivid) -->
<div class="bg-linear-to-r/oklch from-blue-500 to-teal-400">

<!-- Radial -->
<div class="bg-radial from-white to-slate-900">
<div class="bg-radial-[at_25%_25%] from-white to-zinc-900">

<!-- Conic -->
<div class="bg-conic from-red-500 to-blue-500">
```

### Dynamic values (any number, no config)

```html
<div class="grid-cols-15">   <!-- any integer -->
<div class="mt-17">          <!-- any spacing unit -->
<div class="w-[calc(100%-2rem)]">  <!-- arbitrary still works -->
```

### field-sizing (auto-resize textarea)

```html
<textarea class="field-sizing-content min-h-20 resize-none">
  Grows with content
</textarea>
```

### inset-shadow and inset-ring

```html
<input class="ring-1 ring-slate-300 inset-ring-2 inset-ring-blue-500 focus:inset-ring-blue-600">
```

---

## Browser Compatibility

| Browser | Minimum |
|---|---|
| Chrome | 111 (March 2023) |
| Safari | 16.4 (March 2023) |
| Firefox | 128 (July 2024) |

Requires: `@property`, `color-mix()`, native CSS nesting.

**If target audience includes older browsers → use Tailwind v3.4 instead. Say this to the user before starting.**

Not compatible with: Sass, Less, Stylus (Tailwind replaces them).

---

## Editor Setup

1. **VS Code:** Install `Tailwind CSS IntelliSense` (`bradlc.vscode-tailwindcss`)
2. If `@theme`/`@variant`/`@source` are flagged as errors: disable VS Code's built-in CSS validation
3. **Class sorting:** `prettier-plugin-tailwindcss` (optional but recommended)

---

## Upgrading Existing v3 Projects

**Automated (handles most cases):**
```bash
npx @tailwindcss/upgrade
# Requires Node.js 20+
```

**Manual checklist:**
- [ ] Replace `@tailwind base/components/utilities` → `@import "tailwindcss"`
- [ ] Replace PostCSS plugins (`tailwindcss` + `autoprefixer`) → `@tailwindcss/postcss`
- [ ] Audit renamed scale utilities (shadow, blur, rounded — see table above)
- [ ] Replace deprecated opacity utilities (`bg-opacity-*` → `bg-black/50`)
- [ ] Replace `@layer utilities {}` → `@utility {}`
- [ ] Replace `theme()` → `var(--color-*)` CSS variables
- [ ] Update `ring` to `ring-3` where 3px width is intended
- [ ] Add `border-gray-200` where bare `border` was relying on gray-200 default
- [ ] Test in Chrome 111+, Safari 16.4+, Firefox 128+

**Ask the user before upgrading** — upgrading is not always the right call (browser targets, existing plugin dependencies).

---

## Scoped Styles (Vue, Svelte, CSS Modules)

When using `@apply` in scoped `<style>` blocks, import the theme reference:

```vue
<style>
  @reference "../../src/style.css";

  h1 {
    @apply text-2xl font-bold text-brand;
  }
</style>
```

Or use CSS variables directly (no `@reference` needed):
```vue
<style>
  h1 {
    font-size: var(--text-2xl);
    color: var(--color-brand);
  }
</style>
```
