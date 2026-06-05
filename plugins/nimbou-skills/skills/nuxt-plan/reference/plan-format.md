# Plan Format

The plan should read like an execution brief, not a loose idea list.
Return it directly in the chat by default. Only turn it into a saved Markdown document if the user explicitly asks for a file.

## Required sections

- `## Contexto` for the concrete frontend slice being implemented
- `## Decisoes Fechadas` for resolved reuse, ownership, and state decisions
- `## Arquivos` with exact paths, wave assignment, **and `Role`** (role slug per file)
- `## Ondas de Execução` with parallel-by-default tasks per wave and a `nimbou-skills:request-review` checkpoint after each wave
- `## Riscos e Validacoes` for responsive, data, or interaction risks
- `## Pos-execucao` for catalog verification and testing follow-up

## Role per file

The `## Arquivos` table has columns `| Acao | Caminho | Onda | Role | Depende de |`. Every row MUST set `Role` to one of:

| Role slug | Use when the file is |
|---|---|
| `nimbou-skills:vue-component-author` | a Vue SFC under `components/` |
| `nimbou-skills:nuxt-composable-author` | a composable under `composables/` or a util consumed by composables |
| `nimbou-skills:nuxt-page-author` | a page under `pages/`, a layout under `layouts/`, or route wiring |

A row without `Role` falls back to `general-purpose` in `executing-plans` with a warning. Fix the plan instead.

## Naming

- Components: `PascalCase.vue`
- Composables: `useEntityAction.ts`
- Configs: `kebab-case.ts`

## Nuxt structure

- Use file-based routing under `pages/`.
- Rely on Nuxt auto-imports for `components/` and `composables/`.
- Prefer `<script setup lang="ts">` and `<style scoped lang="scss">`.

## Layout strategy

- CSS Grid for 2D page sections.
- Flexbox for 1D alignment.
- Container queries when local responsiveness matters.

## Wave rules

- Parallel within a wave is the default. Tasks share a wave when they have no contract dependency on each other.
- A new wave is justified only when its tasks consume a contract, composable signature, prop API, or shared type produced by an earlier wave.
- Page integration belongs to the last implementation wave; catalog verification and `/test` suggestions live in `## Pos-execucao`.
- Every wave ends with an explicit `nimbou-skills:request-review` checkpoint over the wave's diff before the next wave starts.

## Questions to close before planning

- Which exact route or page file owns the work?
- Which exact component and composable file names are being created or modified?
- Which files share a wave (no contract dependency) and which must move to a later wave?
- Which test scope matters most after implementation?
