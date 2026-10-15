---
name: subagent-driven-development
description: Use when delivery hands you one PR boundary of an approved plan to execute task by task.
---

# Subagent-Driven Development

Execute one PR boundary of an approved plan: implementers carry its tasks, risky tasks get their own review, and a whole-branch review closes the boundary. Invoke toolbelt:orchestrating first; its read list, path routing, and dispatch rules hold throughout.

Delivery supplies the boundary number, its task set, the starting SHA, the resolved routes, and optionally a UX gate runner. Dispatch every role on the route delivery gave you. If a role has no route, stop and tell your human partner rather than choosing a model yourself.

Scripts below live in this skill's `scripts/` directory.

## Setup

1. Run `scripts/sdd-workspace PLAN_FILE`. It prints this plan's git-ignored workspace, where every brief, report, review, and the ledger live.
2. Open or resume the ledger (see Ledger).
3. Read the plan if it is not already in your context. Before Task 1, look for tasks that contradict each other, the Global Constraints, or the [task-review rubric](task-reviewer-prompt.md), and ask about all of them in one message, each beside its plan text.
4. Confirm you are on the boundary's branch. Never implement on main or master without your human partner's explicit consent.

When the plan has an `## Execution Tracks` section, read [parallel-tracks.md](parallel-tracks.md); otherwise run tasks one at a time. Never run two implementers in one worktree, or more implementers at once than the plan's declared tracks.

## Per task

1. Record BASE, the current head.
2. Run `scripts/task-brief PLAN_FILE N`. Dispatch the implementer with [implementer-prompt.md](implementer-prompt.md). One implementer may carry several tasks: resume it with the next brief and report path.
3. Act on its status:
   - **DONE** — continue.
   - **DONE_WITH_CONCERNS** — resolve a correctness or scope concern first, the same way as NEEDS_CONTEXT; log any other concern and continue.
   - **NEEDS_CONTEXT** — if the plan already answers it, resume the implementer pointing at that plan text. A product or contract decision the plan doesn't make is not yours either: take it to your human partner, record their answer as a ruling (see Rulings), and resume the implementer.
   - **BLOCKED** — change something before retrying: more context or a more capable routed model. If the plan is wrong or the task is too large to finish, take it to your human partner to re-plan; don't split the task yourself.
4. Review the task now only if the plan marks it `Review: per-task` or, in a plan without markers, it touches money, auth or permissions, tenant scoping, migrations, or shared contracts; the final review covers every other task. Run `scripts/review-package --plan PLAN_FILE BASE HEAD` and dispatch the task reviewer with [task-reviewer-prompt.md](task-reviewer-prompt.md) on the path it prints. Use the BASE you recorded, never `HEAD~1`, which drops every commit but the last.
5. A spec ❌ or any Critical or Important finding starts the fix loop, except those labeled `plan-mandated` or `plan-gap`: those need a decision the plan doesn't make, so batch them to your human partner, each beside its plan text. Minor findings and the out-of-scope count go on the ledger's verdict line for the final review to triage.
6. Record the task complete in the ledger.

A review counts only from a dispatched reviewer, never from your own context. You never fix code yourself: a fix in your context burns it and skips review.

## Fix loop

1. Resume the original implementer with the review-file path. If your harness cannot message a finished agent, dispatch a fresh one with the brief, report, and review paths.
2. Run `scripts/review-package --plan PLAN_FILE FIX_BASE HEAD`, where FIX_BASE is the head the previous review saw, and dispatch [re-review-prompt.md](re-review-prompt.md) with it. Findings the re-reviewer notices outside the fix diff go to the ledger as minors and never extend the loop.
3. Findings still NOT ADDRESSED, plus any new Critical or Important breakage in the fix diff, remain open. If any do, run one more round of steps 1–2. After the second round, rule on each finding still open:
   - **Wrong, or its rebuttal holds** — park it: `Task <N>: parked — <finding> — ruling: <why the code stands>`.
   - **Real, but nothing downstream builds on it** — park it the same way, ruled real and deferred.
   - **Real and load-bearing** — mark the task `Task N: blocked (<why>)` and give your human partner the finding, the plan text it collides with, and the fix history.

A finding labeled `plan-mandated` or `plan-gap`, or a rebuttal marked plan-gap, goes to your human partner at any point: show it beside the plan text and ask what governs. Their answer becomes a ruling (see Rulings) before the fixer resumes.

Log each round: `Task <N>: fix round <R> (<X> addressed, <Y> open — <one-liners>; commits <a7>..<b7>)`.

## Rulings

Record each decision your human partner makes as `Task <N>: ruling — <decision>` in the ledger, and append it under `## Rulings` at the end of that task's brief file. Implementers and reviewers read the brief, where the ruling overrides the plan text.

## Final review

After every task in the boundary is complete:

1. If delivery supplied a UX gate runner, dispatch it. Send its review file to one fresh implementer, with the plan path as its brief and `ux-fix-report.md` as its report, then resume the runner once to recapture. Remaining blockers go to your human partner, other remaining findings to the ledger as Minors. The whole-branch review that follows covers those fixes.
2. Run `scripts/review-package --plan PLAN_FILE START HEAD`, START being the boundary's fork point (after a rebase, the recorded new parent head), and dispatch the whole-branch reviewer on the `gate` route with [code-reviewer.md](../requesting-code-review/code-reviewer.md). `[DESCRIPTION]` names the boundary number and its task set, so later boundaries' tasks don't read as missing; point it at the ledger, whose rulings override the plan, whose task reports carry the test evidence, and whose minor findings need triage.
3. Critical and Important findings go through the fix loop (plan-mandated and plan-gap ones to your human partner), with one fresh implementer fixing the review file's complete list rather than one fixer per finding; the plan path stands in for the brief and `final-fix-report.md` for the report. Final-review Minors go to the ledger.
4. The review is clean when no Critical or Important finding is open. Record `Final review: clean at <full SHA>, route <harness/model/effort>, report <absolute path>` in the ledger and return that SHA to delivery.

## Verification scope

Scope every gate as toolbelt:verification-before-completion says: the related tests plus the task's `Verify:` command at a task gate, the covering tests in a fix round.

Implementers produce fresh evidence for their own claims. Reviewers read that evidence instead of re-running it, unless it leaves a real doubt.

## Filling prompts

- `[REVIEW_NUANCE]` is task-specific context or risk, or `None`. It never tells a reviewer what not to flag and never pre-rates a severity.
- One task per prompt; never the session's history.
- Report and review files sit beside the brief: `task-N-report.md` and `task-N-review.md`; the final review writes `final-review.md`. Fix reports and re-reviews append to the same files.
- Fill every template placeholder; each template lists its own.

## Ledger

`<workspace>/progress.md` is the durable record; the todo list is not. Append to it with `scripts/ledger-append <workspace>/progress.md "<line>"`, as toolbelt:orchestrating says. First come the branch, the plan path, and the delivery ledger path when there is one; then only gate lines:

- `Task N: in-progress (agent <id>, route <harness>/<model>/<effort>)` at each implementer or reviewer dispatch, and its status or verdict when it returns; until then that agent is active.
- The fix-round, ruling, parked, and final-review lines their sections give.
- `Task N: blocked (<why>)`, then `Task N: unblocked (<what changed>)`.
- `Task N: complete (commits <base7>..<head7>, review clean|final, route <harness>/<model>/<effort>, report <path>)`.

After compaction or resume, read the ledger and `git log`; never re-dispatch a task it marks complete. Recorded routes are audit metadata: dispatch from the current routing text. Keep the workspace until delivery confirms the PR merged or your human partner abandons the work.
