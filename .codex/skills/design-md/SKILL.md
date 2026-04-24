---
name: design-md
description: Use when a Nuxt/Vuetify app needs a Google-format DESIGN.md created or refreshed, with a local GUIDELINES.md added or complemented for implementation and review rules.
---

# Generate DESIGN.MD

Use this skill when the user wants frontend design guidance created, refreshed, or standardized for a Nuxt/Vuetify project.

## Core Rules

- Explore first, ask second
- Prefer the real app root over the monorepo root when the target lives inside one app
- Generate concrete guidance, not placeholders
- Resolve the current file state before deciding what to write
- Infer a `register` hypothesis early: `brand`, `product`, or `hybrid` with one primary default
- `DESIGN.md` must follow the Google `design.md` format shape used in `skills/nuxt-audit/reference/design-md-template.md`
- `GUIDELINES.md` is the local implementation companion, using `skills/nuxt-audit/reference/guidelines-template.md`
- If a useful `DESIGN.md` or `GUIDELINES.md` already exists, update it instead of replacing good project-specific guidance with generic prose
- Never silently overwrite an existing `DESIGN.md` or rewrite an existing `GUIDELINES.md` from scratch
- Keep visual identity and design tokens in `DESIGN.md`; keep implementation, architecture, audit, and review rules in `GUIDELINES.md`
- When both files mention a visual rule, `DESIGN.md` wins

## Phase 1: Resolve Target Scope

1. Capture the target from the user's request.
2. If the target is a monorepo:
   - identify the relevant app or package root and use that app root as the default write location
3. If the target is not a monorepo:
   - use the repository root as the default write location
4. If the user named a route, feature, or path:
   - map it to the owning app first

## Phase 2: Resolve Existing File State

Inspect the resolved root and decide from the actual file state before asking anything:

- neither file exists -> create both files
- only `DESIGN.md` exists -> refresh `DESIGN.md` only if drift is clear; otherwise keep it and create or complement `GUIDELINES.md`
- only `GUIDELINES.md` exists -> create `DESIGN.md` and complement `GUIDELINES.md` only where strategic or implementation context is missing
- both files exist -> infer which one is stale when possible; if that cannot be inferred safely, ask the user which file should be refreshed

If a legacy or unusual local structure exists, preserve the project-specific parts and merge into them instead of flattening them into the template.

## Phase 3: Explore Before Asking

Inspect the target project in this order so extraction stays concrete and repeatable:

- README and local docs
- package and workspace manifests
- CSS custom properties and global styles
- Tailwind config, theme files, and design token files
- app layout shells
- shared UI primitives and key routed surfaces
- page, component, and composable structure
- brand assets such as logos, favicons, and named brand colors
- repeated patterns that clearly deserve to become explicit design guidance
- rendered output, if a real running surface or browser evidence exists
- any existing `DESIGN.md` or `GUIDELINES.md`

Form a `register` hypothesis from what you find:

- `brand` -> marketing routes, landing-page-shaped composition, hero-led storytelling, editorial content
- `product` -> app shell, auth flows, tables, forms, settings, dashboards, operational work
- `hybrid` -> both exist, but still decide which one is the primary default for the target root

Summarize what you learned before asking questions, including:

- what is already explicit in code
- what is only implicit and needs wording
- the current file state
- the `register` hypothesis

## Phase 4: Choose `scan` or `seed` mode

Choose by evidence, not by user phrasing:

- `scan mode` -> the project already has tokens, components, theme files, or rendered UI worth extracting
- `seed mode` -> the project is pre-implementation or too empty to extract a real system from code

If the scan finds no meaningful tokens, no reusable UI, and no rendered surface, offer `seed mode` explicitly instead of silently switching.

## Phase 5: Ask Only What Exploration Cannot Tell You

Ask only the missing high-impact strategic and qualitative questions, such as:

