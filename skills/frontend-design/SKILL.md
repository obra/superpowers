---
name: frontend-design
description: >
  MUST USE for any frontend, UI, or web interface implementation.
  Enforces production-grade visual quality, accessibility, responsive
  design, and professional polish. Triggers on: "build a UI", "frontend",
  "website", "landing page", "dashboard", "make it look professional",
  any React/Vue/Svelte/HTML component work. Routed by using-superpowers,
  or invoke directly via /frontend-design.
---

# Professional Frontend Design

This skill transforms generic AI-generated UIs into production-grade, visually distinctive interfaces. It provides a design reasoning framework, industry-aware style selection, and concrete engineering standards.

## Scope Gate — Before Anything Else

1. Check: does the project already have a design system, component library, or style guide?
   - Look for: `tailwind.config`, `theme.ts/js`, `tokens.json`, `design-system/`, `styles/`, existing component library (shadcn, MUI, Chakra, etc.)
2. If YES (existing design system):
   - Read and reference the existing system. Do NOT generate a new one.
   - Skip to "Quality Standards" section — apply those standards within the existing design framework.
   - Only generate new design tokens if the existing system has clear gaps for the requested feature.
3. If NO (greenfield):
   - Proceed with full Design System Generation below.

## Design System Generation

Before writing any frontend code, walk through this reasoning framework. The goal is to make deliberate design decisions — not default to generic blue-and-white SaaS templates.

### Step 1: Analyze Requirements

Identify these before choosing any visual direction:
- **Product type** — What category? (SaaS, e-commerce, dashboard, portfolio, etc.)
- **Audience** — Who uses this? (developers, executives, consumers, elderly, children)
- **Platform** — Web, mobile, desktop, or cross-platform?
- **Constraints** — Existing brand guidelines? Required framework? Accessibility level (AA/AAA)?
- **Trust sensitivity** — How much does visual credibility matter? (critical for finance/healthcare, lower for playful apps)
- **Primary user goal** — What does the user come here to do? (scan, convert, explore, act)

### Step 2: Select Design Direction

Use the Industry Reference Table (below) as a starting point, then refine based on project specifics.

Choose explicitly:
- **Style** — The visual language (glassmorphism, brutalism, flat, etc.)
- **Color mood** — Emotional tone (trust blue, energetic orange, calm pastels, dark OLED)
- **Typography mood** — Character (professional, playful, editorial, technical)
- **Key effects** — Signature interactions (hover lifts, parallax, scroll reveals, blur)
- **Density level** — Compact (data-dense, minimal padding), balanced (standard), or spacious (generous whitespace, editorial feel)
- **Visual anchor** — What element draws the eye first? (hero metric, primary CTA, key image, headline)

### Step 3: Define Anti-Patterns

Every product type has styles that actively harm it. Name them explicitly before implementation:
- Finance: playful colors, excessive animation, dark mode by default
- Healthcare: bright neon, motion-heavy, low contrast
- Creative agency: corporate minimalism, generic templates
- Government: ornate design, low contrast, motion effects

### Step 4: Output Design Summary

Before writing code, output a brief design system summary:

```
**Design System**: [Product] — [Style]
**Colors**: [Primary] / [Accent] / [Neutral] / [Semantic]
**Typography**: [Heading font] + [Body font] — [Scale]
**Effects**: [Key interactions]
**Avoid**: [Named anti-patterns]
```

This takes 30 seconds and prevents hours of rework from misaligned visual direction.

---

## Distinctiveness Enforcement

Most AI-generated UIs fail here. They're technically correct but visually forgettable — the same blue-and-white SaaS template with rounded cards and a gradient hero. Professional UIs have identity.

The UI must include at least one of these distinctiveness signals:
- **Strong typography decision** — A deliberate scale, weight contrast, or editorial type treatment that gives the interface character
- **Distinctive layout structure** — Something beyond standard stacked sections (asymmetric grid, bento layout, split-screen, offset columns)
- **Controlled visual motif** — A repeating design element (border system, grid pattern, spacing rhythm, accent shape) that ties the interface together
- **Deliberate density choice** — Intentionally compact for data-rich contexts, or intentionally spacious for editorial/luxury feel — not just "default padding"

