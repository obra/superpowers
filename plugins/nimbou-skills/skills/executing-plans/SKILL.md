---
name: executing-plans
description: Use when you have an approved wave-structured plan and want the controller agent to execute it directly, with a per-wave spec compliance gate, a per-wave code review checkpoint, a per-wave commit, and an end-of-plan follow-ups artifact.
---

# Executing Plans

## Overview

Load the plan, review it critically, confirm it is wave-structured, then execute it onda by onda. The controller agent performs the work itself. Each wave gets a spec compliance review and a code review checkpoint, then a single consolidated commit before the next wave opens. After the plan finishes, surface deferred work as a `<plan>.followups.md` artifact when there is anything to record.

This skill is the direct executor. Parallelism only happens within a wave, exactly as the plan declares it.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Prefer `nimbou-skills:subagent-driven-development` when execution should be delegated to per-task implementer subagents and you want a per-task spec gate plus a code quality review per task. Use this skill when execution should remain in the controller agent and review can be batched onda a onda — both the spec gate and the code quality review are wave-level here.

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Raise any blockers or missing assumptions before starting
4. Confirm wave structure: the plan must contain `## Ondas de Execução` (or the legacy `## Grupos de Execucao`). If it does not, **stop** and ask the plan author to regenerate the plan via `nimbou-skills:nestjs-plan` or `nimbou-skills:nuxt-plan`. Do not fall back to a serial task list.
5. Detect plan origin: if the header references `nestjs-plan` or the plan path matches a backend slice, the final wave MUST run `nimbou-skills:nestjs-test`. Add the dispatch to TodoWrite if the plan author forgot it.
6. Detect `## Pos-execucao` (typical for `nuxt-plan` output). Capture those items now to seed the follow-ups artifact in Step 3.
7. Create TodoWrite (one entry per wave, plus one entry per task inside each wave, plus the post-wave spec compliance checkpoint, plus the post-wave code review checkpoint, plus the post-wave commit, plus Step 3) and proceed only when the plan is executable.

## Step 2: Execute

For each wave, in declared order:

1. Confirm which files or tasks are independent inside the wave (default: all of them).
2. For **each task in the wave**, in parallel — single message, multiple tool calls when the work fans out:
   1. Execute the task (controller does the work).
   2. Run the verifications declared by the task.
   3. Mark the task implementation complete in TodoWrite once the work and its verifications land.
3. Wait for the entire wave to finish (every task implemented and verified) before opening the post-wave gates.
4. **After the wave completes, dispatch `./spec-reviewer-prompt.md` over the wave's combined diff** (every task in the wave at once).
   - If the reviewer returns `❌`, fix the gaps and re-dispatch the spec reviewer. Repeat until `✅`.
   - Capture any `⚠️ Deferred (non-blocking)` items the reviewer attaches — they feed Step 3.
5. **After the spec gate returns `✅`, automatically dispatch `nimbou-skills:request-review` over the wave's combined diff.** Do not advance to the next wave until the review returns and any blocker-class findings are resolved. Minor and Important findings that are not treated as blockers feed Step 3.
6. **After `request-review` returns clean (no open blockers)**, create a single commit consolidating the wave's diff:
   - One commit per wave. Stage explicitly the files touched by the wave; never use `git add -A`.
   - Mirror the repo's recent commit-message style (see `git log` on the current branch). Reference the wave (e.g., `Onda N — <título>`) and list the tasks included.
   - If fixes for Minor/Important findings were applied during the post-review step, include them in the same wave commit.
   - Never commit while the wave is `❌` on the spec gate or while a blocker from `request-review` is open.
7. If a task in the wave fails or a blocker is left open, stop all downstream waves. Report the exact file/task/wave that blocked the flow. **Do not commit a partially completed wave.**

If the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's spec gate, code review checkpoint, and commit, not before. The dispatch scope must cover **every prior wave's output** — controllers, use-cases, repositories, Prisma adapters, and migrations across the whole plan — not just the last wave's diff. When briefing `nestjs-test`, list the suites/files derived from the full plan surface.

