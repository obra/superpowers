# Nuxt Frontend DESIGN.MD Template

Use this file as the starting point for a project- or feature-level `DESIGN.MD`.

`DESIGN.MD` is the **single source of truth** for frontend standards in this project. `nuxt-think`, `nuxt-plan`, and `nuxt-audit` consult it first and always. The generic skills (`nuxt-design-posture`, `nuxt-design-composition`, `nuxt-design-architecture`) are posture/fallback when the local file does not declare a dimension.

When a feature area has its own closer `DESIGN.MD`, that local file overrides a broader project- or app-level one for that subtree.

---

## Purpose

Use this document to align:

- product and interface context
- page composition mode (landing / product UI / hybrid)
- visual posture (typography, color, spacing, absolute bans)
- component architecture (tiers, SOLID boundaries, communication contracts)
- hardening, performance, and audit expectations

If a repeated pattern becomes stable, update this file instead of rewriting the same rationale in one-off plans.

---

## Product and Interface Context

- Who uses this app or feature
- What job they are trying to get done
- What tone the interface should communicate
- What this should explicitly avoid looking like

---

## Mode

Classify the primary mode of this app or feature area:

- `landing` — marketing, brand-led, imagery-first
- `product-ui` — operational, utility-first, dense and readable
- `hybrid` — both (e.g. marketing site + logged-in app), with section noting which routes belong to which mode

> For mode-specific rules (landing hero canon, product UI restraint, utility copy rules), see `nimbou-skills:nuxt-design-composition`.

---

## Visual Posture

Declare the local visual posture. Everything here overrides the generic skill.

### Typography

- Display font (with rationale): _e.g. "Söhne Breit for headings — geometric, opinionated, matches mechanical brand voice"_
- Body font (with rationale): _e.g. "Inter Tight for body — neutral, high x-height for dense dashboards"_
- Scale (fluid `clamp` on marketing, fixed `rem` on product UI)

### Color & Theme

- Hue base (OKLCH) and rationale.
- Theme default (`light` / `dark` / system) and why, tied to audience context.
- Neutral tint chroma (typically `0.005-0.01` toward brand hue).
- Accent usage rule (60-30-10 weight).

### Spacing

- Token scale (default 4pt: 4, 8, 12, 16, 24, 32, 48, 64, 96) or documented override.
- Token naming (semantic `--space-sm`, not `--spacing-8`).

### Absolute Bans Accepted Locally

- List any project-specific exceptions to the generic bans, with rationale. Default is "no exceptions" — keep `border-left > 1px` and `background-clip: text` gradients banned.

> For deeper rules (`reflex_fonts_to_reject`, theme selection by context, OKLCH reasoning, CSS patterns), see `nimbou-skills:nuxt-design-posture`.

---

## Page Composition

Required when Mode is `landing` or `hybrid`. Optional for `product-ui` (section replaced by Product UI Shell below).

### Canonical Page Sequence

- Default section order: _Hero → Support → Detail → Final CTA_
- Deviations (e.g. landing variants for campaigns)

### Hero Rules

- Full-bleed canonical (edge-to-edge, inner text column constrained)
- Order: brand first, headline second, body third, CTA fourth
- Viewport budget (`calc(100svh - header-height)` or overlay header)
- Destructive tests: remove image → still works? hide nav → brand disappears?

### Motion Ritmo

- 2-3 intentional motions for landing (hero entrance, scroll-linked, hover/reveal)
- 1 motion for product UI transitions (drawer, skeleton → content)

> See `nimbou-skills:nuxt-design-composition` for working model (visual/content/interaction thesis), hero anti-patterns, and product UI shell restraint.

---

## Component Architecture

How this project decomposes its UI. Everything here overrides the generic skill.

### Tiers (local layout)

| Tier | Location | Naming | Notes |
|---|---|---|---|
| Primitive | `components/ui/` | `AppButton`, `AppCard` | No domain coupling |
| Domain component | `components/<feature>/` | `ProjectCard`, `OrderLineRow` | Feature-local |
| Page / Route owner | `pages/` | route-colocated | Orchestrates only |
| Layout shell | `layouts/` | `default.vue`, `admin.vue` | Chrome only |

### Ownership (SOLID applied)

- **Page owns**: route params, query sync, initial data loading, top-level actions, passing stable props down.
- **Domain component owns**: local rendering, local interaction, local validation/formatting, emits only when the parent really owns the next decision.
- **Composable owns**: reactive state reused across views, async + loading/error state, extracted script weight.
- **Util owns**: pure stateless transforms reused in multiple places.
- **Config owns**: declarative lists (tabs, steps, table columns, menu items).

### Extraction Triggers (local rules)

- Repeated semantic markup in 3+ places → component.
- SFC exceeds 150 lines → review; exceeds 300 lines → split.
- API grows to 5+ props or 2+ named slots → likely split responsibility.
- Reactive logic leaves its view → composable.
- "Do not extract speculative reuse. The second real consumer is the trigger."

### Communication

- `≤ 2` levels: props + emits.
- `3` levels in the same subtree: `provide` / `inject` regional.
- Multi-route, cross-tree, app state: Pinia store.
- `v-model` / `defineModel` only when the child genuinely manages the value.

### Anti-patterns (local)

- List project-specific anti-patterns the team has hit before (emit bubbling across 3+ levels, god props > N, etc.).

> See `nimbou-skills:nuxt-design-architecture` for the generic ruleset: tier definitions, SOLID per layer, composable vs util vs config vs plugin, refactor triggers, testability as criterion.

---

## UI Primitives and Layout

- Preferred page shells, section shells, and form/layout primitives (name the ones this project actually uses).
- Preferred Vuetify components and local wrappers.
- Preferred composition (flat over deep, spacing rhythm, responsive adaptation over compression).

---

## Hardening Expectations

Every significant flow should account for:

- loading
- empty
- error
- success
- long text
- missing data
- large collections
- small screens
- likely i18n expansion

If a feature cannot survive those cases, it is not ready.

---

## Performance Expectations

- Avoid duplicate fetches and overlapping watchers.
- Guard browser-only APIs when SSR or hydration is involved.
- Prefer observable state transitions over timeout-based sequencing.
- Keep assets, requests, and reactive work proportional to the feature.

---

## Naming and Organization

- Keep names domain-first and intention-revealing.
- Put domain components near their feature area.
- Keep shared primitives and broad UI building blocks clearly separated from domain components.
- Favor predictable file placement over clever naming.

---

## Audit Expectations

Frontend review (`nuxt-audit`) audits **primarily against this `DESIGN.MD`**. When a dimension is not declared here, the generic skills (`nuxt-design-posture`, `nuxt-design-composition`, `nuxt-design-architecture`) are the fallback.

Coverage:

- ownership and architecture
- reuse and extraction
- visual posture drift
- page composition drift (mode, hero, motion)
- hardening gaps
- performance issues
- polish and consistency drift
- Nuxt and Vuetify conventions
- catalog health when reusable components exist

---

## When To Update This File

Update `DESIGN.MD` when:

- a pattern becomes stable and repeatable
- a recurring refactor keeps reaching the same conclusion
- a shared primitive becomes the preferred solution
- a review rule should become explicit instead of being rediscovered each time
- a generic skill posture proved too loose or too tight for this project and needs local override
