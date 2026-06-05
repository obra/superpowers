---
name: nestjs-plan
description: Use after design approval to write a backend implementation plan focused on NestJS, Prisma, Clean Architecture, and SOLID.
---

# NestJS Plan

## Overview

Write implementation plans for backend work assuming the engineer has zero context for the codebase. The plan must force good boundaries, make the NestJS and Prisma structure explicit, and leave little room for architecture drift.

Assume the engineer is competent but does not know the domain, layering rules, or test strategy.

**Announce at start:** "I'm using the nestjs-plan skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
- User preferences override this default.

When the target backend has a relevant `GUIDELINES.md`, consume it as a constraint source before writing the plan. Default to the nearest app-level or module-level file and let a closer file override a broader one.

## Scope Check

If the approved spec still covers multiple independent subsystems, split it before writing the plan. Each plan should produce working, testable software on its own.

## File Structure First

Before writing tasks, map the file structure and responsibility of each file.

- Make the boundary explicit:
  - controller or transport (one controller per resource/aggregate, 5-20 routes; split by sub-aspect — lifecycle, attachments, workflow, queries — never one controller per use case)
  - DTOs and validation
  - application or use-case layer (one use case per business verb; each use case has one `execute` method and one reason to change)
  - domain contracts or policies
  - infrastructure adapters and Prisma repositories
  - tests per boundary
- Make migration sequencing explicit when schema, persistence semantics, or shared contracts change.
- Keep Prisma outside controllers and use-cases unless the existing codebase already violates this and the plan includes the cleanup.
- In existing codebases, follow established patterns when they are sound. If the current structure is muddy, plan the smallest refactor that restores a clean boundary.

This file map drives the task decomposition.

## Task Granularity

Each step should be a small action, typically 2-5 minutes:

- write the failing HTTP or use-case test
- run it to prove it fails
- implement the minimal controller, use-case, or repository code
- rerun the test
- commit

## Plan Document Header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use nimbou-skills:executing-plans to implement this plan wave-by-wave. Steps use checkbox (`- [ ]`) syntax for tracking. Each wave ends with an automatic `nimbou-skills:request-review` checkpoint, and the final wave runs `nimbou-skills:nestjs-test` scoped strictly to the suites/files touched by this plan — never the full backend suite.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about NestJS modules, boundaries, and Prisma ownership]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Use-case or Slice Name]

**Role:** `<role-slug>`

**Files:**
- Create: `src/modules/...`
- Modify: `src/...`
- Test: `test/...` or `src/...spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('CreateInvoiceUseCase', () => {
  it('rejects duplicate external references', async () => {
    await expect(
      sut.execute({ externalReference: 'dup-1' }),
    ).rejects.toThrow(DuplicateInvoiceReferenceError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --runInBand path/to/spec` (scoped to this spec only — never `pnpm test` without a path)
Expected: FAIL with the missing behavior or missing provider error that proves the test is real

- [ ] **Step 3: Write minimal implementation**

```ts
@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    const existing = await this.invoiceRepository.findByExternalReference(
      input.externalReference,
    )

    if (existing) {
      throw new DuplicateInvoiceReferenceError(input.externalReference)
    }

    return this.invoiceRepository.create(input)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --runInBand path/to/spec` (same scoped path as Step 2 — do not widen to the full suite)
Expected: PASS

- [ ] **Step 5: Commit**

Run: `git add <exact files> && git commit -m "feat: implement [task name]"`
````

## Role Mapping

Every task MUST declare a `**Role:**` line that names the agent-author who will execute it under `nimbou-skills:executing-plans`. The slug is one of:

| Role slug | When to use |
|---|---|
| `nimbou-skills:prisma-schema-author` | Task touches `schema.prisma` and/or generates a migration. No application code in the same task. |
| `nimbou-skills:prisma-repository-author` | Task implements or extends a concrete repository under `infra/persistence/` (or equivalent) against an existing application port. |
| `nimbou-skills:nestjs-usecase-author` | Task creates or evolves one application use-case (one business verb) and the ports it consumes. No HTTP wiring, no Prisma. |
| `nimbou-skills:nestjs-controller-author` | Task wires HTTP transport: controller, HTTP DTO, guards, validation pipes, module composition. No business logic. |

Rules:

- One role per task. If a single task description would fit two roles, split it into two tasks (one per role) before closing the plan.
- Tasks under `nestjs-test` final-wave dispatch do not declare `Role:` — they are routed through the test auditors directly.
- A task without `Role:` will fall back to `general-purpose` in SDD with a warning. Treat that as a planning bug to be fixed, not a feature.

## No Placeholders

These are plan failures:

- `TBD`, `TODO`, `implement later`
- `Add validation`, `handle edge cases`, `add proper error handling`
- `Write tests for the above` without actual test code
- `Similar to Task N`
- references to types, functions, or methods not defined in any task
- `Create DTO/use-case/repository as needed` without exact names and locations
- `Use Prisma here` without defining which adapter or repository owns that access