- whether the inferred `register` (`brand` / `product` / primary `hybrid`) is correct
- who uses the product and in what context
- what job they are trying to get done
- what tone the interface should communicate
- what the product should explicitly not feel like
- whether there is a named creative north star worth carrying into the `DESIGN.md` prose
- whether any project-specific patterns should be declared as required defaults in `GUIDELINES.md`

Do not ask questions the codebase already answered.
Do not ask about colors, fonts, spacing, radius, or motion if the codebase already exposes them.

## Phase 6: Create or Refresh `DESIGN.md`

Use `skills/nuxt-audit/reference/design-md-template.md` as the base structure, and consult `skills/nuxt-audit/reference/design-md-example.md` for the expected level of specificity.

The resulting `DESIGN.md` should:
- follow the Google `design.md` format: YAML front matter for tokens plus the canonical prose sections
- stay specific to the target app
- reflect the real visual system already present in the codebase
- avoid implementation-policy sections that belong in `GUIDELINES.md`
- auto-extract as much as possible from real code in `scan mode`
- stay intentionally minimal in `seed mode`, marked by explicit hypotheses rather than fake precision
- stay free of filler such as `TBD`, `TODO`, or vague brand language

If a `DESIGN.md` already exists:
- preserve the good project-specific rules
- remove contradictions and stale guidance
- tighten generic language
- never throw away specific extracted tokens just to fit a prettier generic narrative

When extracting into front matter:

- do not invent `secondary`, `tertiary`, or extra scale steps that the project does not actually use
- keep token keys close to the project's real naming when that naming is already coherent
- use prose to explain role and tone; use tokens to hold the normative values

## Phase 6b: Validate `DESIGN.md` With The Google CLI

After writing or updating `DESIGN.md`, validate it with the official CLI:

- prefer `design.md lint <path-to-DESIGN.md>` when the bootstrap installed the global binary
- otherwise run `npx @google/design.md lint <path-to-DESIGN.md>`

Validation rules:

- if lint reports errors, fix the file before considering the work complete
- if lint reports warnings, keep fixing the ones caused by bad references, broken structure, or avoidable schema drift
- if a warning is intentional because the project keeps a non-Stitch-native value such as OKLCH in front matter, keep the value and call the warning out explicitly in the result
- do not claim the file is complete without mentioning the effective lint result

## Phase 7: Create or Refresh `GUIDELINES.md`

Use `skills/nuxt-audit/reference/guidelines-template.md` as the base structure, and consult `skills/nuxt-audit/reference/guidelines-example.md` for granularity.

When writing each section, consult the corresponding skill as the source of generic posture, and let local project decisions override:

- **Mode** and **Page Composition** -> `nimbou-skills:nuxt-design-composition`
- **Visual implementation guardrails** -> `nimbou-skills:nuxt-design-posture`
- **Component Architecture** -> `nimbou-skills:nuxt-design-architecture`

The resulting `GUIDELINES.md` should:
- capture implementation, architecture, reuse, hardening, performance, and audit rules for the target app
- reference local primitives, wrappers, and ownership boundaries that real frontend work should follow
- not duplicate token tables or visual prose already owned by `DESIGN.md`
- absorb the implementation-side details that do not fit cleanly into the `DESIGN.md` schema, such as motion policy, shadow usage doctrine, focus treatment, local wrapper rules, and review expectations

If a `GUIDELINES.md` already exists:
- complement it instead of replacing it
- preserve the current structure and wording where they are already project-specific and still valid
- add missing sections, tighten stale rules, and remove contradictions only when necessary

## Phase 8: Confirm Result

After writing or updating the files, show:
- the resolved target root
- the resolved file state and whether the flow ran in `scan` or `seed` mode
- the inferred `register`
- whether `DESIGN.md` was created or updated
- whether `GUIDELINES.md` was created, updated, or only complemented
- the `design.md lint` result for `DESIGN.md`
- the most important visual rules captured in `DESIGN.md`
- the most important implementation rules captured in `GUIDELINES.md`
- any intentionally undecided unknowns
