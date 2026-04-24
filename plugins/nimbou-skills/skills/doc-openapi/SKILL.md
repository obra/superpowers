---
name: doc-openapi
description: Use when `nestjs-think` has closed a backend-viable HTTP contract and frontend/backend work need one canonical transport artifact. Generate or refresh domain-local OpenAPI after `domain.md`, `.feature` files, and backend contract decisions are approved.
---

# Doc OpenAPI

## Purpose

Create or update `docs/domain/<domain>/openapi.yaml` as the canonical HTTP transport contract for a feature slice.

## When to Use

Use this after `nestjs-think` and before `nuxt-think` when the approved feature adds or changes an HTTP endpoint that frontend and backend both depend on.

Do not use this skill for:

- purely internal backend refactors
- Prisma or repository design
- async jobs or event contracts without HTTP
- frontend-only visual work

## Preconditions

Before generating `openapi.yaml`:

1. `docs/domain/<domain>/domain.md` must exist and be approved
2. the relevant `docs/domain/<domain>/*.feature` files must exist and be approved
3. the backend-viable HTTP contract must already be closed in `nestjs-think`
4. the HTTP contract must be traceable to those approved artifacts

## Output

- `docs/domain/<domain>/openapi.yaml`
- keep it beside `domain.md` and the `.feature` files
- treat it as the shared transport contract for backend and frontend planning
- `nuxt-think` should consume this contract instead of redefining it

## Rules

- support only Claude Code and Codex
- generate only HTTP transport contracts
- reflect approved domain states and approved Gherkin behavior; do not invent transport behavior
- include paths, methods, params, request body, success responses, error responses, and auth expectations when relevant
- preserve approved batch operations instead of decomposing them into multiple chatty endpoints
- preserve approved partial update semantics when the contract is intentionally minimal-payload
- include error response shapes that make batch validation failures and missing identifiers explicit when relevant
- include only the minimum schemas needed for the approved feature slice
- keep examples compact and illustrative
- do not include controller names, class names, Prisma models, SQL details, or framework wiring
- if the feature spans multiple unrelated HTTP slices, keep one coherent `openapi.yaml` per domain directory and scope it to the approved slice