Avoid these generic patterns:
- Default SaaS layout (hero + 3 feature cards + testimonials + pricing + footer)
- Random gradients without structural purpose
- Card grids where every card has equal visual weight
- "Pleasant but forgettable" — passes review but has no identity

**The test:** If the UI could belong to any startup with a search-and-replace on the logo and copy, it has failed. The design direction chosen in Step 2 should be visible in the final output.

---

## Style Reference

25 styles with key characteristics. Use this to select and combine styles — most projects blend 1-2 primary styles.

| Style | Key Characteristics | Best For | Avoid When |
|---|---|---|---|
| **Minimalism / Swiss** | Monochromatic, geometric grid, essential elements only | Enterprise, dashboards, tools | Playful brands, children's products |
| **Glassmorphism** | `backdrop-filter: blur(10-20px)`, translucent overlays, vibrant backgrounds | Modern SaaS, fintech dashboards | Low-performance targets, print |
| **Brutalism / Neubrutalism** | Bold borders 2-4px, primary colors, thick offset shadows, no gradients | Creative agencies, portfolios, Gen-Z | Corporate, healthcare, finance |
| **Neumorphism / Soft UI** | Dual shadows (light+dark), embossed/debossed, monochromatic, rounded | Wellness, smart home, controls | Data-dense, text-heavy, low contrast risk |
| **Claymorphism** | Soft 3D, thick borders 3-4px, double shadows, rounded 16-24px | Educational, children's, playful apps | Corporate, legal, finance |
| **Dark Mode (OLED)** | Deep black `#000`, dark grey `#121212`, neon accents, high contrast | Streaming, dev tools, gaming, fintech | Print content, elderly users |
| **Flat Design** | 2D, bold colors, no shadows, clean lines, icon-heavy | Cross-platform, complex dashboards | Where depth/hierarchy is critical |
| **Bento Box Grid** | Modular cards, asymmetric grid, varied sizes, Apple-style | Product showcases, feature pages | Simple single-column content |
| **Aurora UI** | Vibrant gradients, northern lights, 8-12s ambient animations | Creative, AI platforms, luxury | Performance-constrained, accessibility-critical |
| **Motion-Driven** | Scroll effects, parallax 3-5 layers, 300-400ms transitions | Storytelling, portfolios, agencies | Motion-sensitive users, data tools |
| **Hero-Centric** | Full-viewport hero, compelling headline, high-contrast CTA | Landing pages, product launches | Multi-feature pages, dashboards |
| **Conversion-Optimized** | Single CTA focus, minimal distractions, trust signals, form-centric | Lead gen, signups, pricing pages | Content sites, portfolios |
| **Feature Showcase** | 3-4 column grid, benefit cards, interactive elements | SaaS feature pages, product tours | Simple products, single-function tools |
| **Data-Dense Dashboard** | Multiple charts, KPI cards, data tables, minimal padding, grid | BI/analytics, monitoring, admin | Consumer apps, marketing sites |
| **Executive Dashboard** | Large metrics, summary KPIs, minimal detail, whitespace | C-suite reporting, high-level views | Drill-down analysis, operations |
| **Real-Time Monitoring** | Live data, status indicators, alert pulses, streaming charts | DevOps, IoT, trading, operations | Static content, marketing |
| **Editorial / Magazine** | Asymmetric grid, pull quotes, drop caps, CSS Grid columns | Blogs, news, long-form content | Dashboards, tools, e-commerce |
| **Organic Biophilic** | Nature-inspired, organic shapes, earth tones, flowing SVG | Sustainability, wellness, eco brands | Tech-forward, cybersecurity |
| **AI-Native UI** | Conversational, minimal chrome, streaming text, typing indicators | Chatbots, AI assistants, voice | Data-heavy, multi-panel interfaces |
| **Exaggerated Minimalism** | Oversized type `clamp(3rem, 8vw, 12rem)`, extreme whitespace | Fashion, luxury, art, editorial | Dense information, dashboards |
| **Pixel Art / Retro** | 8-bit aesthetic, blocky, pixelated fonts, nostalgic palette | Gaming, indie, retro brands | Professional services, healthcare |
| **E-Ink / Paper** | Paper-like texture, high contrast, monochrome, reading-focused | Reading apps, documentation, notes | Dynamic content, media-heavy |
| **Spatial UI (VisionOS)** | Glass panels, depth layers, translucent, immersive | XR/VR interfaces, spatial computing | 2D-only contexts, accessibility-first |
| **Cyberpunk** | Neon on black, terminal/HUD, glitch effects, monospace | Gaming, security, crypto, dev tools | Conservative brands, elderly users |
| **Swiss Modernism 2.0** | Strict grid, Helvetica/Inter, modular, 12-column, WCAG AAA | Government, education, documentation | Creative/expressive brands |

