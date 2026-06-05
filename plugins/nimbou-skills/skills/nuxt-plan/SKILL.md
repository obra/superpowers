---
name: nuxt-plan
description: Use after frontend design approval to write a Nuxt implementation plan with exact files, reuse decisions, and execution waves that maximize parallelism.
---

# Nuxt Plan

## Overview

Turn an approved frontend design direction into a concrete file tree and execution sequence. The plan must make component reuse, route ownership, state boundaries, and responsive behavior explicit before implementation starts.

This skill never writes code and never runs without user approval.
By default, return the plan in the chat as a structured response. Do not write a standalone Markdown document unless the user explicitly asks for one.

**Announce at start:** "I'm using the nuxt-plan skill to create the frontend implementation plan."

Read `reference/plan-format.md` before writing the plan.

When the target project has relevant `DESIGN.md` and `GUIDELINES.md` files, consume them as input constraints. In a monorepo, default to the relevant app-level files and let a closer feature-level file override them.

## Scope Check

If the approved design still bundles multiple independent screens, flows, or domains, split it before writing the plan. Each plan should produce one coherent frontend slice that can be implemented and verified on its own.

## Minimal Clarifications Only

Assume `nuxt-think` already closed product and UI decisions.

Ask follow-up questions only when the execution topology is blocked by missing structural details such as:

- the exact route or page file path
- the exact component or composable names to create
- whether a shared file must land before dependent files
- whether the work should stay in one wave or split because a later wave consumes a contract from an earlier one

When such a question reduces to 2-4 discrete, mutually-exclusive options, use the `AskUserQuestion` tool. Lead with your recommendation as the first option and append `(Recommended)` to its label. Do not narrate the options as free-form prose.

Do not use `AskUserQuestion` for:

- open file or component naming
- plan-approval gates — present the plan and wait for review

Do not reopen settled UX, reuse, state, interaction, or responsive decisions unless the prior output is contradictory.

## File Structure First

Before writing tasks, map the file structure and responsibility of each file.

- Make the boundary explicit:
  - page or route entry under `pages/`
  - reusable components under `components/`
  - composables under `composables/`
  - shared types or config when needed
  - tests and catalog verification
- Treat reuse decisions from `nuxt-think` as inputs. Do not re-decide them here.
- Treat the relevant `DESIGN.md` and `GUIDELINES.md` rules as constraints. Do not reopen them here unless they contradict the approved `nuxt-think` output.
- Make state ownership explicit: what stays in the page, what moves into child components, what belongs in a composable, and what truly justifies a store.
- Prefer the target project's existing wrappers and primitives for forms, tables, dialogs, empty states, filters, and entity pickers before planning feature-local equivalents.
- Make naming and placement explicit when the project depends on feature-grouped domain components, shared roots, or route-owner naming conventions.
- Make hardening explicit in the file map when the feature has meaningful loading, empty, error, success, autosave, overflow, or responsive states.
- If the current structure is muddy, plan the smallest refactor that restores clear ownership.

This file map drives the waves.

## Planning Rules For This Repository

- Consume the latest `nuxt-think` output or a direct request with equivalent detail.
- Read the nearest relevant `DESIGN.md` and `GUIDELINES.md` in the target project when the feature has a concrete target path or app.
- Read `components.meta.json` when the plan references reusable components. Fall back to `.generated/component-catalog/components.meta.json` when the project only ships the slim catalog.
- Define exact file paths before describing waves.
- Always express execution as **`## Ondas de Execução`**. Within a wave, every file runs in parallel by default. The only reason to push work to a later wave is that it consumes a contract, composable signature, prop API, or shared type produced earlier.
- Default wave shape:
  1. **Onda 1 — Contratos compartilhados:** shared types, composables that expose APIs consumed elsewhere, route file when it owns the data contract for child components.
  2. **Onda 2 — Componentes e configs independentes:** isolated components, feature-local utils, configs. Parallel.
  3. **Onda 3 — Integração de página e estados:** page composition, loading/empty/error/success wiring, responsive checks.
  4. **Onda Final — Verificação:** run `/nuxt-catalog` (validate → generate) and the suggested test scope (e.g., `/test <route>`). Test runs MUST be limited to the routes/components/composables this plan changed — never `/test` over the whole app or unscoped `pnpm test`.
