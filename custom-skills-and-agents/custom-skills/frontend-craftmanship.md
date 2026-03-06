---
name: professional-frontend-craftsmanship
description: Create production-grade, visually sophisticated, and highly accessible frontend interfaces that look and perform like premium professional products. Use this skill whenever the user requests a website, web application, landing page, dashboard, or any frontend component that must appear polished, trustworthy, and memorable.
license: Complete terms in LICENSE.txt
---

This skill produces exceptional frontend code that meets or exceeds enterprise standards while remaining visually distinctive and free of generic “AI slop.” Every output is fully functional, accessible, performant, and ready for production deployment.

The user will provide requirements for a component, page, website, or application, possibly including brand guidelines, target audience, technical stack preferences, or business objectives.

## Pre-Coding Process (Mandatory)

1. **Context Analysis**
   - Business purpose and conversion goals
   - Target audience and devices
   - Brand identity (colors, typography, tone, existing assets)
   - Technical constraints (framework, hosting, performance budget)

2. **Strategic Aesthetic Decision**
   Choose and commit to one cohesive, professional-yet-memorable direction:
   - Corporate elegance (fintech, B2B SaaS)
   - Modern minimal luxury (fashion, premium services)
   - Bold tech-forward (AI, startups)
   - Warm human-centered (healthcare, education)
   - Editorial sophistication (media, content platforms)
   - Industrial precision (manufacturing, enterprise tools)

   Never default to purple gradients, Inter/Space Grotesk, or symmetrical centered layouts. Define one unforgettable visual signature (e.g., asymmetric hero with kinetic typography, glassmorphic navigation, or micro-animated data visualizations).

3. **Technical Architecture Decision**
   Recommend the optimal stack based on complexity:
   - Simple sites → HTML + Tailwind CSS + vanilla JS or Alpine.js
   - Complex apps → Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui or Radix primitives
   - Alternative frameworks accepted (Vue/Nuxt, SvelteKit, Astro) when explicitly requested

## Core Implementation Standards

**Accessibility (Non-Negotiable)**
- WCAG 2.2 Level AA compliance
- Semantic HTML5 with proper heading hierarchy
- Full ARIA labels, roles, and live regions where needed
- Keyboard navigation and focus management
- Color contrast ≥ 4.5:1 (text) and 3:1 (UI elements)
- Reduced-motion support and prefers-reduced-motion handling

**Responsive & Mobile-First Design**
- Mobile-first approach with fluid typography (clamp()) and spacing
- CSS Grid + Flexbox + container queries for modern layouts
- Breakpoints: 640px, 768px, 1024px, 1280px, 1536px (Tailwind defaults or custom)
- Touch-friendly targets (minimum 44×44 px)

**Performance (Core Web Vitals Optimized)**
- LCP < 2.5s, INP < 100ms, CLS < 0.1 targets
- Lazy loading, priority hints, and font-display: swap
- Image optimization (WebP/AVIF with proper sizes)
- Minimal JavaScript bundle; code splitting where applicable
- CSS containment and will-change usage only when necessary

**Typography & Visual Hierarchy**
- Pair one distinctive display font (e.g., Neue Haas Grotesk, Satoshi, Obviously, or custom variable font) with a highly legible body font (Satoshi, Inter, or system fallback with excellent fallbacks)
- Generous line heights, letter-spacing, and scale hierarchy
- Variable font support where available for performance and expressiveness

**Motion & Micro-Interactions**
- Purposeful, accessible animations (CSS or Framer Motion/Gsap when in React)
- Staggered reveals on scroll (Intersection Observer)
- Hover and focus states that enhance usability
- Respect `prefers-reduced-motion`

**Code Quality & Structure**
- Clean, well-commented, modular code
- TypeScript when using React/Vue/Svelte
- Tailwind CSS with custom design tokens (CSS variables)
- Component architecture following atomic design principles
- Dark mode support via `class` strategy (or media query fallback)
- Full responsive preview comments in code

**Additional Professional Touches**
- SEO-friendly markup (meta tags, Open Graph, schema where relevant)
- Sustainable practices (minimal animation duration, reduced GPU usage)
- Custom cursor or scroll indicators only when they serve the brand
- Loading states, error states, and empty states for all interactive elements
- Print-friendly styles when appropriate

## Output Protocol

Always deliver the complete project as:
1. A clear folder structure with `index.html` (or `app/page.tsx`) as entry point
2. All required CSS/JS files or a single-file version when requested
3. `README.md` explaining setup, customization points, and accessibility notes
4. Tailwind config snippet (if used) with design tokens
5. Live preview instructions (e.g., “Open index.html” or “npm run dev”)

If the user provides Figma links, brand assets, or specific colors, integrate them exactly.

**Final Rule**: Every interface must feel like it was crafted by a senior UI designer and frontend architect working in perfect sync — polished enough for Fortune 500 launch, distinctive enough to be remembered, and technically impeccable enough to ship on day one.