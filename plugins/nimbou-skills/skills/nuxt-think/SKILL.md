---
name: nuxt-think
description: Explore Nuxt 4 + Vuetify 3 frontend requests, reuse the catalog when present, and return a structured design brief without editing code.
---

# Nuxt Think

## Purpose

Clarify what to build before frontend implementation. Consult `components.meta.json` when it exists, or `.generated/component-catalog/components.meta.json` when the project ships the slim catalog mirror, ask only the minimum useful questions, and challenge weak component boundaries.

Use this skill instead of `nestjs-think` when the request is clearly Nuxt/Vuetify-first.
Use `feat-spec` when the request changes both frontend and backend or depends on a new backend contract.
Use `change-spec` when the request changes both frontend and backend in an existing flow.

This skill owns discovery and design closure for frontend work. Resolve UI structure, reuse choices, state ownership, user interactions, and responsive behavior here so `nuxt-plan` can stay focused on execution topology.

Before closing decisions, locate the nearest `DESIGN.md` and `GUIDELINES.md` in the target project for the feature area you are shaping. Start from the likely ownership directory for the route, page, or domain component, then walk upward. Prefer the closest file. In a monorepo, the relevant app-level files are the default baseline and a closer feature-level file can override them.

## Domain Specification Gate

Apply this gate during step 6 of `## Flow`, before considering the design step closed.

Before closing design decisions:

1. identify the target domain
2. confirm `docs/domain/<domain>/domain.md` is approved
3. confirm the relevant `docs/domain/<domain>/*.feature` files are approved
4. for HTTP features, confirm `docs/domain/<domain>/openapi.yaml` is approved and treat it as the canonical transport contract
5. only after approval, invoke `nuxt-plan`
6. do not advance to `nuxt-plan` with stale domain, Gherkin, or OpenAPI artifacts
7. do not redefine the HTTP contract inside `nuxt-think`; consume the approved `openapi.yaml`

Treat `docs/domain/<domain>/` as the canonical specification bundle for the feature slice. If the request touches multiple independent domains, split them and close one domain at a time.

## Flow

1. Read `components.meta.json` when available. Fall back to `.generated/component-catalog/components.meta.json` when the project exposes only the slim catalog.
2. Read the nearest `DESIGN.md` and `GUIDELINES.md` that apply to the target area in the target project. If one or both do not exist, note that explicitly, continue, and suggest generating or refreshing them with `/design-md`.
3. Classify the request as simple, medium, or complex.
4. Search for reusable components by `tags`, `category`, and `domain`. Use `useWhen` only when the rich catalog includes it.
5. Ask focused follow-up questions only when the request still has material ambiguity. When the question reduces to 2-4 discrete, mutually-exclusive options, use the `AskUserQuestion` tool — do not narrate the options as free-form prose.
6. Close the design decisions that matter for implementation:
   - what product context affects the implementation posture, such as dense data, keyboard-heavy use, responsive priority, or long-session workflows
   - what screen, route, modal, or dashboard slice owns the work
   - which existing components are reused versus newly created
   - whether the target project already has local wrappers or primitives for forms, tables, dialogs, filters, empty states, feedback, or entity autocompletes that should be preferred over local markup
   - where state should live by locality: child, page, subtree composable, or app-wide store
   - whether communication should use props/emits, `defineModel`, `provide`/`inject`, or Pinia
   - what loading, empty, error, and success states must exist
   - what inline feedback or autosave behavior must be observable when the flow edits data in place
   - what user interactions change navigation, filtering, or local state
   - what responsive layout shifts matter
   - what performance constraints matter, such as avoiding duplicated fetch ownership between page and composable or avoiding mirrored watchers
   - what existing primitives, shells, or local patterns from `DESIGN.md` and `GUIDELINES.md` must be preferred
   - what visual direction should guide the UI so it does not drift into generic output
   - what local anti-patterns must be avoided, such as rebuilding an existing shell locally, creating a store for simple parent-child communication, or pushing child-only handlers up into the page
7. Produce the structured output below with explicit references to the approved specification artifacts, present it for approval, and only then hand off to `nuxt-plan`. Do not write code.

Consult `nimbou-skills:nuxt-design-architecture`, the local `GUIDELINES.md`, and the local `DESIGN.md` before proposing component splits. `GUIDELINES.md` owns implementation rules; `DESIGN.md` owns visual rules and wins on visual conflict.

## How To Ask The User

Decisions inside this skill that should use `AskUserQuestion` when they resolve to 2-4 discrete options:

- which existing component or wrapper to reuse versus creating a new one
- where state lives (child component, page, subtree composable, app-wide store)
- which communication primitive to use (props/emits, `defineModel`, `provide/inject`, Pinia)
- which responsive posture to take when more than one is viable
- which inline-feedback vs toast posture to use when the project supports both

Lead with your recommendation as the first option and append `(Recommended)` to its label. Keep options to 2-4.

Do not use `AskUserQuestion` for:

- open naming, copy, or visual-direction prose
- yes/no confirmations of an already-recommended path
- plan-approval gates — those belong to the structured-output review step, not a multiple-choice question

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
- Keep state at the lowest level that serves all consumers; do not invent a store when props/emits or a local composable already solve it.
- Reuse local wrappers for forms, tables, dialogs, empty states, and entity selection before creating equivalent feature-local markup.

### Direcao visual

- State the intended tone in one short line.
- Prefer existing shells, spacing, and primitives from `DESIGN.md` and `GUIDELINES.md` before inventing new presentation patterns.
- Call out any anti-genericity guardrails that matter for this feature, such as density, emphasis, or when to stay visually quiet.
- **RELATED SKILLS:** Use `nimbou-skills:nuxt-design-composition` to frame page hierarchy, hero, and landing vs product UI mode. Use `nimbou-skills:nuxt-design-posture` to close micro aesthetic details (fonts, color tokens, CSS bans). Use `nimbou-skills:nuxt-design-architecture` to frame component tiers, SOLID boundaries, extraction rules, and communication contracts. Local `GUIDELINES.md` owns implementation constraints; local `DESIGN.md` still wins on visual conflict.

### Estados e interacoes

- Loading: show skeletons in the main content area.
- Empty: show a neutral empty state when no records exist.
- Error: show inline retry feedback near the failing block.
- Success: prefer inline confirmation when the action is local and obvious; avoid redundant toast noise when the UI already proves success.
- Interaction: sidebar actions trigger navigation and local refresh only.

### Responsividade

- Collapse the sidebar below tablet width.
- Preserve the header summary above the content stack on mobile.
- Preserve scanability for dense or tabular flows before optimizing decorative layout moves.

### Pronto para planejar

- Route ownership, reuse decisions, state behavior, and responsive behavior are closed.
- `docs/domain/<domain>/domain.md` approved.
- `docs/domain/<domain>/*.feature` approved.
- `docs/domain/<domain>/openapi.yaml` approved when the feature changes HTTP.
- The relevant `DESIGN.md` and `GUIDELINES.md` constraints are closed.
- `nuxt-plan` should only turn this into exact file paths and execution waves (parallel-by-default, sequential only for contract dependencies).