---

## Industry Design Reference

Recommended design direction by product category. Use as a starting point — adapt to specific project needs.

| Category | Style | Color Mood | Typography | Effects | Anti-Patterns |
|---|---|---|---|---|---|
| **SaaS** | Glassmorphism + Flat | Trust blue, accent contrast | Professional, clear hierarchy | Subtle hover 200ms, smooth transitions | Excessive animation, dark mode default |
| **E-commerce** | Vibrant + Feature Showcase | Brand primary, success green | Engaging, clear hierarchy | Card hover lift 200ms, scale | Flat without depth, text-heavy pages |
| **E-commerce Luxury** | Liquid Glass + Glassmorphism | Premium minimal, gold accent | Elegant serif + refined sans | Slow animations 400-600ms, parallax | Vibrant block colors, playful tones |
| **Healthcare** | Neumorphism + Accessible | Calm blue, health green | Readable, large 16px+ | Soft shadows, smooth press 150ms | Bright neon, motion-heavy, low contrast |
| **Educational** | Claymorphism + Micro-interactions | Playful, clear hierarchy | Friendly, engaging | Soft press 200ms, progress animations | Dark modes, complex jargon |
| **Financial Dashboard** | Dark Mode + Data-Dense | Dark bg, red/green alerts, trust blue | Clear, readable mono | Real-time number animations, alert pulse | Light mode default, slow rendering |
| **Analytics Dashboard** | Data-Dense + Heat Map | Cool-to-hot gradients, neutral grey | Functional, monospace data | Hover tooltips, chart zoom, filters | Ornate design, no filtering |
| **Creative Agency** | Brutalism + Motion-Driven | Bold primaries, artistic freedom | Bold, expressive, variable | CRT scanlines, neon glow, glitch | Corporate minimalism, hidden portfolio |
| **Portfolio** | Motion-Driven + Minimalism | Brand primary, artistic | Expressive, variable weight | Parallax 3-5 layers, scroll reveals | Corporate templates, generic layouts |
| **Fitness/Gym** | Vibrant + Dark Mode | Energetic orange `#FF6B35`, dark bg | Bold, motivational | Progress rings, achievement unlocks | Static design, no gamification |
| **Restaurant/Food** | Vibrant + Motion-Driven | Warm orange/red/brown | Appetizing, clear | Food image reveals, menu hover | Low-quality imagery, outdated info |
| **Real Estate** | Glassmorphism + Minimalism | Trust blue, gold, white | Professional, confident | 3D property tour, map hover | Poor photos, no virtual tours |
| **Travel** | Aurora UI + Motion-Driven | Vibrant destination, sky blue | Inspirational, engaging | Destination parallax, itinerary animations | Generic photos, complex booking |
| **News/Media** | Minimalism + Flat | Brand + high contrast | Clear, readable serif/sans | Breaking news badges, article reveals | Cluttered layout, slow loading |
| **AI/Chatbot** | AI-Native + Minimalism | Neutral, AI purple `#6366F1` | Modern, clear | Streaming text, typing indicators, fade-in | Heavy chrome, slow response feedback |
| **Developer Tool** | Dark Mode + Minimalism | Syntax theme, blue focus | Monospace, functional | Syntax highlighting, command palette | Light mode default, slow performance |
| **Productivity** | Flat + Micro-interactions | Clear hierarchy, functional | Clean, efficient | Quick actions 150ms, task animations | Complex onboarding, slow performance |
| **Social Media** | Vibrant + Motion-Driven | Vibrant engagement colors | Modern, bold | Scroll animations, icon animations | Heavy skeuomorphism, poor a11y |
| **Gaming** | 3D + Retro-Futurism | Vibrant, neon, immersive | Bold, impactful | WebGL, glitch effects | Minimalist design, static assets |
| **Non-profit** | Accessible + Organic | Cause-related, trust, warm | Heartfelt, readable | Impact counters, story reveals | No impact data, hidden financials |
| **Legal** | Trust & Authority + Minimal | Navy `#1E3A5F`, gold, white | Professional, authoritative | Practice area reveals, credential display | Outdated design, hidden credentials |
| **Banking** | Minimalism + Accessible | Navy, trust blue, gold | Professional, trustworthy | Number animations, security indicators | Playful design, poor security UX |
| **Music Streaming** | Dark Mode + Vibrant | Dark `#121212`, vibrant accents | Modern, bold | Waveform visualization, playlist animations | Cluttered layout, poor audio player |
| **Video Streaming** | Dark Mode + Motion-Driven | Dark bg, poster colors, brand | Bold, engaging | Video player, content carousel parallax | Static layout, slow video player |
| **Job Board** | Flat + Minimalism | Professional blue, success green | Clear, professional | Search/filter animations, application flow | Outdated forms, hidden filters |
| **Marketplace** | Vibrant + Flat | Trust colors, category colors | Modern, engaging | Review animations, listing hover | Low trust signals, confusing layout |
| **Smart Home/IoT** | Glassmorphism + Dark Mode | Dark, status indicator colors | Clear, functional | Device status pulse, quick actions | Slow updates, no automation |
| **Government** | Accessible + Minimalism | Professional blue, high contrast | Clear, large type | Focus rings 3-4px, skip links | Ornate design, low contrast, motion |

