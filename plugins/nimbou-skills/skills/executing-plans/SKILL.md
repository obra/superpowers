---
name: executing-plans
description: Use when you have an approved wave-structured plan and want the controller agent to execute it directly, dispatching per-wave spec compliance and code review as non-blocking subagents whose findings feed an end-of-plan follow-ups artifact.
---

# Executing Plans

## Overview

Load the plan, review it critically, confirm it is wave-structured, then execute it onda by onda. The controller agent performs the work itself. Each wave is committed as soon as its tasks land and verify. The spec compliance review and the code review run as **non-blocking subagents** dispatched in background — their findings never gate task or wave progression; they accumulate into `<plan>.followups.md` at the end.

This skill is the direct executor. Parallelism only happens within a wave, exactly as the plan declares it. Reviews run alongside execution, not in front of it.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Use this skill when execution should remain in the controller agent and reviews should be advisory rather than gating.

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Raise any blockers or missing assumptions before starting
4. Confirm wave structure: the plan must contain `## Ondas de Execução` (or the legacy `## Grupos de Execucao`). If it does not, **stop** and ask the plan author to regenerate the plan via `nimbou-skills:nestjs-plan` or `nimbou-skills:nuxt-plan`. Do not fall back to a serial task list.
5. Detect plan origin: if the header references `nestjs-plan` or the plan path matches a backend slice, the final wave MUST run `nimbou-skills:nestjs-test` scoped strictly to the files the plan touched. Add the dispatch to TodoWrite if the plan author forgot it. Never let the final wave widen into an unfiltered `pnpm test` run.
6. Detect `## Pos-execucao` (typical for `nuxt-plan` output). Capture those items now to seed the follow-ups artifact in Step 3.
7. Create TodoWrite (one entry per wave, plus one entry per task inside each wave, plus the post-wave commit, plus a single "collect background review results" entry, plus Step 3) and proceed only when the plan is executable.

## Step 2: Execute

For each wave, in declared order:

1. Confirm which files or tasks are independent inside the wave (default: all of them).
2. For **each task in the wave**, in parallel — single message, multiple tool calls when the work fans out:
   1. Execute the task (controller does the work).
   2. Run the verifications declared by the task **exactly as written** — they are already scoped to the files that task changes. Do not substitute them for an unfiltered test command (no bare `pnpm test`, `npm test`, `pytest`, etc.).
   3. Mark the task implementation complete in TodoWrite once the work and its verifications land.
3. Wait for the entire wave to finish (every task implemented and verified) before committing.
4. **Commit the wave immediately** once every task in the wave is implemented and its verifications pass:
   - One commit per wave. Stage explicitly the files touched by the wave; never use `git add -A`.
   - Mirror the repo's recent commit-message style (see `git log` on the current branch). Reference the wave (e.g., `Onda N — <título>`) and list the tasks included.
   - Do not wait for reviews. Reviews are advisory and run in background.
5. **Dispatch the per-wave reviews as background subagents** right after the commit lands, in a single message with two parallel `Agent` calls (`run_in_background: true`):
   - **Spec compliance reviewer** — `Agent` with `subagent_type: general-purpose`, prompt built from `./spec-reviewer-prompt.md` over the wave's commit diff. Its job is to detect Missing/Extra/Misunderstanding findings and `⚠️ Deferred` items.
   - **Code reviewer** — `Agent` with `subagent_type: nimbou-skills:code-reviewer`, scoped to the same commit range, briefed via `nimbou-skills:request-review` placeholders.
   - Record each background agent's id/name in TodoWrite under the "collect background review results" entry so Step 3 can pick them up.
   - Do **not** wait for either review to return before opening the next wave.
6. Move to the next wave as soon as the current wave is committed and its two background reviewers are dispatched.
7. If a task in the wave fails or its verification is impossible to satisfy, stop downstream waves. Report the exact file/task/wave that blocked the flow. **Do not commit a partially completed wave.** Reviewer ❌ findings never trigger this stop — they go to follow-ups.

If the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's commit, not before. The dispatch scope must cover **only what this plan changed** — controllers, use-cases, repositories, Prisma adapters, and migrations introduced or modified across waves 1 through N — and nothing else. When briefing `nestjs-test`, list the explicit suite/file paths derived from the plan's diff and require that the test runner be invoked with those paths (e.g., `pnpm test -- --runInBand <suite-path>`); reject any briefing that resolves to an unfiltered suite run. The `nestjs-test` wave itself follows the same pattern: commit when green, then dispatch its two background reviewers.

Do not flatten the wave topology unless the user approves it. Do not invent serial dependencies the plan did not declare.

## Step 3: Collect Reviews and Generate Follow-ups Artifact

After **all** waves have finished and committed (including the final `nestjs-test` wave when applicable):

