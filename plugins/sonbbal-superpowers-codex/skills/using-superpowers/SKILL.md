---
name: using-superpowers
description: Use when starting a Codex conversation or task to identify and follow the relevant installed skills before acting.
---

# Using Superpowers In Codex

## Core Rule

If there is even a 1% chance an installed skill might apply, read the relevant `SKILL.md` before acting.

If a skill applies, you do not have a choice. You must use it. This is not optional, and you cannot rationalize your way out of it.

The skill check comes before context gathering, file inspection, code search, clarifying questions, or any other work when a skill may apply. If the skill turns out not to fit, continue normally.

After reading the skill, announce the skill you are using in one short line and follow its workflow.

Do not rely on memory. Skill files are the source of truth.

## How To Use Skills

1. Identify likely skills from the installed Codex skill package.
2. Read only the needed `SKILL.md` files and any directly referenced support files.
3. Announce the chosen skill and purpose.
4. Use `update_plan` for visible checklists or multi-step progress.
5. Execute the task according to the skill.

## Red Flags

These thoughts mean stop and check skills:

| Rationalization | Reality |
| --- | --- |
| "I need more context first" | Skill check comes before context gathering. |
| "Let me inspect files quickly" | File inspection is work. Check skills first. |
| "This is too simple" | Simple tasks still trigger skills. |
| "The skill is overkill" | If it applies, use it. |
| "I'll just do this once" | Do not skip the workflow. |
| "I remember the skill" | Read the current file. |

## Codex Tool Rules

Use Codex-native tools and names:

- `update_plan` for progress tracking.
- `spawn_agent` only when the user explicitly asks for subagents, delegation, parallel agent work, a reviewer workflow, or a team workflow.
- In team-driven-development mode, the main Codex session stays orchestration-only; `spawn_agent` creates worker subagents for implementation and separate reviewer subagents for review.
- `send_input` only for follow-up instructions to an existing delegated agent, including main-orchestrated rework after a reviewer rejects worker output.
- `resume_agent` when a delegated worker was closed but needs rework; if resume is unavailable or unsuitable, create a replacement worker with the prior diff, reviewer findings, ownership boundaries, and exact rework instructions.
- `wait_agent` only when the next local step is blocked on a delegated result.

Do not describe non-Codex runtime APIs as available actions.

## Delegation Gate

Do not spawn agents just because a task is complex. In Codex, complexity alone is not permission to delegate.

## Reviewer/Subagent Stop

Reviewer subagents and delegated reviewers must not treat their own review assignment as a request for team-driven-development, team-driven mode, or orchestration. They are already inside the delegated workflow.

If assigned as a reviewer, do not become an orchestrator and do not spawn another reviewer. Directly inspect the provided diff or patch, review the verification evidence, and return the requested review result.

`reviewer workflow` triggers team-driven-development only when the current Codex session is being asked to orchestrate or request a reviewer workflow. It does not trigger team-driven mode when the current session is already acting as the reviewer.

Normal delegation is optional and allowed only when the user explicitly requests one of these:

- subagents
- delegation
- parallel agents
- reviewer workflow, when asking the current session to orchestrate reviewers
- team workflow
- a named team-driven workflow

If the user does not explicitly request delegation, execute inline in the current Codex session and use local review checklists for quality gates.

When team-driven-development applies, delegation is not optional. The current Codex session executes orchestration, task routing, review routing, and final inspection only. It does not perform task implementation, task debugging, or task rework directly; final verification commands and final inspection remain the main session's responsibility. Spawn worker subagents for implementation/testing/debugging/rework, spawn separate reviewer subagents to inspect the actual diff or patch and verification evidence, and coordinate the workflow. Reviewer output may include explanation, but its final line must be exactly `Verdict: APPROVE` or `Verdict: REJECT`. On `Verdict: REJECT`, send rework instructions back to the worker with `send_input`; if that worker is closed, try `resume_agent` or spawn a replacement worker with the prior diff, reviewer findings, ownership boundaries, and exact rework instructions. Wait for the revised worker result, then run reviewer review again.

## Priority

When multiple skills apply:

1. Explicit team, subagent, delegation, parallel agent, or orchestrated reviewer workflow requests establish team-driven-development as the upper-level orchestration/execution mode before choosing any direct execution path. This determines where the work happens; it is not just another execution skill. Direct reviewer assignments do not; reviewers inspect the diff directly.
2. Process skills still apply, such as planning, debugging, TDD, and verification. In team-driven-development mode, carry those requirements into worker assignments and reviewer instructions instead of performing main-session implementation, debugging, testing, or rework.
3. Other execution skills follow within the selected mode, such as executing a plan. In team-driven-development mode, workers execute those instructions and reviewers verify the actual diff and evidence.
4. Verification skills apply whenever you are about to claim work is complete, fixed, or passing. In team-driven-development mode, the main session performs final inspection of worker and reviewer results before reporting completion.

User instructions define what to do. Skills define how to do it safely.