---

## Common Page Structures

Use these as starting points for layout composition — adapt to project needs.

| Page Type | Structure | Key Components |
|---|---|---|
| **SaaS Dashboard** | Collapsible sidebar + top bar + main grid | Stat cards, charts, data tables, activity feed, filters |
| **Landing Page** | Hero → social proof → features → how-it-works → pricing → CTA → footer | Hero with CTA, testimonial carousel, feature grid, pricing cards |
| **Admin Panel** | Fixed sidebar + breadcrumb top bar + content area | CRUD tables with sort/filter/search, detail drawers, bulk actions |
| **E-commerce Product** | Sticky nav + image gallery + details + related | Image carousel, variant selector, add-to-cart, reviews, recommendations |
| **Documentation** | Left nav + main content + right TOC (sticky) | Search, version switcher, code blocks with copy, prev/next nav |
| **Blog / Editorial** | Top nav + hero article + content + sidebar | Featured image, reading time, table of contents, share buttons, related |
| **Settings / Profile** | Sidebar tabs or top tabs + form sections | Section nav, form groups, save/cancel, danger zone at bottom |
| **Auth Flow** | Centered card, minimal chrome | Logo, form, social login, link to alt flow (signup↔login), error inline |

---

## UI States

Every data-dependent view must handle all five states. Shipping only the success state is the single most common quality gap in AI-generated UIs.

| State | What to Show | Implementation |
|---|---|---|
| **Loading** | Skeleton shimmer matching content layout — never a blank screen or spinner alone | Skeleton components that mirror the final layout shape |
| **Error** | What went wrong + how to fix it + retry action | Error boundary (React) or error component; include retry button |
| **Empty** | Helpful message + primary action to populate | Illustration optional; clear CTA ("Create your first project") |
| **Success** | The actual content, fully interactive | Default state — but don't forget the other four |
| **Partial / Degraded** | Available data + indicator for what's missing or stale | "Last updated 5m ago" badge, greyed-out sections, retry for failed parts |
| **Pending** | User-triggered async action in progress | Inline spinner or progress indicator on the triggering element, disable re-trigger, revert UI on failure |

---

## Frontend-Backend Integration

When building a tool with both backend and frontend, these patterns determine perceived quality:

