# Nuxt Frontend GUIDELINES.md Template

Use this file as the starting point for a project- or feature-level `GUIDELINES.md`.

`GUIDELINES.md` is the local implementation and review companion to `DESIGN.md`.

- `DESIGN.md` owns visual identity, tokens, and design rationale
- `GUIDELINES.md` owns implementation, architecture, reuse, hardening, performance, and audit behavior
- when a visual rule conflicts between the two files, `DESIGN.md` wins
- when a feature area has its own closer `GUIDELINES.md`, that local file overrides a broader project- or app-level one for that subtree

If a `GUIDELINES.md` already exists, complement it instead of rewriting it wholesale. Preserve valid project-specific wording and structure.

---

## Purpose

Use this document to align:

- product and interface context that affects implementation choices
- page composition mode where it changes layout or shell decisions
- component architecture and ownership boundaries
- local wrappers, primitives, and reuse expectations
- hardening, performance, and audit expectations

If a repeated implementation pattern becomes stable, update this file instead of rediscovering it in one-off plans and reviews.

---

## Product and Interface Context

- Who uses this app or feature
- What job they are trying to get done
- What the primary register is for this app area: `brand`, `product`, or `hybrid`
- What implementation constraints follow from that usage context

---

## Mode and Route Mapping

Classify the primary mode of this app or feature area:

- `landing` — marketing, brand-led, imagery-first
- `product-ui` — operational, utility-first, dense and readable
- `hybrid` — both, with route ownership called out explicitly

If relevant, list which routes or layouts belong to which mode.

> For mode-specific visual rules, see `nimbou-skills:nuxt-design-composition` and the local `DESIGN.md`.

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

- **Page owns**: route params, query sync, initial data loading, top-level actions, passing stable props down
- **Domain component owns**: local rendering, local interaction, local validation and formatting, emits only when the parent really owns the next decision
- **Composable owns**: reactive state reused across views, async plus loading/error state, extracted script weight
- **Util owns**: pure stateless transforms reused in multiple places
- **Config owns**: declarative lists such as tabs, steps, table columns, and menus

### Extraction Triggers (local rules)

- Repeated semantic markup in 3+ places -> component
- SFC exceeds 150 lines -> review; exceeds 300 lines -> split
- API grows to 5+ props or 2+ named slots -> likely split responsibility
- Reactive logic leaves its view -> composable
- Do not extract speculative reuse. The second real consumer is the trigger.

### Communication

- `<= 2` levels: props + emits
- `3` levels in the same subtree: `provide` / `inject` regional
- Multi-route, cross-tree, app state: Pinia store
- `v-model` / `defineModel` only when the child genuinely manages the value

### Anti-patterns (local)

- List project-specific anti-patterns the team has hit before

> See `nimbou-skills:nuxt-design-architecture` for the generic ruleset.

---

## UI Primitives and Layout

- Preferred page shells, section shells, and form/layout primitives
- Preferred Vuetify components and local wrappers
- Preferred composition patterns that implementation should reuse by default

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

- Avoid duplicate fetches and overlapping watchers
- Guard browser-only APIs when SSR or hydration is involved
- Prefer observable state transitions over timeout-based sequencing
- Keep assets, requests, and reactive work proportional to the feature

---

## Naming and Organization

- Keep names domain-first and intention-revealing
- Put domain components near their feature area
- Keep shared primitives and broad UI building blocks clearly separated from domain components
- Favor predictable file placement over clever naming

---

## Audit Expectations

Frontend review (`nuxt-audit`) audits primarily against the nearest local `GUIDELINES.md` plus the nearest local `DESIGN.md`.

Coverage:

- ownership and architecture
- reuse and extraction
- hardening gaps
- performance issues
- polish and consistency drift
- Nuxt and Vuetify conventions
- catalog health when reusable components exist

---

## When To Update This File

Update `GUIDELINES.md` when:

- a pattern becomes stable and repeatable
- a recurring refactor keeps reaching the same conclusion
- a shared primitive becomes the preferred solution
- a review rule should become explicit instead of being rediscovered each time
- a generic skill posture proved too loose or too tight for this project and needs a local implementation override
