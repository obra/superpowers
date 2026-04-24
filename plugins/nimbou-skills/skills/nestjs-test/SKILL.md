---
name: nestjs-test
description: Stabilize and expand backend HTTP and persistence tests from approved Gherkin, routing audit work through the NestJS backend auditors.
---

# NestJS Test

Read `reference/test-conventions.md` before changing tests.

## Purpose

Own gherkin-driven backend test generation, audit dispatch, and stabilization for NestJS modules and Prisma repositories.

## When to Use

Use this skill when the main job is:
- generate backend coverage from approved Gherkin
- stabilize a fragile HTTP or persistence test
- route audit work through the backend auditors

Do not use this skill as the default runtime investigation workflow. Use `nestjs-debug` when the main task is to investigate runtime behavior before deciding how to test it.

## Modes

- **gherkin-driven mode** - use approved `docs/domain/<domain>/*.feature` files to add or expand backend coverage
- **audit mode** - dispatch `nestjs-http-test-auditor` or `prisma-repository-test-auditor`
- **stabilize mode** - tighten fragile backend tests without weakening observable contracts

## Workflow

1. Map one bounded backend flow or persistence slice.
2. Run only the relevant backend tests.
3. Build a small QA checklist for that flow.
4. Diagnose whether each failure belongs to the test, the backend, the environment/setup, or more than one of these.
5. Fix test-side problems first when the contract is already correct.
6. Fix product code only when the test exposed a real backend defect.
7. Add the missing tests for the bounded flow and rerun only that slice.

## Rules

- do not invent scenarios outside approved Gherkin
- choose one module or persistence slice at a time
- keep HTTP and Prisma confidence explicit instead of mixing them implicitly
- use the existing backend audit agents as internal execution tools, not as user-facing skills
- keep stable fixtures in `beforeAll` when tests do not mutate them, and keep `beforeEach` cleanup surgical
- extract helpers only after real duplication appears, not preemptively
- helpers may simplify mechanics, but they must not hide the domain state the test is supposed to prove