- **API loading**: Every fetch must show loading state immediately, not after a delay. Use `useSWR`, `react-query`, or equivalent for cache + revalidation.
- **Optimistic updates**: For user-initiated mutations (toggle, delete, reorder), update the UI immediately and roll back on failure. Waiting for the server round-trip feels sluggish.
- **Error boundaries**: Wrap route segments in error boundaries so one failed API call doesn't crash the entire page. Show a localized error with retry, not a white screen.
- **Auth flow**: Login/signup → redirect to intended destination (not always home). Show auth state in nav (avatar/menu). Handle token expiry gracefully (refresh silently, prompt re-login only when needed).
- **Real-time updates**: For dashboards/chat, use WebSocket or SSE with reconnection logic. Show connection status indicator. Degrade gracefully to polling if WS fails.
- **Form submissions**: Disable submit button during request, show inline progress, display success confirmation or inline errors. Never navigate away without confirming unsaved changes.
- **Pagination / infinite scroll**: Show count ("1-25 of 342"), maintain scroll position on back-nav, use cursor-based pagination for real-time data.

---

## Dark Mode Implementation

When the project needs dark mode, implement it properly — not as an afterthought. But first, evaluate whether dark mode is actually appropriate for the product. Not every interface benefits from it — light mode is often the right default for content-heavy, trust-sensitive, or general-audience products. Do not add dark mode just because it's trendy.

- Use CSS custom properties for all colors: `--color-bg`, `--color-text`, `--color-surface`
- Apply via `prefers-color-scheme` media query for system default + class toggle for user override
- Dark mode is NOT inverted colors — use desaturated, lighter tonal variants with adjusted contrast
- Shadows become less visible in dark mode — use border or elevated surface colors instead
- Test all semantic colors (error red, success green, warning amber) against dark backgrounds
- Store user preference in `localStorage`; respect system preference as default

---

## Design Token Scales

Beyond color and spacing tokens (covered in Quality Standards §6), define these additional token scales to prevent ad-hoc values:

- **Radius scale** — Border radius values tied to the design direction (e.g., `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 16px`). A brutalist design uses sharp radii; glassmorphism uses larger values.
- **Elevation scale** — Shadow definitions for consistent depth (e.g., `--shadow-sm`, `--shadow-md`, `--shadow-lg`). These must match the chosen style — flat design uses none, neumorphism uses dual light/dark shadows.

---

## Micro-Copy & UX Writing

Words are UI. Bad copy makes good design feel broken.

- **Button labels**: Use specific verbs ("Save changes", "Create project", "Send invite") — never generic ("Submit", "OK", "Click here")
- **Error messages**: State the cause + the fix ("Email is already registered — try logging in instead") — never just "Invalid input" or "Error occurred"
- **Empty states**: Tell the user what this space is for + how to fill it ("No projects yet. Create your first project to get started.")
- **Confirmation dialogs**: Name the destructive action ("Delete 3 files permanently?") — never "Are you sure?"
- **Loading text**: Describe what's happening if it takes >3s ("Loading your dashboard..." not just a spinner)
- **Success feedback**: Confirm what happened ("Project created" not "Success")
- **Placeholder text**: Use realistic examples ("jane@company.com") not instructions ("Enter your email")

---

## Quality Standards

### 1. Accessibility (CRITICAL)

