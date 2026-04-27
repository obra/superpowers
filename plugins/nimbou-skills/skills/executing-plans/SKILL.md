---
name: executing-plans
description: Use when you have an approved implementation plan and want to execute it directly in the main session, while respecting task order, dependency groups, and required verifications.
---

# Executing Plans

## Overview

Load the plan, review it critically, detect whether it is task-driven or group-driven, then execute it without guessing.

This skill is the direct executor. The main agent performs the work itself and only uses parallelism when the plan already defines independent grouped items.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Prefer `nimbou-skills:subagent-driven-development` when the goal is to execute the plan through dedicated subagents with per-task review loops. Use this skill when execution should remain primarily in the controller agent.

## Step 1: Load and Review

1. Read the plan file
2. Review it critically
3. Raise any blockers or missing assumptions before starting
4. Detect execution shape:
   - **Wave mode (default):** explicit `## Ondas de Execução` (or legacy `## Grupos de Execucao`) with parallel-by-default tasks per wave; later waves only exist to consume contracts produced earlier
   - **Task mode (legacy):** traditional ordered tasks with checklists, no wave structure
5. Detect plan origin: if the header references `nestjs-plan` or the plan path matches a backend slice, the final wave MUST run `nimbou-skills:nestjs-test`. Add the dispatch to TodoWrite if the plan author forgot it.
6. Create TodoWrite and proceed only when the plan is executable

## Step 2: Execute

### Task mode

For each task:

1. Mark it as in progress
2. Follow each step exactly
3. Run the specified verifications
4. Mark it complete

### Wave mode

For each wave:

1. Confirm which files or tasks are independent inside the wave (default: all of them)
2. Dispatch all items in the wave in parallel — single message, multiple tool calls
3. Wait for the whole wave to finish before opening the next one
4. **After the wave completes, automatically dispatch `nimbou-skills:request-review` over the wave's diff.** Do not advance to the next wave until the review returns and any blocker-class findings are resolved
5. If one item in the wave fails, stop all downstream waves
6. Report the exact file, task, or wave that blocked the flow

If the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's review checkpoint, not before. The dispatch scope must cover **every prior wave's output** — controllers, use-cases, repositories, Prisma adapters, and migrations across the whole plan — not just the last wave's diff. When briefing `nestjs-test`, list the suites/files derived from the full plan surface.

Use wave mode whenever the plan models dependency order. Do not flatten the topology unless the user approves it; do not invent serial dependencies that the plan did not declare.

## Boundary

Use this skill for full plan execution.

Do not use it just because parallel work exists. If the real need is "split 3 unrelated failures across 3 agents", use `nimbou-skills:dispatching-parallel-agents` instead.

Do not use it when the desired workflow is "one subagent implements, then spec review, then code quality review for every task". That belongs to `nimbou-skills:subagent-driven-development`.

## Step 3: Complete Development

After all tasks complete and verifications pass:

- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- Use `nimbou-skills:finishing-a-development-branch`

## When to Stop

Stop immediately when:

- you hit a blocker
- the plan has critical gaps
- an instruction is unclear
- verification fails repeatedly
- a grouped plan encounters a failure that invalidates downstream groups

Ask for clarification instead of guessing.

## When to Revisit Review

Return to Step 1 when:

- the user updates the plan
- the approach needs rethinking
- a blocker shows the plan is incomplete or inconsistent

## Remember

- review the plan critically first
- follow plan steps exactly
- do not skip verifications
- respect wave order; dispatch in parallel within a wave by default
- never skip the post-wave `nimbou-skills:request-review` checkpoint
- run `nimbou-skills:nestjs-test` as the final wave when the plan came from `nestjs-plan`, scoped to every prior wave's output (not only the last wave's diff)
- stop when blocked
- do not start implementation on `main` or `master` without explicit user consent

## Integration

Required workflow skills:

- `nimbou-skills:using-git-worktrees` - set up an isolated workspace before starting
- `nimbou-skills:nestjs-plan` - creates task-driven backend plans for this skill to execute
- `nimbou-skills:nuxt-plan` - creates group-driven frontend plans for this skill to execute
- `nimbou-skills:finishing-a-development-branch` - completes the branch after execution

## Output Discipline

When execution completes or stops, report:

- what was executed
- what was verified
- what failed or remains blocked
- whether the failure belongs to one task, one file, or one wave
