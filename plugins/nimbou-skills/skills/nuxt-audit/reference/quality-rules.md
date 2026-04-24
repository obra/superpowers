# Quality Rules

## Design File First

- Local `GUIDELINES.md` beats generic implementation preference.
- Local `DESIGN.md` beats generic visual preference.
- App-level or root-level `GUIDELINES.md` and `DESIGN.md` are fallback, not override, when a closer file exists.
- If implementation repeats a known primitive or composition rule, audit against `GUIDELINES.md` before proposing new structure.
- Audit primarily against the local `GUIDELINES.md` plus the local `DESIGN.md`. Only fall back to `nimbou-skills:nuxt-design-posture` / `nimbou-skills:nuxt-design-composition` / `nimbou-skills:nuxt-design-architecture` for dimensions the project chose not to declare locally.

## Ownership and Architecture

- Pages orchestrate data loading, route state, and high-level actions.
- Child components own local display behavior and local interaction loops.
- Composables hold reusable reactive behavior.
- Utils stay pure and stateless.
- Avoid prop drilling across 3+ layers when composable or provide/inject is a better fit.
- Avoid page-level god handlers for child-only interactions.
- For the generic ruleset (tiers, SOLID per layer, communication contracts, testability), see `nimbou-skills:nuxt-design-architecture`.

## Extraction and Reuse

- Repeated semantic markup should become a component.
- Repeated reactive behavior should become a composable.
- Declarative tables, tabs, menus, and step flows should move toward config.
- Do not extract hypothetical reuse. Prefer the second real consumer as the trigger.
- Flag hard-coded spacing, colors, or one-off variants that should be driven by existing primitives or tokens.
- For the generic ruleset (extraction heuristics, refactor triggers, SFC size thresholds), see `nimbou-skills:nuxt-design-architecture`.

## Hardening

- Every user-visible flow should define loading, empty, error, and success states.
- Long text, missing data, and large collections should not break layout or interaction.
- Flag missing overflow handling, truncation strategy, or responsive collapse behavior.
- Flag i18n-hostile layouts and text assumptions when strings are likely to grow.
- Error states should guide recovery, not just surface failure.

## Performance

- Avoid duplicate fetches caused by overlapping watchers and lifecycle hooks.
- Flag hydration-risk patterns such as direct browser API access without guards.
- Prefer stable, observable conditions over timeout-based UI sequencing.
- Flag unnecessary re-renders, deep reactive churn, oversized assets, and request waterfalls.
- Prefer Nuxt-native loading and data primitives before custom client-side workarounds.

## Polish

- Alignment and spacing should follow the nearest established primitive or layout rhythm.
- Copy should be consistent with the local feature tone and action model.
- States, buttons, and section headers should not compete for the same visual weight.
- Flag seams where a feature is technically correct but visibly unfinished or inconsistent.

## Nuxt

- Pages orchestrate components; they do not own reusable business widgets.
- Avoid manual imports that Nuxt auto-imports already cover.
- Prefer route ownership and composable boundaries that match the feature shape.

## Vuetify

- Do not target internal Vuetify classes as the primary contract.
- Avoid deep selector chains and unnecessary `!important`.
- Prefer refining existing Vuetify primitives instead of rebuilding them.

## CSS and SCSS

- Keep nesting shallow.
- Prefer layout primitives over one-off spacing hacks.
- Flag selectors that are too specific to survive refactors.
- Favor component-scoped clarity over global overrides.

## Catalog

- Every reusable component should carry `<catalog lang="json">`.
- Broken semantic references are audit findings.
- Missing or stale metadata on actively reused components is at least `Atencao`.