Do not flatten the wave topology unless the user approves it. Do not invent serial dependencies the plan did not declare.

## Step 3: Generate Follow-ups Artifact

After **all** waves have finished (including the final `nestjs-test` wave when applicable, and after every wave's commit has landed):

1. Collect deferred items from four sources:
   - `⚠️ Deferred (non-blocking)` items returned by any per-wave spec reviewer during execution.
   - **Minor** and **Important** findings from the per-wave `nimbou-skills:request-review` that were not treated as blockers.
   - Concerns the controller raised during execution (architectural doubt, file growing too large, refactor suggestion, anything `DONE_WITH_CONCERNS`-equivalent).
   - Items declared in the plan's `## Pos-execucao` section (when present).
2. If the collected list is **empty**: do not create any file. Announce "Plano executado sem follow-ups pendentes." and stop here.
3. Otherwise, write `<plan>.followups.md` next to the plan file (same directory, same basename, `.followups.md` suffix) using `./followups-template.md`. Each entry must carry:
   - **Tipo** — one of `spec-deferred` | `review-minor` | `review-important` | `concern` | `pos-execucao`.
   - **Origem** — which wave/reviewer produced the item.
   - **Descrição** — short one-liner with `file:line` when applicable.
   - **Próximo passo** — the reviewer's suggested action, or `a definir` if none was given.

The follow-ups artifact is **not** part of any wave commit. Either commit it separately as a docs commit or hand it to the user — let `nimbou-skills:finishing-a-development-branch` decide how to integrate it.

## Step 4: Complete Development

After every wave is committed and Step 3 is finalized:

- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- Use `nimbou-skills:finishing-a-development-branch`.
- If a `<plan>.followups.md` was generated, mention its path in the completion summary.

## Boundary

Use this skill for full plan execution by the controller agent.

Do not use it just because parallel work exists. If the real need is "split N unrelated failures across N agents", use `nimbou-skills:dispatching-parallel-agents` instead.

Do not use it when the desired workflow is "one subagent implements, then spec review, then code quality review for every task". That belongs to `nimbou-skills:subagent-driven-development` — there the spec gate runs per task; here it runs per wave.

Do not use it on a plan that lacks `## Ondas de Execução` — refuse and request a wave-structured plan.

## When to Stop

Stop immediately when:

- you hit a blocker
- the plan has critical gaps
- an instruction is unclear
- a verification fails repeatedly
- the per-wave spec reviewer is stuck in a loop (more than 2 cycles without progress)
- a wave encounters a failure that invalidates downstream waves

Ask for clarification instead of guessing.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

## Remember

- review the plan critically first
- wave mode only — refuse plans without `## Ondas de Execução`
- run the spec reviewer after every wave's combined diff; never advance with `❌`
- run `request-review` after every wave's spec gate is `✅`
- commit once per wave, only after the wave's spec gate and `request-review` are both green
- run `nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped to every prior wave's output
- generate `<plan>.followups.md` only when there are deferred items
- stop when blocked
- do not start implementation on `main` or `master` without explicit user consent

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` — set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` — produces wave-structured backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` — produces wave-structured frontend plans for this skill to execute
- `nimbou-skills:request-review` — REQUIRED: dispatched automatically after every wave's diff
- `nimbou-skills:nestjs-test` — REQUIRED final wave when the plan came from `nestjs-plan`, scoped to every prior wave's output
- `nimbou-skills:finishing-a-development-branch` — completes the branch after execution

Local templates:

- `./spec-reviewer-prompt.md` — per-wave spec compliance reviewer prompt
- `./followups-template.md` — skeleton for `<plan>.followups.md`

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed
- what the per-wave spec reviewer flagged (✅/❌ per wave, any deferred items)
- what `request-review` returned per wave
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated and where it lives
