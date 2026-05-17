# Frontend Design Skill

How the frontend-design skill works and what to expect when you ask the AI to build a UI.

## What It Does

The frontend-design skill is a design intelligence system that activates automatically whenever you ask the AI to build any frontend — a website, dashboard, landing page, admin panel, or any UI component. Instead of jumping straight to generic blue-and-white templates, it forces a structured design reasoning process before writing code.

The skill covers the full spectrum from visual direction to engineering quality:
- **Design system generation** — Deliberate style, color, typography, and effects selection before coding
- **Industry-aware style selection** — 30 product categories mapped to recommended design directions
- **25 UI styles** — From Minimalism to Cyberpunk, each with clear characteristics and best-fit contexts
- **Page structure patterns** — Common layouts for dashboards, landing pages, admin panels, auth flows, etc.
- **UI state management** — Loading, error, empty, success, and degraded states for every data view
- **Frontend-backend integration** — API loading patterns, optimistic updates, error boundaries, auth flows
- **10 priority quality standards** — Accessibility, touch targets, performance, animation, forms, navigation, charts
- **Pre-delivery checklist** — Verification gate before declaring frontend work complete

## How It Works

### 1. Design System Generation (before any code)

When you ask "build me a dashboard for my fintech app," the skill doesn't start writing React components. It first walks through a four-step reasoning framework:

**Step 1 — Analyze Requirements:** What type of product is this? Who's the audience? What platform? Any constraints (brand guidelines, required framework, accessibility level)?

**Step 2 — Select Design Direction:** Based on the product type and audience, the skill selects a style (e.g., Dark Mode + Data-Dense for a fintech dashboard), color mood (dark background, red/green alerts, trust blue), typography (clear, readable mono), and key effects (real-time number animations, alert pulses).

**Step 3 — Define Anti-Patterns:** The skill explicitly names what to avoid. For fintech: playful colors, excessive animation, light mode by default.

**Step 4 — Output Design Summary:** A concise summary is produced before any code is written:

```
Design System: Fintech Dashboard — Dark Mode + Data-Dense
Colors: Dark bg #121212 / Trust blue #2563EB / Alert red/green / Neutral grey
Typography: Inter (headings) + JetBrains Mono (data) — 14/16/18/24/32 scale
Effects: Real-time number animations, alert pulses, hover tooltips
Avoid: Light mode default, playful colors, slow rendering, ornate design
```

This takes seconds and prevents hours of rework from misaligned visual direction.

### 2. Industry-Aware Style Selection

The skill includes a reference table mapping 30 common product categories to recommended design directions. Examples:

| Product Type | Recommended Style | Color Direction |
|---|---|---|
| SaaS | Glassmorphism + Flat | Trust blue, accent contrast |
| Healthcare | Neumorphism + Accessible | Calm blue, health green |
| Creative Agency | Brutalism + Motion-Driven | Bold primaries, artistic freedom |
| E-commerce Luxury | Liquid Glass + Glassmorphism | Premium minimal, gold accent |
| Developer Tool | Dark Mode + Minimalism | Syntax theme, blue focus |

Each entry also includes typography mood, key effects, and anti-patterns to avoid.

### 3. Page Structure Patterns

When building a full application, the skill provides starting layouts for 8 common page types:

- **SaaS Dashboard** — Collapsible sidebar + top bar + main grid (stat cards, charts, data tables)
- **Landing Page** — Hero → social proof → features → how-it-works → pricing → CTA → footer
- **Admin Panel** — Fixed sidebar + breadcrumb top bar + content area (CRUD tables, detail drawers)
- **E-commerce Product** — Sticky nav + image gallery + details + related products
- **Documentation** — Left nav + main content + right TOC (sticky)
- **Blog / Editorial** — Top nav + hero article + content + sidebar
- **Settings / Profile** — Sidebar tabs or top tabs + form sections
- **Auth Flow** — Centered card, minimal chrome

### 4. UI State Management

Every data-dependent view handles five states — not just the happy path:

| State | What the user sees |
|---|---|
| **Loading** | Skeleton shimmer matching the final layout shape |
| **Error** | What went wrong + how to fix it + retry button |
| **Empty** | What this space is for + action to populate it |
| **Success** | The actual content, fully interactive |
| **Partial** | Available data + indicator for what's missing or stale |

Shipping only the success state is the most common quality gap in AI-generated UIs. This skill explicitly prevents it.

### 5. Frontend-Backend Integration

For tools with both a backend and frontend, the skill enforces patterns that make the UI feel fast and reliable:

- **API loading** — Show loading state immediately, use cache + revalidation (SWR, react-query)
- **Optimistic updates** — Update UI immediately on user action, roll back on failure
- **Error boundaries** — Localized errors with retry, never a white screen crash
- **Auth flows** — Redirect to intended destination, handle token expiry gracefully
- **Real-time** — WebSocket/SSE with reconnection logic and connection status indicator
- **Form submissions** — Disable during request, inline progress, success confirmation or inline errors

### 6. Quality Standards

10 priority categories with concrete, verifiable rules:

1. **Accessibility** (CRITICAL) — WCAG AA contrast, keyboard navigation, ARIA labels, semantic HTML, reduced-motion support
2. **Touch & Interaction** (CRITICAL) — 44px minimum touch targets, 8px gaps, tap feedback within 100ms
3. **Performance** (HIGH) — Lazy loading, CLS prevention, skeleton screens, code splitting, image optimization
4. **Style Consistency** (HIGH) — SVG icons (never emoji), consistent elevation scale, one primary CTA per screen
5. **Layout & Responsive** (HIGH) — Mobile-first, systematic breakpoints, 16px minimum body text, no horizontal scroll
6. **Typography & Color** (MEDIUM) — CSS custom properties, semantic color tokens, fluid clamp() typography, dark mode done right
7. **Animation** (MEDIUM) — 150-300ms micro-interactions, transform/opacity only, interruptible, reduced-motion guard
8. **Forms & Feedback** (MEDIUM) — Visible labels, validate on blur, progressive disclosure, auto-save, actionable error messages
9. **Navigation** (HIGH) — Bottom nav max 5 items, back preserves state, deep linking, focus management on route change
10. **Charts & Data** (LOW) — Accessible colors + patterns, data table alternatives, responsive simplification

### 7. Pre-Delivery Checklist

Before declaring frontend work complete, the skill verifies:

- All interactive elements keyboard accessible
- Color contrast meets WCAG AA
- Touch targets at least 44px with proper gaps
- No horizontal scroll on mobile
- Reduced-motion media query on all animations
- Semantic HTML throughout
- Loading, error, and empty states for all data views
- Dark mode tested (if applicable)
- Responsive at 375px, 768px, 1024px, 1440px

## What to Expect

When you prompt "build me a project management tool" or "create a landing page for my SaaS," the AI will:

1. Ask clarifying questions about product type, audience, and constraints (or infer from context)
2. Output a design system summary before writing any code
3. Choose a style and color direction appropriate to your product category
4. Structure the page using proven layout patterns
5. Implement all five UI states for every data-dependent view
6. Apply the 10 quality standards throughout
7. Run the pre-delivery checklist before calling it done

The result should be a UI that looks intentionally designed for your specific product — not a generic AI-generated template.

## Activation

The skill activates automatically when your prompt involves frontend work. You can also invoke it directly:

```
Use frontend-design to build a dashboard for my analytics platform.
```

It integrates with other Superpowers skills — during plan execution or subagent-driven development, any task involving UI/frontend automatically applies frontend-design standards.
