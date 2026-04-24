---
name: doc-gherkin
description: Generate or refresh domain-local Gherkin files from an approved domain map so planning and test skills can consume the same scenarios.
---

# Doc Gherkin

## Purpose

Create or update `docs/domain/<domain>/*.feature` from `docs/domain/<domain>/domain.md`.

## When to Use

Use this from `nuxt-think` and `nestjs-think` during specification, before any plan is written.

## Output

- `docs/domain/<domain>/<feature-slice>.feature`
- keep `.feature` files beside `domain.md`
- treat this as the shared specification layer for planning and test skills

## Rules

- support only Claude Code and Codex
- never invent states that are not in `domain.md`
- use `Feature`, `Rule`, and `Scenario` in business language
- keep one functional slice per `.feature` file
- do not include selectors, URLs, DTOs, controllers, or Prisma details
