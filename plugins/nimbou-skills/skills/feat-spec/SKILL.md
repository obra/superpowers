---
name: feat-spec
description: Use when a feature changes both frontend and backend, or when the frontend depends on a new backend contract. Close the shared feature design and platform boundary decisions before routing into `nuxt-think`, `nestjs-think`, or both.
---

# Feat Spec

Use this skill when the request changes both frontend and backend in the same feature slice, or when frontend delivery depends on a new or changed backend contract.

If the request is frontend-only, use `nuxt-think`.
If the request is backend-only, use `nestjs-think`.

This skill does not replace the platform-specific think skills. It closes the shared feature design once, defines the contract and ownership boundary between frontend and backend, and then recommends whether the next step is `nuxt-think`, `nestjs-think`, or both.

## Domain Specification Gate

Before routing to platform-specific design:

1. identify the target domain
2. use `doc-domain` to create or update `docs/domain/<domain>/domain.md`
3. use `doc-gherkin` to create or update `docs/domain/<domain>/*.feature`
4. if the feature adds or changes an HTTP contract, use `doc-openapi` to create or update `docs/domain/<domain>/openapi.yaml`
5. present the domain, Gherkin, and OpenAPI artifacts for approval
6. close the shared HTTP, event, or state contract that both sides need
7. close the ownership boundary between frontend and backend
8. close the feature-level states and interactions that are contract-dependent
9. do not advance with stale domain, Gherkin, or OpenAPI artifacts

## Shared Decisions To Close

- target feature slice and owning domain
- HTTP, event, or state contract shape shared by both sides
- error mapping and user-visible state expectations tied to the contract
- ownership boundary: what frontend owns locally vs what backend owns centrally
- cross-stack naming that both sides should preserve
- whether the next step needs `nuxt-think`, `nestjs-think`, or both

When the feature is HTTP-based, `docs/domain/<domain>/openapi.yaml` is the canonical transport contract for this shared step.

Do not use this skill to finish Nuxt component decomposition, visual direction, or route-level UI structure. Hand that to `nuxt-think`.
Do not use this skill to finish NestJS module design, Prisma boundaries, or use-case decomposition. Hand that to `nestjs-think`.

## Flow

1. confirm the request is genuinely mixed
2. close shared specification and contract decisions
3. decide which questions are truly shared and which belong to frontend-only or backend-only design
4. write the shared feature design and ownership boundary in a way both sides can consume
5. recommend the next local skill:
   - `nuxt-think` when the remaining work is mostly frontend structure and UI behavior
   - `nestjs-think` when the remaining work is mostly backend rules, transport, and persistence
   - both when the feature still needs platform-specific design closure on each side
6. do not route to `nuxt-plan` or `nestjs-plan` directly from this skill

## Output

Produce:

- shared domain summary
- generated specification artifacts
- shared contract
- frontend ownership boundary
- backend ownership boundary
- contract-dependent states and error handling
- recommended next skill or skills
- sequencing note when both sides still need think passes