- Collapse waves when there is no contract dependency between them. Two single-task waves with no dependency should be one wave.
- After each wave, the executor MUST automatically dispatch `nimbou-skills:request-review` over the wave's diff before opening the next wave. Mark each checkpoint inside the plan; do not leave it implicit.
- Make the handoff between page, components, and composables explicit.
- Call out any local anti-pattern avoidance that the execution must preserve, such as not duplicating fetch ownership between page and composable or not introducing store state for simple parent-child communication.

## Role Mapping

Every row in `## Arquivos` MUST set a `Role` slug so `executing-plans` can route execution to the correct agent-author:

| Role slug | When to use |
|---|---|
| `nimbou-skills:vue-component-author` | File lives under `components/` (SFC) |
| `nimbou-skills:nuxt-composable-author` | File lives under `composables/` or `utils/` (consumed by composables) |
| `nimbou-skills:nuxt-page-author` | File lives under `pages/`, `layouts/`, or wires routes |

Rules:

- One role per file/task. If a file would fit two roles, that is a planning bug — split into two files or two tasks.
- Tasks under `## Pos-execucao` (catalog verification, `/test` runs) do not declare `Role`.
- A row without `Role` will fall back to `general-purpose` with a warning. Fix the plan rather than leaning on the fallback.

## Response Shape

```md
# Plan: Project Details Page

## Contexto
Create a project details page using the existing status badge and a new sidebar.

## Decisoes Fechadas
- Reuse `ProjectStatusBadge` for the header summary.
- Create a dedicated sidebar component instead of expanding the page file.
- Keep filtering state in a page-level composable.

## Arquivos
| Acao | Caminho | Onda | Role | Depende de |

## Ondas de Execução
### Onda 1 — Contratos compartilhados (paralelo)
### Onda 2 — Componentes e configs independentes (paralelo)
### Onda 3 — Integração de página (paralelo dentro da onda)

> Checkpoint após cada onda: dispatch `nimbou-skills:request-review` sobre o diff da onda antes de abrir a próxima.

## Riscos e Validacoes
- Confirm mobile collapse behavior on the sidebar.
- Verify loading and empty states against the real API payload.

## Pos-execucao
- [ ] /nuxt-catalog
- [ ] Sugestao: /test projects
```

This is a response format, not a file requirement.

## No Placeholders

These are plan failures:

- `TBD`, `TODO`, `ajustar depois`
- `Create component as needed`
- `Handle loading and errors` without saying where and how
- `Reuse existing component` without naming it
- `Test the page` without naming the recommended command or scope
- Any test suggestion that runs the full Playwright suite or unfiltered `pnpm test`; the scope must always point to the routes/components/composables changed by this plan
- vague references to composables, stores, or API data without ownership

## Self-Review

After writing the complete plan, check:

1. **Design coverage:** every approved UI requirement maps to files or waves
2. **Topology clarity:** exact file ownership and dependency order are explicit
3. **Wave shape:** every later wave is justified by a real contract dependency on an earlier wave; tasks inside a wave are genuinely parallel-safe
4. **Review checkpoints:** every wave ends with an explicit `nimbou-skills:request-review` checkpoint
5. **Boundary clarity:** page, component, and composable responsibilities are clear
6. **Guideline clarity:** local wrapper reuse, state locality, and hardening obligations are represented where relevant
7. **Verification clarity:** `/nuxt-catalog` and test suggestions still appear at the end, and every test suggestion is scoped to the routes/components/composables this plan changed (never the full suite)

Fix issues inline before handing off the plan.

## Execution Handoff

Present the plan and wait for user approval.

When the user approves this shape, `executing-plans` is the execution skill. Do not introduce a separate `nuxt-execute` skill.
