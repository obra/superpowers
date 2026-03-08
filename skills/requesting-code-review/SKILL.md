---
name: requesting-code-review
description: >
  Structured code review against requirements and quality standards.
  Invoke after meaningful code changes or before merge. Triggers on:
  "review my code", "code review", "check this before merge". Routed
  by using-superpowers or executing-plans after implementation.
---

# Requesting Code Review

Request review early to catch issues before they spread.

## When

- After completing a plan task or batch
- After major refactor/feature work
- Before merge or PR finalization

## How

1. Determine review range (`BASE_SHA` -> `HEAD_SHA`).
2. Dispatch `superpowers-optimized:code-reviewer` using `requesting-code-review/code-reviewer.md`.
3. For security-relevant work (auth, sensitive data, exposed endpoints, infrastructure), also invoke `security-reviewer` to perform a dedicated security and high-level quality pass.
4. Provide:
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