- Contrast minimum 4.5:1 normal text, 3:1 large text (WCAG AA)
- `focus-visible` rings 2-4px on all interactive elements — never `outline: none` without a visible replacement
- `alt` text for meaningful images; empty `alt=""` for decorative
- `aria-label` on icon-only buttons and links
- Tab order matches visual order; all interactive elements keyboard-operable
- Sequential heading hierarchy `h1`→`h6`, no level skip; one `h1` per page
- Never convey information by color alone — add icon or text
- `@media (prefers-reduced-motion: reduce)` guard on every animation/transition
- Skip-to-content link on every page
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<button>` — never `<div onclick>`

### 2. Touch & Interaction (CRITICAL)

- Minimum 44x44px touch targets (Apple HIG) / 48x48dp (Material)
- 8px+ gap between adjacent touch targets
- Never rely on hover alone for primary interactions — use click/tap
- Loading buttons: disable during async operations, show spinner
- Visual tap feedback within 100ms
- `touch-action: manipulation` on interactive elements to remove 300ms tap delay
- Respect safe areas for notch, Dynamic Island, gesture bars
- Cursor: `pointer` on all clickable elements (web)

### 3. Performance (HIGH)

- Images: WebP/AVIF format, responsive `srcset`/`sizes`
- `loading="lazy"` on all below-fold images
- Declare `width`/`height` or `aspect-ratio` on images/media to prevent CLS
- `font-display: swap` or `optional`; preload only critical fonts
- Lazy load non-hero components via dynamic import / route splitting
- Reserve space for async content — no layout jumps (CLS < 0.1)
- Virtualize lists with 50+ items (react-virtual, tanstack-virtual)
- Skeleton screens or shimmer for operations exceeding 300ms
- Critical CSS inlined or early-loaded for above-the-fold content

### 4. Style Consistency (HIGH)

- Match style to product type using the Industry Reference Table
- SVG icon libraries (Heroicons, Lucide, Phosphor) — never emoji as icons
- One icon set and visual language across the entire product
- Consistent elevation/shadow scale for cards, sheets, modals
- Design light and dark variants together — test contrast separately
- One primary CTA per screen; secondary actions visually subordinate
- Effects (shadows, blur, radius) must align with chosen style
- Avoid "card spam" — not everything needs a container. Use spacing and typography to group related content instead of wrapping everything in bordered boxes
- Visual hierarchy must not rely only on color — use size, weight, spacing, and position to establish importance

### 5. Layout & Responsive (HIGH)

- Mobile-first: base styles target small screens, `min-width` media queries scale up
- `<meta name="viewport" content="width=device-width, initial-scale=1">` — never disable zoom
- Systematic breakpoints: 375 / 768 / 1024 / 1440
- Minimum 16px body text on mobile (prevents iOS auto-zoom)
- Line length: 35-60 chars mobile, 60-75 chars desktop (`max-width: 65ch`)
- No horizontal scroll on mobile
- 4pt/8dp spacing rhythm throughout; consistent spacing scale
- `max-width` container on desktop (e.g., `max-w-7xl`)
- Use `min-h-dvh` instead of `100vh` on mobile (accounts for browser chrome)
- Consistent `z-index` scale: 0 / 10 / 20 / 40 / 100 / 1000
- Layout should adapt hierarchy on different breakpoints, not just stack columns — what's a sidebar on desktop might become a bottom sheet on mobile, not just a collapsed column

### 6. Typography & Color (MEDIUM)

- Design tokens as CSS custom properties: `--color-primary`, `--spacing-md`, `--font-size-base`
- Semantic color tokens (`primary`, `secondary`, `error`, `surface`, `on-surface`) — no raw hex in components
- Fluid typography with `clamp()`: e.g., `clamp(1rem, 0.5rem + 1.5vw, 1.25rem)`
- Consistent type scale: 12 / 14 / 16 / 18 / 24 / 32 / 48
- Line-height 1.5-1.75 for body text; 1.1-1.3 for headings
- Font weight hierarchy: bold headings 600-700, regular body 400, medium labels 500
- Dark mode: desaturated/lighter tonal variants — never just invert colors
- Tabular/monospaced figures for data columns, prices, timers

### 7. Animation (MEDIUM)

- Micro-interactions: 150-300ms; complex transitions: ≤400ms; never >500ms
- Animate only `transform` and `opacity` — never `width`, `height`, `top`, `left`
- `ease-out` for entering elements, `ease-in` for exiting
- Exit animations ~60-70% of enter duration for responsive feel
- Stagger list/grid item entrance: 30-50ms per item
- Prefer spring/physics-based curves for natural motion feel
- All animations must be interruptible by user interaction
- Maximum 1-2 animated elements per view at once
- Skeleton/progress indicator for any load exceeding 300ms

### 8. Forms & Feedback (MEDIUM)

- Visible `<label>` per input — never placeholder-only labels
- Error messages below the related field, not only at form top
- Validate on blur, not on each keystroke
- Required fields: asterisk indicator + `required` attribute
- Helper text below complex inputs (persistent, not tooltip-only)
- Disabled state: opacity 0.38-0.5 + `cursor: not-allowed` + semantic `disabled`
- Progressive disclosure: reveal complex options only when relevant
- Confirm before destructive actions (delete, discard, overwrite)
- Auto-save for long forms to prevent data loss
- Toast auto-dismiss 3-5s; use `aria-live="polite"` for screen readers
- Error messages must state cause + how to fix (not just "Invalid input")

### 9. Navigation (HIGH)

- Bottom nav: max 5 items, each with icon + text label
- Back behavior must preserve scroll position and filter/input state
- All key screens reachable via deep link / URL
- Current location visually highlighted in navigation
- Modals/sheets: clear close/dismiss affordance; swipe-down on mobile
- Large screens (≥1024px): prefer sidebar nav; small screens: bottom/top nav
- Never mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- Route change: move focus to main content region for screen readers
- Drawer/sidebar for secondary navigation, not primary actions

### 10. Charts & Data Visualization (LOW)

- Match chart type to data: trend→line, comparison→bar, proportion→pie/donut
- Accessible color palettes + pattern/texture supplements (not color-only)
- Provide data table alternative for screen readers
- Legend visible near chart, not below scroll fold
- Tooltips on hover (web) / tap (mobile) showing exact values
- Responsive: simplify on small screens (horizontal bar, fewer ticks)
- Skeleton/shimmer placeholder while chart data loads
- No pie chart for >5 categories — switch to bar
- All interactive chart elements keyboard-navigable
- `aria-label` summary describing the chart's key insight

---

## Post-Build Fix Priority

When self-reviewing frontend work, fix issues in this order. Earlier items affect everything downstream — fixing color before structure wastes effort.

**structure → hierarchy → spacing → typography → color → interaction → polish**

---

## Pre-Delivery Checklist

Run this verification gate before declaring any frontend work complete:

- [ ] All interactive elements keyboard accessible
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] Touch targets ≥44px with 8px+ gaps
- [ ] No horizontal scroll at 375px width
- [ ] `prefers-reduced-motion` media query on all animations
- [ ] Semantic HTML throughout (no `<div onclick>`, proper heading hierarchy)
- [ ] Loading/skeleton states for all async content
- [ ] Error states for all data-dependent views
- [ ] Empty states with helpful message + action
- [ ] Dark mode tested if applicable (contrast, readability, brand)
- [ ] Responsive tested at 375px, 768px, 1024px, 1440px
- [ ] UI does not look like a generic AI template
- [ ] Visual hierarchy is clear within 3 seconds of scanning
- [ ] One clear primary action per major section

---

## Framework & Version Awareness

Before scaffolding any CSS framework, check the project's existing setup:

1. **Existing project** — inspect `package.json` and CSS entry files to detect the current framework and major version. Use whatever version is already in use. Do not silently upgrade.
2. **Greenfield project** — default to the latest stable major version of the chosen framework. State the version explicitly before writing any setup code ("Using Tailwind CSS v4.x").
3. **Ambiguous version** — ask the user before writing setup code. Major version differences have breaking setup patterns.
4. **Never mix major version patterns** — v3 config syntax + v4 CSS directives = broken build.

### Tailwind CSS

Read **`tailwind-v4.md`** before writing any Tailwind setup, config, or utility classes for:
- Greenfield projects choosing Tailwind
- Projects where the Tailwind version is unknown

Training data is biased toward v3 patterns. `tailwind-v4.md` contains the correct v4 installation commands, `@theme` config syntax, renamed class scales, and new features that v3 training will get wrong.

---

## When to Use in Superpowers

- During `executing-plans` or `subagent-driven-development` when tasks involve UI/frontend
- When the user cares about premium visual quality, brand alignment, or accessibility
- Apply the Design System Generation framework before implementation begins
- Recommend an appropriate stack guided by user constraints (e.g., Next.js + Tailwind + Radix, Svelte + skeleton UI, plain HTML + CSS for simple sites)

## Supporting References

- `tailwind-v4.md` — Tailwind CSS v4 installation, configuration, class name changes from v3, and new features. Read before any Tailwind work on greenfield or version-unknown projects.
