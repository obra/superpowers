# GUIDELINES.md Example

Fictional project. Use this file as a concrete reference when filling a real `GUIDELINES.md` via `/design-md`. It shows the implementation and review rules that belong outside `DESIGN.md`.

Do not copy this as-is. Copy the structure and the level of specificity only.

Project: **Haven** — observability SaaS for SRE teams, with marketing routes at `/` and authenticated product routes at `/app/*`.

---

## Product and Interface Context

- **Audience**: SREs and platform engineers who work in dense, data-heavy sessions
- **Job**: correlate alerts, logs, and metrics without leaving the workspace
- **Implementation consequence**: every route must prioritize scan speed, keyboard reachability, and compact but readable data presentation

---

## Mode and Route Mapping

- `/`, `/pricing`, `/blog/*` -> `landing`, owned by `layouts/marketing.vue`
- `/app/*` -> `product-ui`, owned by `layouts/app.vue`
- `marketing` and `app` components do not import each other directly; shared pieces move to `components/ui/`

---

## Component Architecture

### Tiers (paths reais)

| Tier | Location | Prefix | Notes |
|---|---|---|---|
| Primitive | `components/ui/` | `App*` | Thin Vuetify wrappers with no domain coupling |
| Domain component | `components/<feature>/` | feature-first | Local to `/app/*` features |
| Marketing block | `components/marketing/` | `Marketing*` | Only for `layouts/marketing.vue` |
| Page / Route owner | `pages/` | route-colocated | Data + orchestration only |
| Layout shell | `layouts/` | `marketing.vue`, `app.vue` | Persistent chrome only |

### Ownership

- **Page owns**: route state, initial fetches, query sync, and top-level actions
- **Domain component owns**: local rendering and local interaction
- **Composable owns**: shared reactive state such as `useIncidents()` and `useAlertInspector()`
- **Util owns**: pure transforms such as `formatDuration()` and `severityToColor()`
- **Config owns**: `incidentColumns`, `navSections`, and other declarative lists

### Extraction Triggers

- SFC > 180 lines -> review; > 250 lines -> split
- Public API with >= 4 props -> reassess responsibility
- Same watcher or computed repeated in 2 places -> extract composable

### Communication

- Props + emits up to 2 levels
- `provide` / `inject` for inspector state in the same route subtree
- Pinia only for auth, user preferences, and live alerts
- `defineModel` for shared input value ownership

### Anti-patterns

- No direct Pinia imports inside domain components
- No `setInterval` in components; use composables with cleanup
- No `v-html` without documented sanitization

---

## UI Primitives and Layout

- `AppTable` wraps `v-data-table-virtual` and is mandatory above 200 rows
- `AppInspector` is the standard right-side detail surface
- `AppEmpty` is the standard empty-state primitive
- New shared UI primitives land in `components/ui/` with `<catalog>` metadata

---

## Hardening Expectations

- Loading uses in-place skeletons, not global overlays
- Empty states explain the state and suggest a next action
- Errors stay inline with manual retry unless auth breaks globally
- Product routes collapse left rail below tablet and turn inspector into fullscreen modal on small screens

---

## Performance Expectations

- `useLazyFetch` for non-critical lists; `useFetch` only for first-paint data
- Single shared WebSocket connection via plugin
- No direct `window` or `document` access outside guarded client hooks
- `/app/*` should stay under the local route-group bundle budget

---

## Naming and Organization

- Domain components use PascalCase feature-first names such as `IncidentRow`
- Composables use `use*`
- Utils stay verb-first
- Config files stay plural and declarative

---

## Audit Expectations

- No raw `v-data-table` when `AppTable` exists
- No component in `/app/*` imports Pinia directly
- No undocumented visual exceptions to the rules in `DESIGN.md`
- Dark-mode critical states must preserve WCAG AA contrast

---

## When To Update This File

- A new pattern repeats twice and should become default
- Reviews keep flagging the same ownership or reuse problem
- A local wrapper becomes mandatory for a common UI surface
