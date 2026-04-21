---
description: Generate or refresh a project-facing DESIGN.MD by exploring the target codebase, asking only the missing design questions, and writing the file at the correct app or repo root.
argument-hint: Optional project path, app path, route, or feature description
---

# Generate DESIGN.MD

Use this command when the user wants a `DESIGN.MD` created, refreshed, or standardized for a Nuxt/Vuetify project.

This command is not a one-shot template dump. It should produce a project-facing `DESIGN.MD` grounded in the actual codebase and local UI patterns.

## Core Rules

- Explore first, ask second
- Prefer the real app root over the monorepo root when the target lives inside one app
- Generate concrete guidance, not placeholders
- Reuse the structure from `skills/nuxt-audit/reference/design-md-template.md`
- If a useful `DESIGN.MD` already exists, update it instead of replacing good project-specific guidance with generic prose

## Phase 1: Resolve Target Scope

1. Capture the target from `$ARGUMENTS`
2. If the target is a monorepo:
   - identify the relevant app or package root
   - use that app root as the default write location
3. If the target is not a monorepo:
   - use the repository root as the default write location
4. If the user named a route, feature, or path:
   - map it to the owning app first

## Phase 2: Explore Before Asking

Inspect the target project to learn what is already true:

- README and local docs
- package and workspace manifests
- app layout shells
- shared UI primitives
- design tokens, themes, CSS variables, or Vuetify setup
- page, component, and composable structure
- repeated patterns that clearly deserve to become explicit design guidance
- any existing `DESIGN.MD`

Summarize what you learned before asking questions.

## Phase 3: Ask Only What Exploration Cannot Tell You

Ask only the missing high-impact design questions, such as:

- who uses the product and in what context
- what tone the interface should communicate
- what the product should explicitly not feel like
- whether any project-specific patterns should be declared as required defaults

Do not ask questions the codebase already answered.

## Phase 4: Create or Refresh DESIGN.MD

Use `skills/nuxt-audit/reference/design-md-template.md` as the base structure, and consult `skills/nuxt-audit/reference/design-md-example.md` for a concrete example of how each section should be filled in a real project (fictional SaaS `Haven`, hybrid mode). Use the example for granularity and format, not for its values — every project preenche com suas próprias fontes, hues, paths e convenções.

When writing each section, consult the corresponding skill as the source of generic posture, and let local project decisions override:

- **Mode** and **Page Composition** → `nimbou-skills:nuxt-design-composition` (landing vs product UI, hero rules, motion ritmo).
- **Visual Posture** → `nimbou-skills:nuxt-design-posture` (typography, color tokens, spacing scale, CSS bans).
- **Component Architecture** → `nimbou-skills:nuxt-design-architecture` (tiers, SOLID boundaries, extraction heuristics, communication contracts).

Local DESIGN.MD decisions always win over the skills.

The resulting `DESIGN.MD` should be:
- specific to the target app
- aligned with the real primitives and patterns already present
- explicit about ownership, reuse, layout, visual guardrails, and audit expectations
- free of filler such as `TBD`, `TODO`, or vague brand language

If a `DESIGN.MD` already exists:
- preserve the good project-specific rules
- remove contradictions and stale guidance
- tighten generic language

## Phase 5: Confirm Result

After writing or updating the file:
- show the resolved target root
- show whether the file was created or updated
- summarize the most important design rules captured
- point out any important unknowns that remain intentionally undecided
