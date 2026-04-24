---
name: nuxt-think
description: Explore Nuxt 4 + Vuetify 3 frontend requests, reuse the catalog when present, and return a structured design brief without editing code.
---

# Nuxt Think

## Purpose

Clarify what to build before frontend implementation. Consult `components.meta.json` when it exists, or `.generated/component-catalog/components.meta.json` when the project ships the slim catalog mirror, ask only the minimum useful questions, and challenge weak component boundaries.

Use this skill instead of `nestjs-think` when the request is clearly Nuxt/Vuetify-first.
Use `feat-spec` when the request changes both frontend and backend or depends on a new backend contract.

This skill owns discovery and design closure for frontend work. Resolve UI structure, reuse choices, state ownership, user interactions, and responsive behavior here so `nuxt-plan` can stay focused on execution topology.

Before closing decisions, locate the nearest `DESIGN.md` and `GUIDELINES.md` in the target project for the feature area you are shaping. Start from the likely ownership directory for the route, page, or domain component, then walk upward. Prefer the closest file. In a monorepo, the relevant app-level files are the default baseline and a closer feature-level file can override them.

## Domain Specification Gate

Apply this gate during step 6 of `## Flow`, before considering the design step closed.

Before closing design decisions:

1. identify the target domain
2. use `doc-domain` to create or update `docs/domain/<domain>/domain.md`
3. use `doc-gherkin` to create or update `docs/domain/<domain>/*.feature`
4. if the feature adds or changes an HTTP contract, use `doc-openapi` to create or update `docs/domain/<domain>/openapi.yaml`
5. present the domain, Gherkin, and OpenAPI artifacts for approval
6. only after approval, invoke `nuxt-plan`
7. do not advance to `nuxt-plan` with stale domain, Gherkin, or OpenAPI artifacts
8. if state transitions changed, regenerate the affected `.feature` files before planning
9. do not do the `domain.md`, `*.feature`, or `openapi.yaml` work inline inside `nuxt-think`; delegate it to the shared spec skills

Treat `docs/domain/<domain>/` as the canonical specification bundle for the feature slice. If the request touches multiple independent domains, split them and close one domain at a time.

## Flow

1. Read `components.meta.json` when available. Fall back to `.generated/component-catalog/components.meta.json` when the project exposes only the slim catalog.
2. Read the nearest `DESIGN.md` and `GUIDELINES.md` that apply to the target area in the target project. If one or both do not exist, note that explicitly, continue, and suggest generating or refreshing them with `/design-md`.
3. Classify the request as simple, medium, or complex.
4. Search for reusable components by `tags`, `category`, and `domain`. Use `useWhen` only when the rich catalog includes it.
5. Ask focused follow-up questions only when the request still has material ambiguity.
6. Close the design decisions that matter for implementation:
   - what screen, route, modal, or dashboard slice owns the work
   - which existing components are reused versus newly created
   - what loading, empty, error, and success states must exist
   - what user interactions change navigation, filtering, or local state
   - what responsive layout shifts matter
   - what existing primitives, shells, or local patterns from `DESIGN.md` and `GUIDELINES.md` must be preferred
   - what visual direction should guide the UI so it does not drift into generic output
7. Produce the structured output below with the generated specification artifacts, present it for approval, and only then hand off to `nuxt-plan`. Do not write code.

Consult `nimbou-skills:nuxt-design-architecture`, the local `GUIDELINES.md`, and the local `DESIGN.md` before proposing component splits. `GUIDELINES.md` owns implementation rules; `DESIGN.md` owns visual rules and wins on visual conflict.

## Think Output

### O que construir

Describe the requested page, flow, or component in one sentence.

### Componentes a reutilizar

- `ProjectStatusBadge` - reuse when the request needs project lifecycle display.

### Componentes a criar

- `ProjectDetailsSidebar` - summarize project metadata and actions.

### Composables/Utils/Config

- `useProjectDetails` - keep reactive fetch and transformation logic outside the page component.

### Decisoes tomadas

- Split the header and sidebar because the concerns and reuse surface are different.

### Direcao visual

- State the intended tone in one short line.
- Prefer existing shells, spacing, and primitives from `DESIGN.md` and `GUIDELINES.md` before inventing new presentation patterns.
- Call out any anti-genericity guardrails that matter for this feature, such as density, emphasis, or when to stay visually quiet.
- **RELATED SKILLS:** Use `nimbou-skills:nuxt-design-composition` to frame page hierarchy, hero, and landing vs product UI mode. Use `nimbou-skills:nuxt-design-posture` to close micro aesthetic details (fonts, color tokens, CSS bans). Use `nimbou-skills:nuxt-design-architecture` to frame component tiers, SOLID boundaries, extraction rules, and communication contracts. Local `GUIDELINES.md` owns implementation constraints; local `DESIGN.md` still wins on visual conflict.

### Estados e interacoes

- Loading: show skeletons in the main content area.
- Empty: show a neutral empty state when no records exist.
- Error: show inline retry feedback near the failing block.
- Interaction: sidebar actions trigger navigation and local refresh only.

### Responsividade

- Collapse the sidebar below tablet width.
- Preserve the header summary above the content stack on mobile.

### Pronto para planejar

- Route ownership, reuse decisions, state behavior, and responsive behavior are closed.
- `docs/domain/<domain>/domain.md` approved.
- `docs/domain/<domain>/*.feature` approved.
- `docs/domain/<domain>/openapi.yaml` approved when the feature changes HTTP.
- The relevant `DESIGN.md` and `GUIDELINES.md` constraints are closed.
- `nuxt-plan` should only turn this into exact file paths, dependency order, and execution groups.
