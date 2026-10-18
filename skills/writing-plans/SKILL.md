---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write an implementation plan that one implementer per PR carries from start to finish. The implementer reads the codebase, the plan's shared sections, and its own tasks, but not the spec or this conversation. The plan decides contracts, risks, and scope; the implementer writes the code.

Save to `docs/toolbelt/plans/YYYY-MM-DD-<feature-name>.md`, or where your human partner says. If the spec covers independent subsystems, propose one plan each. Plan the whole effort up front so delivery can run unattended.

## Explore first

Read the nearest instructions, the files you will change, and their tests until you can name paths, signatures, and the precedent each task copies. Dispatch an `explorer` through agent-routing only for a wide question, such as every call site of a changed contract.

## Shape

- A PR boundary is an outcome a reviewer can judge alone, and its verification passes without later boundaries. Every task sits in exactly one boundary.
- Aim for three to nine tasks and 1,000–4,000 changed lines per PR. Above 3,000 lines, say why the PR stays one PR. A one-task PR is fine.
- Independent boundaries list disjoint files. A dependent boundary names one predecessor in `Depends on`.
- `Risk` is `high` for money, security, tenancy, migrations, or shared contracts; `none` for a sweep, codemod, or CI config; `medium` otherwise. `none` skips the local review.

## Detail

- Write contracts: names, shapes, signatures, error codes, states, owners, and exact values.
- Write no SQL, code bodies, or tutorials.
- A reference is a path and a symbol. File lists are hints.

## Task fields

- **Files:** the files expected to change.
- **Contract:** what the task makes true.
- **Proves:** one line per decided behavior, with guards marked `(guard)`.
- **Verify:** the command that proves the task.

A task that adds a member to an enum, union, status, event, or operation pastes the search that finds every list of those members, plus the hits. A scripted rewrite names its exclusions, and its `Verify` reruns it, ending in `git diff --exit-code`.

## Sections

In order: Goal, Architecture, Global Constraints, Known Gotchas, Data Model (when schema changes), Risks, PR Boundaries, then the tasks. `../delivery/scripts/task-brief` copies Global Constraints, Known Gotchas, Data Model, and Risks into every brief, so keep those headings exact.

`## Risks` answers four questions:

- Who else reads or writes what this deletes, stops writing, or recalculates?
- What does the previous release still read?
- What other ways in reach each invariant (public link, import, replay, restore, worker, alternate actor), and which shared guard does each call?
- Which touched files does another workstream claim?

The PR table's columns are `| PR | Outcome | Tasks | Depends on | Risk | Independent verification |`.

## Example task

```markdown
### Task 3: Only managers void invoices

**Files:** `src/invoices/void.ts`, `src/invoices/routes.ts`, `tests/invoices/void.test.ts`

**Contract:** `voidInvoice(actor, invoiceId)` calls `can(actor, "invoice.void")` from `src/auth/policy.ts` before any write. A denied call returns 403 `INVOICE_VOID_FORBIDDEN` and changes nothing. The bulk-void worker calls `voidInvoice` as the system actor, which holds the permission.

**Proves:**
- (guard) A technician voiding an open invoice gets 403 `INVOICE_VOID_FORBIDDEN`, and the invoice stays open.
- A manager voiding an open invoice sets its status to `voided`.
- The bulk-void worker voids as the system actor.

**Verify:** `npm test -- tests/invoices/void.test.ts`
```

## Not this

- A code body.
- A line number.
- A step-by-step tutorial.
- A restated testing rule.
- A task that cannot be verified on its own.

## Review

1. Run `bash scripts/plan-check PLAN` and fix what it reports.
2. Check the plan against the spec: every requirement has a task, and names agree across tasks.
3. Route one `reviewer` with specialty `plan` through agent-routing, on a harness other than yours. Give it the plan and spec paths. It judges coverage, whether a contract leaves the implementer a product decision, the boundaries and their `Risk`, and the answers in `## Risks`.
4. Fix small gaps. A change of approach goes to your human partner.

## Handoff

Unless your human partner or the session's instructions say to proceed without approval, give them the plan path, the reviewer's harness, and a short summary, then wait for approval. Once approved, invoke toolbelt:delivery with the plan path. Do NOT invoke any other skill.
