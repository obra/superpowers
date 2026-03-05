---
name: requesting-code-review
description: Use after meaningful code changes or before merge to request structured review against requirements and quality standards.
---

# Requesting Code Review

Request review early to catch issues before they spread.

## When

- After completing a plan task or batch
- After major refactor/feature work
- Before merge or PR finalization

## How

1. Determine review range (`BASE_SHA` -> `HEAD_SHA`).
2. Dispatch `superpowers-custom:code-reviewer` using `requesting-code-review/code-reviewer.md`.
3. Provide:
- What changed
- Requirement or plan reference
- SHA range
- Short summary

## Triage Rules

- Fix all Critical issues before proceeding.
- Fix Important issues unless user explicitly defers.
- Track Minor issues for later.
- Push back with evidence when feedback is incorrect.

## Output Requirement

Review must include severity, file references, and merge readiness verdict.