## Planning Rules For This Repository

- Always express execution as **`## Ondas de Execução`** (waves). Within a wave, every task runs in parallel by default; the only reason to put work in a later wave is that it consumes a contract, schema, type, or shared module produced by an earlier wave.
- Default wave shape:
  1. **Onda 1 — Contratos e Testes:** failing HTTP/use-case/repository tests, DTOs, domain contracts, Prisma migrations expand-step. Anything downstream consumes types or behavior defined here.
  2. **Onda 2 — Implementação Independente:** use-cases, domain services, repository adapters, fixtures. Dispatch in parallel — they share no mutable state.
  3. **Onda 3 — Wiring NestJS:** controllers, guards, filters, interceptors, module composition. Parallel per module.
  4. **Onda Final — Verificação:** dispatch `nimbou-skills:nestjs-test` with scope covering **only the files this plan changed** — the controllers, use-cases, repositories, Prisma adapters, and migrations introduced or modified across waves 1 through N. The final-wave task list must enumerate the exact suites/files (paths) that need stabilization or expansion, derived from the plan's diff. **Never dispatch the full backend test suite.** The runner command must always carry a scoped path filter (e.g., `pnpm test -- --runInBand <suite-path>`); the unfiltered `pnpm test` is forbidden as a verification step.
- Collapse or split waves only when a real dependency or its absence justifies it. Two waves with no shared contract should be one wave.
- After each wave, the executor MUST automatically dispatch `nimbou-skills:request-review` over the wave's diff before opening the next wave. Mark this as a checkpoint inside the plan; do not leave it implicit.
- If the request is HTTP-facing, include controller, DTO, guard, filter or interceptor, and route-level verification tasks.
- If the request is persistence-heavy, include repository contracts, Prisma adapters, fixture strategy, and integration-test tasks.
- If the request spans both, make dependency direction explicit so application logic does not depend on Prisma or NestJS transport details.
- If arrays of identifiers or related entities are validated, plan `findByIds`-style repository support and batch assertions instead of per-id loops.
- If update endpoints are partial by contract, plan DTO, test, and repository work so only changed fields are sent and handled.
- If a lint or static rule enforces Prisma boundaries, include the exact verification command in the final wave.
- Plan one use case per business verb and group endpoints under the resource controller that already owns the aggregate. If a planned controller exceeds ~20 routes, split it by sub-aspect (lifecycle / attachments / workflow / queries) instead of creating one controller per use case.

## Remember

- exact file paths always
- complete code in every code-changing step
- exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- the plan should read like a Clean Architecture implementation guide, not a generic checklist

## Self-Review

After writing the complete plan, check:

1. **Spec coverage:** every approved requirement maps to one or more tasks
2. **Placeholder scan:** no red-flag placeholders remain
3. **Type consistency:** later tasks use the same names and signatures defined earlier
4. **Boundary consistency:** controllers stay thin and resource-grouped (5-20 routes, split by sub-aspect when larger), use-cases stay framework-light with one verb per class, Prisma stays in infrastructure tasks
5. **Migration consistency:** schema-impacting work has ordered expand, migrate, and contract steps when relevant
6. **Contract efficiency:** chatty endpoints, per-id validation loops, and full-payload updates are not planned by accident
7. **Test coverage:** the plan proves behavior at HTTP, application, and persistence levels when relevant
8. **Wave shape:** every later wave is justified by a real contract dependency on an earlier wave; tasks inside a wave are genuinely parallel-safe (no shared file writes, no implicit ordering)
9. **Review checkpoints:** every wave ends with an explicit `nimbou-skills:request-review` checkpoint
10. **Final wave:** the final wave dispatches `nimbou-skills:nestjs-test` with scope restricted to the files this plan touched — every controller, use-case, repository, and migration introduced anywhere in the plan, **and nothing else**. The verification command must include explicit suite paths; an unfiltered `pnpm test` is a planning failure.

Fix issues inline before handing off the plan.

## Execution Handoff

After saving the plan, offer the execution choice using the `AskUserQuestion` tool. Do not narrate the options as prose.

Question: "Plan saved to `docs/plans/<filename>.md`. Which execution mode?"

Use `nimbou-skills:executing-plans` to implement this plan wave-by-wave.

## How To Ask The User

This skill assumes design is closed. Use `AskUserQuestion` only when execution topology is genuinely blocked by a missing structural decision that resolves to 2-4 discrete options, such as:

- whether a shared file or contract must land before dependent files (serial vs parallel groups)
- which target file path or module owns a contested capability when more than one is viable
- whether to reuse an existing repository/use-case or introduce a new one

Lead with your recommendation as the first option and append `(Recommended)` to its label.

Do not use `AskUserQuestion` for:

- open file naming or describing prose
- plan-approval gates — present the plan and wait for review, do not multiple-choice the approval itself