1. Wait for every background review subagent dispatched in Step 2.5 to finish. Read each one's result. **Do not skip any** — even if some waves are old, their reviewers' findings still belong in follow-ups.
2. Collect deferred items from these sources:
   - **Every finding** returned by the per-wave spec reviewer subagents — `❌ Issues found` and `⚠️ Deferred (non-blocking)` alike. Since reviews are non-blocking here, both buckets land as follow-ups.
   - **Every finding** returned by the per-wave code reviewer subagents — Critical, Important, and Minor. Since reviews are non-blocking here, all severities land as follow-ups, tagged by severity so the user can triage.
   - Concerns the controller raised during execution (architectural doubt, file growing too large, refactor suggestion, anything `DONE_WITH_CONCERNS`-equivalent).
   - Items declared in the plan's `## Pos-execucao` section (when present).
3. If the collected list is **empty**: do not create any file. Announce "Plano executado sem follow-ups pendentes." and stop here.
4. Otherwise, write `<plan>.followups.md` next to the plan file (same directory, same basename, `.followups.md` suffix) using `./followups-template.md`. Each entry must carry:
   - **Tipo** — one of `spec-issue` | `spec-deferred` | `review-critical` | `review-important` | `review-minor` | `concern` | `pos-execucao`.
   - **Origem** — which wave/reviewer produced the item.
   - **Descrição** — short one-liner with `file:line` when applicable.
   - **Próximo passo** — the reviewer's suggested action, or `a definir` if none was given.

The follow-ups artifact is **not** part of any wave commit. Commit it separately as a docs commit. Then proceed to Step 4 to execute the collected follow-ups.

## Step 4: Execute Follow-ups

After `<plan>.followups.md` is committed (or confirmed empty), work through **all** collected items before declaring the plan complete:

1. Triage the follow-ups list by severity: `review-critical` and `spec-issue` first, then `review-important`, then `review-minor`, `concern`, and `pos-execucao` last.
2. For each item in priority order:
   - Read the finding and the affected file(s).
   - **If the fix can be implemented by the agent:** implement it, run the scoped verification declared for the affected file (never an unfiltered suite run), and mark the entry resolved in `<plan>.followups.md` with a one-line resolution note and the commit that fixed it.
   - **If the item requires a manual action** (human decision, external system change, environment config, infra adjustment, or anything the agent cannot execute): do **not** write it to the file. Surface it in the output under a clearly labelled "Ações manuais necessárias" section, describing what needs to be done and why the agent cannot do it.
3. Commit all follow-up fixes together in a single commit (or one commit per logical group when fixes are unrelated). Stage explicitly — never `git add -A`.
4. Dispatch a final background code reviewer subagent over the follow-up commit(s) to confirm the fixes landed correctly. Append any new findings back to `<plan>.followups.md` as `review-*` entries marked `(follow-up round)`.
5. When all automatable items are resolved, announce: "Plano executado. Todos os follow-ups automatizáveis resolvidos." If manual items were surfaced, list them once more in the final announcement so the user has them in one place.

## Boundary

Use this skill for full plan execution by the controller agent when reviews should be advisory.

Do not use it just because parallel work exists. If the real need is "split N unrelated failures across N agents", use `nimbou-skills:dispatching-parallel-agents` instead.

Do not use it on a plan that lacks `## Ondas de Execução` — refuse and request a wave-structured plan.

## When to Stop

Stop immediately when:

- you hit a blocker in implementation
- the plan has critical gaps
- an instruction is unclear
- a verification fails repeatedly
- a wave encounters a failure that invalidates downstream waves

Reviewer findings — including ❌ from the spec reviewer or Critical from the code reviewer — do **not** stop execution. They go to follow-ups and are surfaced to the user at completion.

Ask for clarification instead of guessing.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

## Remember

- review the plan critically first
- wave mode only — refuse plans without `## Ondas de Execução`
- commit each wave as soon as its tasks land and verify; do not wait for reviewers
- dispatch the spec reviewer and the code reviewer as background subagents per wave (run_in_background)
- never let reviewer output gate the next wave — findings feed `<plan>.followups.md`
- run `nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (explicit suite paths only — never an unfiltered `pnpm test`)
- collect every background reviewer's result before producing follow-ups
- generate `<plan>.followups.md` only when there are deferred items
- execute **all** follow-ups before declaring completion — manual items go to the output, not to the file
- stop when blocked by implementation, not by reviewer output
- do not start implementation on `main` or `master` without explicit user consent

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` — set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` — produces wave-structured backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` — produces wave-structured frontend plans for this skill to execute
- `nimbou-skills:request-review` — REQUIRED: dispatched as a background subagent after every wave's commit
- `nimbou-skills:nestjs-test` — REQUIRED final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (no full-suite runs)
Local templates:

- `./spec-reviewer-prompt.md` — per-wave spec compliance reviewer prompt (dispatched as a background subagent)
- `./followups-template.md` — skeleton for `<plan>.followups.md`

## Output Discipline

When execution completes or stops, report:

- which waves were executed and committed
- what each per-wave spec reviewer subagent returned (✅ / ❌ / ⚠️ Deferred), per wave
- what each per-wave code reviewer subagent returned (Critical/Important/Minor counts), per wave
- what failed or remains blocked, and whether the failure belongs to one task, one file, or one wave
- whether `<plan>.followups.md` was generated, where it lives, and whether it carries `review-critical` or `spec-issue` entries the user should look at
