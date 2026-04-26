---
name: feat-spec
description: Use when a feature changes both frontend and backend, or when the frontend depends on a new backend contract. Close the shared feature design, ownership boundary, and preliminary contract before handing the backend contract work to `nestjs-think`.
---

# Feat Spec

Use this skill when the request changes both frontend and backend in the same feature slice, or when frontend delivery depends on a new or changed backend contract.

If the request is frontend-only, use `nuxt-think`.
If the request is backend-only, use `nestjs-think`.

This skill does not replace the platform-specific think skills. It closes the shared feature design once, defines the preliminary contract and ownership boundary between frontend and backend, and then hands backend contract closure to `nestjs-think`.

## Domain Specification Gate

Before routing to backend contract design:

1. identify the target domain
2. use `doc-domain` to create or update `docs/domain/<domain>/domain.md`
3. use `doc-gherkin` to create or update `docs/domain/<domain>/*.feature`
4. present the domain and Gherkin artifacts for approval
5. close the preliminary HTTP, event, or state contract that both sides need
6. close the ownership boundary between frontend and backend
7. close the feature-level states and interactions that are contract-dependent
8. do not advance with stale domain or Gherkin artifacts

## Shared Decisions To Close

- target feature slice and owning domain
- preliminary HTTP, event, or state contract shape shared by both sides
- whether the contract should be chunky or batch-oriented rather than chatty
- whether update flows are partial/minimal-payload or full replacement, and what both sides must preserve
- error mapping and user-visible state expectations tied to the contract
- explicit lifecycle states when frontend behavior or backend processing depends on them
- ownership boundary: what frontend owns locally vs what backend owns centrally
- cross-stack naming that both sides should preserve
- backend assumptions the transport contract must preserve

## How To Ask The User

When any decision above resolves to 2-4 discrete, mutually-exclusive options, use the `AskUserQuestion` tool instead of free-form prose. The structured UI keeps shared decisions auditable on both sides of the boundary.

Use `AskUserQuestion` for:

- contract shape (chunky/batch vs chatty)
- update payload posture (partial vs full replacement)
- ownership of a contested capability (frontend-local vs backend-central)
- where lifecycle state lives (client-derived vs server-authoritative)
- error-mapping posture (transport-level vs domain-shaped errors)

Lead with your recommendation as the first option and append `(Recommended)` to its label. Keep options to 2-4. Use free-form text only when the answer is genuinely open (naming, descriptions, free-text rationale).

Do not use `AskUserQuestion` for:

- yes/no confirmations of an obvious next step
- plan-approval gates (those belong to the user-review step, not a multiple-choice question)
- requests for prose-level explanations from the user

Do not use this skill to finish Nuxt component decomposition, visual direction, or route-level UI structure. Hand that to `nuxt-think` after `doc-openapi`.
Do not use this skill to finish NestJS module design, Prisma boundaries, or use-case decomposition. Hand that to `nestjs-think`.

## Flow

1. confirm the request is genuinely mixed
2. close shared specification and contract decisions
3. decide which questions are truly shared and which belong to frontend-only or backend-only design
4. challenge accidental chatty contracts, array-by-array validation loops, and payloads that resend unchanged data
5. write the shared feature design and ownership boundary in a way both sides can consume
6. route the next contract step to `nestjs-think`
7. do not route to `doc-openapi`, `nuxt-think`, `nuxt-plan`, or `nestjs-plan` directly from this skill

## Output

Produce:

- shared domain summary
- generated specification artifacts
- preliminary shared contract
- frontend ownership boundary
- backend ownership boundary
- contract-dependent states and error handling
- required next skill: `nestjs-think`
