---
name: interactive-design
description: "Use when your human partner accepts the frontend-first offer or asks to prototype the frontend before backend work — after brainstorming approves the intent-level design — or asks to iterate directly on an existing feature's UI, changing what information it shows. Direct UI iteration needs no prior design or spec."
---

# Interactive Design

Building the frontend is the design work. You and your human partner iterate on the real UI while every backend-owned datum arrives through a real API route returning fixture data. The output is working frontend code and a ledger of the API contracts to implement.

<ENTRY-GATE>
Three ways in: your human partner accepted brainstorming's frontend-first offer, asked directly, or asked to iterate on an existing surface's UI. Never select this path yourself. The first two require brainstorming's approved intent-level design, with UI detail deferred here. For the third, the request itself is the entry. The feature's frontend and the API it consumes must live in this repository or its workspace; if they don't, stop and tell your human partner this path does not apply.
</ENTRY-GATE>

The intent-level design names the feature, audience, data needs, and initial contracts.

## 1. Setup

1. Ensure an isolated workspace. If you are already in an isolated worktree, use it; otherwise invoke `toolbelt:using-git-worktrees`. The prototype branch is the branch the backend plan later executes on.
2. Read `.toolbelt/prototyping.md` when the project provides it — it states where fixture-backed routes live, how to run the frontend dev server, and seed-data conventions. When it is absent, infer all three and record each inference in the ledger header.
3. Scaffold the ledger (§7) and start the dev server.

## 2. The fixture gate

<HARD-GATE>
Backend-owned data comes from real API routes in this repo. A missing route becomes a real handler returning fixture data, tagged `TOOLBELT-FIXTURE <endpoint id>` and recorded in the ledger in the same edit: a fixture without a ledger entry is a gate violation. In iteration mode only, a datum may instead render placeholder data while a `[PENDING]` ledger entry naming it is recorded in the same edit — a placeholder without a `[PENDING]` entry is a gate violation.
</HARD-GATE>

Backend-owned means a datum the frontend would obtain from the backend in production. No inline mock data, no hardcoded domain data in components, no frontend-side stub layers. UI copy, labels, icons, layout constants, and client-derived display values are exempt. The marker's `<endpoint id>` is the ledger entry's identifier — for example `GET /api/projects/:id/insights`.

## 3. The loop

Edit directly in this session: no subagent dispatch, no per-iteration review. Commit checkpoints frequently. On every shape change, update the fixture and its ledger entry in the same pass. Before the design may be declared complete, exercise the empty and error variants of each fixture-backed surface through its fixture responses.

## 4. Exit

1. Reconcile. Every marker has a ledger entry matching its endpoint id, and every `[FIXTURE]` / `[EXISTING — EXTENDED]` entry has a marker (`[EXISTING]` and `[IMPLEMENTED]` entries carry none). Recorded shapes match what the fixtures actually return. Delete dead routes.
2. Write `.toolbelt/ux/matrix.json` per ux-gate §2, listing every surface the criteria name, then run `../ux-gate/scripts/ux-capture` against the approved prototype into `.toolbelt/ux/baseline/`; the gate diffs against it. In the ledger’s **Acceptance criteria**, record absolute matrix and baseline paths and the prototype commit SHA. Then stop the dev server you started.
3. Present the final contract inventory to your human partner.
4. On approval, invoke the mode's terminal skill — new-feature mode: `toolbelt:writing-specs`; iteration mode: the route confirmed in iteration-mode.md. Do NOT invoke any other skill.

## 5. What the spec must carry

- API section lifted from the ledger.
- One fixture-replacement requirement per `[FIXTURE]` / `[EXISTING — EXTENDED]` entry: implement the exact recorded shape, remove the marker, flip the entry to `[IMPLEMENTED]`.
- Hardening requirements: frontend tests per project conventions, plus loading and slow-response handling — the empty and error appearances are already approved in the loop.
- The fixture-zero check, stated below.
- ux-gate criteria are the ledger's Acceptance criteria.
- Ledger synchronization: contract changes accepted in spec or plan review are written back to ledger and fixture in the same round.
- Prototype-commit accounting: prototype commits predate the plan and are covered by the hardening tasks and the final whole-branch review, inside the single PR.
- Single-PR mandate, with its standing justification: fixtures must never reach the base branch.

The fixture-zero check:

```
git grep TOOLBELT-FIXTURE -- ':!docs/toolbelt' ':!.toolbelt'
```

exits 1 (no matches) at the final whole-branch review. Projects that deliberately keep fixtures (tests, storybook) record the exception in the ledger and add those paths to the exclusion list.

## 6. When a contract turns out infeasible

During SDD this is the existing BLOCKED escalation. The human-approved resolution amends the spec, updates ledger and fixture to match, and revises the affected plan tasks — including a frontend adaptation task — before execution resumes. The spec's API section and the ledger move together, always.

## 7. The ledger

- Path: `.toolbelt/prototype/<feature-slug>/contracts.md`. Header: feature, branch, marker string, and inferred conventions when `.toolbelt/prototyping.md` was absent.
- One entry per endpoint with its contract (REST: method, path, request/response shapes, status codes; other conventions: the project's API unit — GraphQL operation, RPC procedure — with shapes and error modes). The entry's identifier is what the marker line carries.

| Status | Meaning and fields |
|---|---|
| `[FIXTURE]` | New fixture route: fixture `path:line`, request/response shapes, error statuses, and `Notes` for UI-derived semantics. |
| `[EXISTING — EXTENDED]` | Existing endpoint needs changes: delta and fixture location. |
| `[EXISTING]` | Consumed as-is; no marker. |
| `[IMPLEMENTED]` | Fixture replaced during SDD; marker removed. |
| `[PENDING]` | Iteration mode only: placeholder data in a separate **Pending** subsection. One stable id (`P1`, `P2`, …) per datum, with its surface/component, data needed, and expected shape. No endpoint, fixture, or marker yet; resolve it per iteration-mode.md. |

- After exit reconciliation the ledger adds an **Acceptance criteria** section: visual and interaction criteria from the approved prototype, including the exercised empty and error states.
- Invariant: marker grep and ledger agree on what is still fake; each marker's endpoint id resolves to exactly one entry. The Pending subsection exists only during an iteration-mode session and never survives the pending-data resolution in iteration-mode.md.

```markdown
### GET /api/projects/:id/insights — [FIXTURE]
Fixture: app/api/projects/[id]/insights/route.ts:12
Response 200: { insights: [{ id: string, title: string, score: number, updatedAt: ISO8601 }] }
Errors: 404 unknown project, 500 generic
Notes: `score` is 0–100; the UI renders < 40 as "needs attention".

### PATCH /api/projects/:id — [EXISTING — EXTENDED]
Delta: request accepts `archivedAt: ISO8601 | null`; response echoes it.
Fixture: app/api/projects/[id]/route.ts:48
```

The ledger directory is ignored scratch, removed by delivery's post-merge cleanup. Its content lives on in the spec on the writing-specs route, or in the quick-task request and PR description on the quick-task route.

## 8. Iteration mode

For the third entry — iterating on an existing surface — read [iteration-mode.md](iteration-mode.md) before §1; it changes the announce line, the fixture rule, pending-data resolution, and exit routing.
