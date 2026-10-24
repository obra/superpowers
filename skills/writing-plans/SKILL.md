---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write an implementation plan that one implementer per PR carries from start to finish. The implementer reads the codebase, the plan's shared sections, and its own tasks, but not the spec or this conversation. The plan decides contracts, risks, and scope; the implementer writes the code.

Save to `docs/toolbelt/plans/YYYY-MM-DD-<feature-name>.md`, or where your human partner says. If the spec covers independent subsystems, propose one plan each. Plan the whole effort up front so delivery can run unattended.

## Explore first

Read the nearest instructions, the files you will change, and their tests. For each thing the work will show, calculate, save, or send, find out whether the app already does it. Look for a shared component that shows the same information on another screen, a service or helper that already makes the decision or does the math, and middleware already on the request path. Search by the words the business uses, the labels on the screen, and the calculation itself, not only by the name you planned to give the new thing.

Delegate the search through agent-routing whenever the answer is not in a file you already know. Send a narrow question to `lookup`. Send a wide question to `explorer`: map a system, find competing implementations, or list affected callers. Keep searching as new questions come up while the plan takes shape; there is no single search step.

A `lookup` brief asks for a path, a symbol, and one line on what it does, and ends: "Stop as soon as you have found the answer." An `explorer` brief ends: "What would a competent implementer, working only from a written plan, get wrong here?"

The first time you delegate, tell your human partner in one line which routes you are using and that they can name a different model. Do not wait for a reply.

Exploring is done when you can fill in every task's `Reuses:` without guessing.

## Shape

- A PR boundary is an outcome a reviewer can judge alone, and its verification passes without later boundaries. Every task sits in exactly one boundary.
- Aim for three to nine tasks and 1,000–4,000 changed lines per PR. Above 3,000 lines, say why the PR stays one PR. A one-task PR is fine when it is not tiny. Fold a boundary under about 100 changed lines into a neighbor unless it needs its own release order, `Risk`, or revert.
- Independent boundaries list disjoint files. A dependent boundary names one predecessor in `Depends on`.
- `Risk` is `high` for money, security, tenancy, migrations, or shared contracts; `none` for a sweep, codemod, or CI config; `medium` otherwise. `none` skips the local review.

## Detail

- Write contracts: names, shapes, signatures, error codes, states, owners, and exact values.
- Write no SQL, code bodies, or tutorials.
- A reference is a path and a symbol. File lists are hints.

The plan holds the decisions the implementer cannot make alone. If a plan is longer than the code it describes, it contains code; replace the bodies with contracts.

## Shared pieces

When nothing exists yet but the information will appear on more than one screen, plan it as a shared piece and name the other screens in `Reuses:`. If you expect more screens but cannot name one, say so, and your human partner decides at plan approval.

A shared piece owns what has to look and behave the same. Each screen passes in what differs, as data, columns, or callbacks. The shared piece never checks which screen or record type is calling it. Business rules stay with the screen's own save path or the backend.

You may propose a new shared component, helper, or service when it makes the app look, perform, or hold up better, and say why.

Moving existing screens onto a new shared piece is planned in the same plan, split into PRs by the normal size rule. Deferring the move is your human partner's decision at plan approval, never a silent Follow-up.

<Good>
`**Reuses:**` `LineItemsTable` in `src/components/line-items-table.tsx`, which owns the row layout, quantity and price columns, and totals row. This screen passes in its own rows and an `onChange` callback. Match the invoice screen: same column order, spacing, and totals. Line totals come from `lineTotal` in `src/lib/money.ts`.
The implementer knows exactly what to use, what to pass in, and which screen to match.
</Good>

<Bad>
`**Reuses:**` use existing components where possible.
The implementer now has to find the component and make the decision the plan should have made.
</Bad>

<Good>
The estimate screen passes its extra Frequency and Discount columns into the shared table, which lays them out like the other columns.
A new screen adds columns by passing them in, not by editing the shared table.
</Good>

<Bad>
The shared table takes a `kind` prop and branches on `kind === "estimate"` inside to add those columns.
Every new record type then edits the shared table.
</Bad>

## Task fields

- **Files:** the files expected to change.
- **Contract:** what the task makes true.
- **Reuses:** existing code this task uses or extends instead of writing its own, as a path, a symbol, and a few words on what it does; or the shared piece this task creates and its users in this plan; or `none — <why>`, naming the search that found nothing. For anything a user sees, also name the screen to match, what has to look the same, what legitimately differs, and which side owns each difference.
- **Interfaces:** only on a task whose output another task in the plan uses: what it consumes and produces, by name and shape.
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

**Reuses:** `can` in `src/auth/policy.ts`, the permission check every route already uses, with the system actor it defines for background work.

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
3. Route one `reviewer` with specialty `plan` through agent-routing, on a harness other than yours. Give it the plan and spec paths. It judges coverage, whether a contract leaves the implementer a product decision, the boundaries and their `Risk`, and the answers in `## Risks`. Ask it to challenge each `Reuses:` and every `none`, and to look for anything the plan rebuilds that already exists.
4. Fix small gaps. A change of approach goes to your human partner.

## Handoff

Unless your human partner or the session's instructions say to proceed without approval, give them the plan path, the reviewer's harness, and a short summary, then wait for approval. Once approved, invoke toolbelt:delivery with the plan path. Do NOT invoke any other skill.
