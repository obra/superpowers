---
name: change-spec
description: Use when a request changes both frontend and backend in an existing flow and needs one shared plan with explicit impact analysis before implementation.
---

# Change Spec

Use this skill when the request changes both frontend and backend in an existing flow. Its job is to return a single frontend/backend plan in chat after closing the shared change boundary and the downstream impact.

Use `feat-spec` when the work is a new feature slice or depends on a new backend contract. This skill is for evolving behavior that already exists.

This skill does not create specification artifacts. If `docs/domain/<domain>/`, Gherkin, OpenAPI, or prior plans already exist, consume them as constraints instead of generating files.

## Artifact Policy

- do not create or update `docs/domain/<domain>/domain.md`
- do not create or update `docs/domain/<domain>/*.feature`
- do not create or update `docs/domain/<domain>/openapi.yaml`
- do not write a plan file under `docs/plans/`
- if those artifacts exist, read them and call out any mismatch with the requested change

## Flow

1. confirm the request is a mixed change over an existing flow
2. inspect the current code path, contracts, tests, docs, and local patterns before asking questions
3. close what changes, what stays compatible, and which side owns each part of the change
4. challenge accidental rewrites, full-payload updates, chatty contracts, and duplicated state ownership
5. run the impact checklist below
6. return one combined plan in chat; do not hand off to `nestjs-think`, `nuxt-think`, `doc-domain`, or `doc-openapi` as the default next step

## Impact Checklist

Before planning, explicitly map the impact checklist across contracts, UI states, jobs, permissions, tests, migrations, and compatibility.

Check, when relevant:

- transport contracts, DTOs, shared types, and validation already in use
- persistence shape, migrations, backfill, and compatibility constraints
- use-cases, repositories, jobs, queues, webhooks, and other side effects
- guards, permissions, visibility rules, and audit trails
- existing components, composables, pages, stores, wrappers, and reuse points
- loading, empty, error, success, optimistic, and rollback UI states
- frontend and backend tests already protecting the flow, plus missing coverage that the plan must add
- rollout or fallback constraints when old and new behavior may coexist

## How To Ask The User

Ask only when the ambiguity is material and cannot be closed from the code or existing artifacts.

Use the structured question tool when the decision reduces to 2-4 discrete choices, especially for:

- partial update vs full replacement
- frontend-local vs backend-authoritative state
- chunky vs chatty transport changes
- compatibility posture when old clients or payloads may persist

## Output

Return a single chat response with:

- `## Contexto Atual`
- `## Mudanca e Decisoes Fechadas`
- `## Mapa de Impacto`
- `## Arquivos/Areas`
- `## Ondas de Execução`
- `## Validacoes e Riscos`
- `## Pos-execucao`

Inside `## Arquivos/Areas`, list exact paths or bounded areas, the action, the wave, the role, and the dependency.

Inside `## Ondas de Execução`, mix frontend and backend work in the same wave whenever they are parallel-safe. Split waves only on real dependency.

`## Pos-execucao` may recommend `executing-plans` for implementation. Do not recommend `finishing-a-development-branch` here — the primary deliverable of this skill is the unified plan itself.
