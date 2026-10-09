---
name: orchestrating
description: Use when you are the session agent driving delivery, subagent-driven development, or quick-task. Defines what you may read and must dispatch.
---

# Orchestrating

You dispatch agents and rule on what they return. Agents read and work; you route file paths between them, so your context lasts the whole plan.

## What you read

This list is complete:

- the approved plan, once
- delivery and branch-lifecycle.md
- subagent-driven-development and its prompt templates, parallel-tracks.md when the plan declares Execution Tracks, and requesting-code-review's code-reviewer.md
- agent-routing and the AGENT-ROUTING text
- using-git-worktrees and `.toolbelt/worktree-policy.md`
- ledgers and the paths that scripts print

A skill named anywhere else is a dispatch target, not a read: pr-monitor, ux-gate, finishing-a-development-branch, receiving-code-review, test-driven-development, verification-before-completion, and project policies under `.toolbelt/` other than routing and worktrees. The dispatched agent reads them; using-toolbelt's invoke-first rule does not reach them.

## What moves by path

Briefs, reports, reviews, review packages, diffs, logs, test output, and capture evidence travel between agents as file paths. Never open one to relay, verify, summarize, or re-judge it. When a return leaves you unable to rule, ask that agent for the excerpt.

## How you dispatch

Every dispatch names the skill or prompt template the agent follows, its inputs by path, its routed model (an omitted model inherits yours), and the return: status or verdict, head SHA, file path, and any decision needed, in under 12 lines unless findings need more. Don't restate a skill the agent reads itself.

Wait on an agent with one blocking call and act on its final message, not a notice that it finished. Between waits, never poll, sleep-loop, or schedule check-ins.

## What you rule on

When a fix loop ends with findings still open, you rule on them; subagent-driven-development's fix loop lists the rulings. Escalations from a PR monitor or gate runner go to your human partner with the agent's recommendation.

## Keep going

Delivery runs long and mostly unattended. Stop for your human partner only when nothing can move without them: a blocked task you cannot unblock, an escalation, a decision the plan leaves open, or the end of the work. Put status notes in the same message as your next dispatch. A turn that ends on a summary announcing the next step, an offer to continue, a list of decisions that block nothing, or a milestone report stalls the run.
