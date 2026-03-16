# Mobile

> Responsive CSS, safe area insets, and touch optimization.

---

## Responsive Design Patterns

### Pattern: Negative Margins to Reclaim Padding

**What:** Break out of container padding on mobile to maximize screen real estate.

**Why it matters:** Mobile screens are precious. You can reclaim horizontal padding when content needs full width.

**From:** PR [#480](https://github.com/basecamp/fizzy/pull/480)

```css
@media (max-width: 800px) {
  .card-perma__container {
    --padding-inline: var(--main-padding);

    inline-size: calc(100% + 2 * var(--padding-inline));
    margin-inline: calc(-1 * var(--padding-inline));
    max-inline-size: none;
  }
}
```

**Key insight:** Use CSS variables to coordinate the padding and negative margin values, ensuring they stay in sync.

---

### Pattern: Stacked-to-Grid Layout Transform

**What:** Stack multi-column layouts vertically on mobile, switch to grid on desktop.

**Why it matters:** Horizontal scrolling feels natural for carousels but awkward for columnar data. Stacking is often clearer.

**From:** PR [#604](https://github.com/basecamp/fizzy/pull/604)

```css
.card-columns {
  /* Mobile: stacked */
  margin: auto;
  max-inline-size: 100%;

  /* Desktop: grid */
  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: repeat(2, 50%);
  }
}
```

**Design decision noted in PR:** "I tried making the columns horizontally scrollable... That didn't work well, since that kind of interaction works best when you have content that peeks from the edge of the screen."

---

### Pattern: Responsive Sticky Headers

**What:** Make column headers sticky with proper z-index management.

**Why it matters:** Users need context while scrolling, especially on small screens.

**From:** PR [#604](https://github.com/basecamp/fizzy/pull/604)

```css
.cards__heading {
  background-color: var(--color-canvas);
  inset-block-start: 0;
  position: sticky;
  z-index: 2;
}

/* Ensure dialogs don't get hidden behind sticky headers */
.cards:has([open]) {
  z-index: 3;
}
```

**Key insight:** Explicitly manage z-index context for dialogs that appear within sticky containers.

---

### Pattern: Icon-Based Mobile Navigation

**What:** Replace text/visual stacks with iconified controls on mobile.

**Why it matters:** Text and previews consume space. Icons with badges communicate state efficiently.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
/* Desktop: show cards */
@media (min-width: 800px) {
  .tray__expander {
    display: block;
  }
}

/* Mobile: show icon + badge */
@media (max-width: 799px) {
  .tray__expander {
    inline-size: var(--footer-height);

    .icon {
      display: block;
    }

    /* Show red dot badge if there are items */
    .tray__dialog:has(.tray__item:not(.tray__item--overflow)) ~ &:after {
      background: oklch(var(--lch-red-medium));
      block-size: 1ch;
      border-radius: 50%;
      content: "";
      inline-size: 1ch;
      inset: 25% 25% auto auto;
      position: absolute;
    }
  }
}
```

---

### Pattern: Viewport-Adaptive Content Limits

**What:** Adjust visible content count based on viewport height.

**Why it matters:** A fixed "show 10 items" works on desktop but overflows on small phones.

**From:** PR [#1208](https://github.com/basecamp/fizzy/pull/1208)

```css
.tray__item {
  /* 6 max on smallest devices */
  @media (max-height: 578px) {
    &:nth-child(1n + 7) { display: none; }
  }

  /* 7 max */
  @media (min-height: 578px) and (max-height: 656px) {
    &:nth-child(1n + 8) { display: none; }
  }

  /* 8 max */
  @media (min-height: 656px) and (max-height: 734px) {
    &:nth-child(1n + 9) { display: none; }
  }

  /* 10 max on larger screens */
  @media (min-height: 812px) {
    &:nth-child(1n + 11) { display: none; }
  }
}
```

**Key insight:** Use `(min-height) and (max-height)` ranges to avoid needing to reset visibility rules.

---

## Mobile-First CSS Techniques

### Pattern: Fluid Typography with `clamp()`

**What:** Scale font sizes smoothly between min and max values based on viewport.

**Why it matters:** Avoids awkward text sizes on small screens while maintaining hierarchy on large screens.

**From:** PR [#740](https://github.com/basecamp/fizzy/pull/740)

```css
.card__title {
  font-size: clamp(var(--text-medium), 6vw, var(--text-xx-large));
}

.layout {
  --main-padding: clamp(var(--inline-space), 3vw, calc(var(--inline-space) * 3));
  padding-inline: var(--main-padding);
}
```

**Pattern:** Use `clamp(min, preferred, max)` for any value that should scale with viewport size.

---

### Pattern: Responsive Custom Properties

**What:** Change CSS custom property values at breakpoints instead of changing every property.

**Why it matters:** Centralize responsive behavior; reduce duplication.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597), #604

```css
:root {
  --tray-size: clamp(12rem, 25dvw, 24rem);

  @media (max-width: 799px) {
    --tray-size: var(--footer-height);
  }
}

.card-columns {
  --reserved-bubble-space: calc(var(--bubble-size) + var(--bubble-gap));
  --bubble-gap: 0.5rem;
  --bubble-size: 4rem;

  @media (max-width: 639px) {
    --bubble-gap: -0.5rem;
    --bubble-size: 3rem;
    --reserved-bubble-space: calc(var(--bubble-size) / 2 + var(--bubble-gap));
  }
}
```

---

### Pattern: Conditional Borders for Visual Separation

**What:** Add borders only on mobile to separate stacked sections.

**Why it matters:** Columns separated by whitespace don't need borders; stacked sections do.

**From:** PR [#604](https://github.com/basecamp/fizzy/pull/604), #881

```css
.cards--doing:before {
  @media (max-width: 639px) {
    background: var(--gradient-border);
    block-size: 1px;
    content: "";
    inset: 0 0 auto;
    position: absolute;
  }
}

.card__stages {
  @media (max-width: 639px) {
    border: 1px solid var(--card-color);
    border-radius: 0.25em;
    overflow: hidden;
  }
}
```

---

### Pattern: Hide Empty Lexical/Rich Text Elements

**What:** Hide the empty markup that rich text editors save by default.

**Why it matters:** Trix, Lexical, etc. save `<p><br /></p>` for empty content, creating unwanted whitespace.

**From:** PR [#740](https://github.com/basecamp/fizzy/pull/740)

```css
.card__description {
  /* Hide the empty element that Lexical saves when nothing is added */
  p:only-child:has(br:only-child) {
    display: none;
  }
}
```

**Note:** This is a CSS workaround since `:empty` doesn't work for elements containing `<br>`.

---

## Touch-Optimized Interactions

### Pattern: Circle Buttons on Mobile

**What:** Convert text buttons to icon-only circles on mobile.

**Why it matters:** Saves horizontal space while maintaining touch target size.

**From:** PR [#778](https://github.com/basecamp/fizzy/pull/778)

```css
.header {
  @media (min-width: 640px) {
    --header-actions-width: 7rem;
  }
}
```

```html
<!-- Button has class "btn--circle-mobile" -->
<%= button_to collection_cards_path(collection),
      method: :post,
      class: "btn btn--link btn--circle-mobile" do %>
  <%= icon_tag "plus" %>
  <span class="btn__text">Add Card</span>
<% end %>
```

**Pattern assumption:** The `btn--circle-mobile` class likely hides `.btn__text` on mobile.

---

### Pattern: Full-Width Touch Targets

**What:** Expand tappable areas to full width on mobile for easier interaction.

**Why it matters:** Small tap targets frustrate users. Mobile UIs should be forgiving.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
@media (max-width: 799px) {
  &:has(.tray__dialog[open]) {
    background-color: var(--color-terminal-bg);
    inline-size: calc(100% - var(--tray-margin) * 2);
    inset-inline-start: var(--tray-margin);
    z-index: calc(var(--z-tray) + 2);
  }
}
```

**Key insight:** When expanded, the tray takes up nearly the full width (minus small margins).

---

### Pattern: Disable Interactions for Empty States

**What:** Disable buttons that have no content to act upon, but provide feedback.

**Why it matters:** Prevents confusion and provides visual feedback about state.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
/* On mobile, disable the expander if there aren't items to show */
.tray__dialog:not(:has(.tray__item:not(.tray__item--overflow))) ~ .tray__expander {
  pointer-events: none;

  .icon {
    opacity: 0.5;
  }
}
```

**Key insight:** Combine `pointer-events: none` with visual dimming (`opacity: 0.5`).

---

## Progressive Enhancement

### Pattern: Desktop-Only UI Refinements

**What:** Add behaviors for desktop that don't apply to mobile.

**Why it matters:** Not every feature needs to work everywhere. Ship the best experience for each context.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
/* Desktop: don't expand if there's only one pin */
@media (min-width: 800px) {
  .tray__dialog:has(.tray__item:only-child) {
    pointer-events: unset;

    ~ .tray__expander {
      display: none;
    }
  }
}
```

**Key insight:** On mobile, a single item might still justify an expand/collapse mechanism, but on desktop it's unnecessary.

---

### Pattern: Mobile-Specific Fallbacks

**What:** Hide features entirely on mobile that don't translate well.

**Why it matters:** Some features can't be gracefully adapted; hiding them is acceptable.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
/* On mobile, hide the dialog if there aren't items to show */
@media (max-width: 799px) {
  .tray__dialog:not(:has(.tray__item:not(.tray__item--overflow))) {
    display: none;
  }
}
```

---

### Pattern: Flexible Layout Direction Changes

**What:** Change flex-direction from row to column on mobile.

**Why it matters:** Horizontal layouts often fail on narrow screens.

**From:** PR [#740](https://github.com/basecamp/fizzy/pull/740), #881

```css
.card__body {
  display: flex;
  gap: 1ch;

  @media (max-width: 639px) {
    flex-direction: column;
  }

  @media (min-width: 640px) {
    gap: var(--card-padding-inline);
  }
}
```

---

## Safe Area Insets & Native Integration

### Pattern: Respect Device Safe Areas

**What:** Use `env(safe-area-inset-*)` to respect notches, home indicators, etc.

**Why it matters:** Essential for iOS devices with notches and Android gesture navigation.

**From:** PR [#739](https://github.com/basecamp/fizzy/pull/739)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover">
```

```css
#header {
  padding: calc(var(--block-space-half) + env(safe-area-inset-top))
           var(--inline-space);
}

.terminal {
  padding: var(--block-space)
           calc(var(--tray-size) + calc(var(--inline-space) * 3))
           calc(var(--block-space) + env(safe-area-inset-bottom));
}

.tray {
  inset-block: auto env(safe-area-inset-bottom);
}
```

**Critical:** Add `viewport-fit=cover` to the viewport meta tag, or safe-area insets won't work.

---

### Pattern: Dark Mode Terminal Background

**What:** Define consistent background colors for overlays in dark mode.

**Why it matters:** Prevents jarring white flashes in dark mode; improves native-feeling integration.

**From:** PR [#597](https://github.com/basecamp/fizzy/pull/597)

```css
:root {
  --color-terminal-bg: var(--color-black);
}

.terminal {
  @media (prefers-color-scheme: dark) {
    background-color: var(--color-terminal-bg);
    border-block-start: 1px solid var(--color-ink-lighter);
  }
}

/* Reuse the same background for mobile overlays */
@media (max-width: 799px) {
  &:has(.tray__dialog[open]) {
    background-color: var(--color-terminal-bg);
  }
}
```

---

## Checklist for Mobile-Ready Rails Apps

Use this checklist when building or auditing mobile experiences:

- [ ] **Viewport meta tag** includes `viewport-fit=cover` for safe area insets
- [ ] **Safe area insets** applied to header (top) and footer (bottom)
- [ ] **Fluid typography** using `clamp()` for titles and key text
- [ ] **Responsive custom properties** change at breakpoints (not individual properties)
- [ ] **Touch targets** are minimum 44x44px (iOS) or 48x48px (Android)
- [ ] **Sticky headers** have proper z-index management for dialogs
- [ ] **Empty rich text** elements are hidden with `:has(br:only-child)` pattern
- [ ] **Stacked layouts** for multi-column content on mobile
- [ ] **Icon + badge** pattern for space-constrained navigation
- [ ] **Viewport height** considered for scrollable content limits
- [ ] **Dark mode** terminal/overlay backgrounds defined
- [ ] **Progressive enhancement** used for desktop-only refinements

---

## Additional Resources

- **Container Queries:** Fizzy uses `cqi` (container inline size) units. Consider `@container` queries for truly component-scoped responsive design.
- **Logical Properties:** Note the use of `inline-size`, `block-size`, `inset-inline`, etc. These are future-proof for RTL languages.
- **Modern Viewport Units:** Fizzy uses `dvw` and `dvh` (dynamic viewport units) that account for browser chrome on mobile.

---

## Summary

The key themes across these PRs:

1. **Maximize screen real estate** through negative margins, stacking, and iconification
2. **Fluid, viewport-aware sizing** using `clamp()` and responsive custom properties
3. **Touch-optimized interactions** with full-width targets and disabled states
4. **Progressive enhancement** where desktop gets refinements, mobile gets essentials
5. **Native integration** via safe-area insets and dark mode terminal backgrounds

These patterns are broadly applicable to any Rails app targeting mobile users, whether or not you're building with Turbo Native.
