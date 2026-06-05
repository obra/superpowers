---
name: nestjs-refactor
description: Use when an existing NestJS + Prisma backend needs structural refactoring to restore SOLID and Clean Architecture boundaries, reduce fat services or leaked framework concerns, and batch safe cleanup work without changing the product contract first.
---

# NestJS Refactor

Refactor backend structure deliberately. This skill exists for codebases that mostly work but have architectural drift: fat controllers or services, leaked Prisma details, mixed concerns, weak module boundaries, and refactor pressure that is too risky to attack ad hoc.

This is an implementation-oriented refactor workflow, not a generic review pass.

## When to Use

Use this skill when:
- controllers contain business rules, orchestration, or persistence details
- one service or use-case has become a catch-all module entry point
- Prisma types or query details leak into DTOs, controllers, or application services
- repository contracts are vague, inconsistent, or bypassed
- a backend slice needs cleanup in batches without breaking the public contract
- you want to refactor multiple bounded modules and need explicit agent ownership

Do not use this skill when:
- the main problem is still runtime uncertainty or a failing bug with unknown cause; use `nestjs-debug`
- the request is a new backend design or contract definition; use `nestjs-think`
- the main task is test generation or stabilization; use `nestjs-test`
- the current contract is wrong and still needs product or domain approval

## Core Rule

```text
STABILIZE BEHAVIOR FIRST. REFACTOR STRUCTURE SECOND.
```

Do not use architecture cleanup as a cover for changing business behavior. Lock down the intended behavior first with focused tests or other concrete evidence.

## Refactor Targets

This skill organizes backend work around a target shape like:
- thin controllers and transport adapters, grouped per resource/aggregate, with 5-20 routes each
- explicit use-cases or application services with one clear purpose, named after a business verb, exposing a single `execute` method
- a controller calling many use cases (correct) — never one controller per use case (CQRS-handler anti-pattern)
- repository interfaces owned by the application boundary
- Prisma confined to infrastructure adapters, repositories, and persistence mappers
- module wiring that reflects dependency direction instead of convenience imports
- test coverage aligned to the boundary being changed

### Granularity Heuristics

When deciding whether to split or merge:

- **Split a controller** when it exceeds ~20 routes or mixes lifecycle, attachments, workflow, and queries in one file. Split by sub-aspect, not by individual operation.
- **Merge controllers** when several have ≤5 routes each and share a clear category (lookups, settings, integration configs). Aim for cohesive resource grouping.
- **Split a use case** when its `execute` method has unrelated branches driven by input flags (`if (input.action === 'X') ... else ...`). Each branch is usually a separate use case.
- **Reject** any refactor proposal that produces "one controller per use case." Re-route to resource-grouped controllers instead.

## Workflow

1. **Map the current slice**
   - inspect the target module or domain only
   - identify controllers, DTOs, use-cases, repositories, adapters, Prisma touchpoints, and tests
   - mark which files are behavior owners and which are structure-only

2. **List architectural violations**
   - SRP drift
   - DIP violations
   - transport leaking into application
   - Prisma leaking outside infrastructure
   - transactions opened in the wrong layer
   - module graph shortcuts that defeat clean boundaries

3. **Choose one bounded refactor strategy**
   - module-by-module cleanup
   - boundary-first extraction
   - persistence isolation first

   Prefer the smallest strategy that reduces risk in the target slice.

4. **Write the target shape**
   - current problems
   - target boundary layout
   - files expected to move or split
   - anti-goals
   - required tests before and after refactor

   Save it to `docs/plans/YYYY-MM-DD-<topic>-refactor.md`.

5. **Get approval before edits**
   - show the planned batches
   - show which files each batch owns
   - call out any temporary compatibility seams

6. **Execute in batches**
   - one bounded module or domain at a time
   - keep public behavior stable unless explicitly approved otherwise
   - rerun the smallest relevant tests after each batch

7. **Review the integrated result**
   - use `request-review` for code review
   - use `verification-before-completion` before claiming the refactor is done

## Batch Design

Design batches around disjoint ownership, not around abstract layers across the whole repo.

Good batches:
- `auth` module cleanup
- `billing` module cleanup
- `users` module cleanup

Bad batches:
- move all controllers in the repo
- rewrite every repository interface at once
- isolate Prisma everywhere in one pass

## Agent Model

This skill uses two execution agents:

- `nestjs-boundary-refactorer`
  - owns controllers, DTO-to-use-case seams, use-cases, application services, and boundary interfaces inside one bounded slice
- `prisma-boundary-refactorer`
  - owns Prisma-backed repositories, persistence adapters, transaction boundaries, and persistence mappers inside one bounded slice

### Parallel Rule

Dispatch agents in parallel only when they have different bounded slices and disjoint write sets.

Safe:
- `nestjs-boundary-refactorer` on `auth`
- `prisma-boundary-refactorer` on `billing`

Unsafe:
- both agents editing the same module at the same time
- one agent changing interfaces while another updates the same providers or tests

If the refactor is within one module, run the batches sequentially.

## Required Output

Before implementation, produce:
- target slice
- current violations
- recommended target shape
- batch list with file ownership
- explicit no-go zones
- verification commands

After implementation, report:
- what moved or split
- which boundaries are now explicit
- which compatibility seams remain
- what was verified

## Refactor Discipline

- prefer extraction and relocation over broad rewrites
- keep naming aligned to business responsibilities, not framework artifacts
- do not move Prisma into application code to "simplify" dependency injection
- do not collapse use-cases back into large services
- do not refactor across multiple domains just because the smell appears similar
- if a boundary change needs contract drift, stop and re-route to `nestjs-think`

## Related Skills

- `nimbou-skills:nestjs-debug`
- `nimbou-skills:nestjs-test`
- `nimbou-skills:dispatching-parallel-agents`
- `nimbou-skills:request-review`
- `nimbou-skills:verification-before-completion`
