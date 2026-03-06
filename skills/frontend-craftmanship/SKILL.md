---
name: professional-frontend-craftsmanship
description: Create production-grade, visually sophisticated, and highly accessible frontend interfaces that look and perform like premium professional products.
---

# Professional Frontend Craftsmanship

Use this skill whenever the user requests a website, web application, landing page, dashboard, or any frontend component that must appear polished, trustworthy, and memorable.

Every output should be:
- Visually distinctive (not generic AI-looking UI)
- Fully accessible
- Responsive and performant
- Ready for production deployment

Focus areas include:
- Clear visual hierarchy and strong typography
- Cohesive design direction (e.g., corporate, minimal luxury, bold tech-forward, warm human-centered, editorial, industrial)
- Accessible semantics, ARIA, keyboard navigation, and contrast
- Mobile-first responsive layouts and modern CSS layout primitives
- Performance targets aligned with good Core Web Vitals

## Concrete Standards Checklist

Apply these verifiable patterns in every frontend implementation:

**Structure**
- Use semantic HTML (`<nav>`, `<main>`, `<article>`, `<section>`, `<button>` — never `<div onclick>`)
- One `<h1>` per page; heading hierarchy must not skip levels

**Accessibility**
- All images: `alt` attribute (empty `alt=""` for decorative images)
- Icon-only buttons and links: `aria-label` describing the action
- `focus-visible` outline styles — never `outline: none` without a replacement
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- Keyboard navigation: all interactive elements reachable and operable without a mouse

**CSS**
- Design tokens as CSS custom properties (`--color-primary`, `--spacing-md`, `--font-size-base`)
- Fluid typography with `clamp()` instead of hard pixel breakpoints
- `@media (prefers-reduced-motion: reduce)` guard on all animations and transitions
- Mobile-first: base styles target small screens, `min-width` media queries scale up

**Performance**
- `loading="lazy"` on below-the-fold images
- No layout shifts from async-loaded content (reserve space with `aspect-ratio` or `min-height`)

## When to Use in Superpowers

- During `executing-plans` or `subagent-driven-development` when plan tasks involve UI/UX or frontend implementation.
- When the user explicitly cares about premium visual quality, brand alignment, or accessibility.

In those situations:
- Apply this skill’s standards to shape component/page structure, styling approach, and interaction patterns.
- Recommend an appropriate stack (e.g., Next.js + TypeScript + Tailwind + headless UI primitives, or lighter stacks for simple sites) guided by user constraints.

