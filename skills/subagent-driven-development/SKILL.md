---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Announce at start:** "I'm using the subagent-driven-development skill to execute tasks with independent subagents."

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

**Subagent lifecycle:** Each task gets a fresh subagent. The subagent persists within that task (including any re-review loops) but is not reused across tasks.

## When to Use

```dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Stay in this session?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Stay in this session?" -> "subagent-driven-development" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no - parallel session"];
}
```

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

**If plan has 4+ tasks with 2+ waves of parallelism**, consider **agent-team-driven-development** for parallel execution with persistent specialists instead.

## The Process

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer subagent asks questions?" [shape=diamond];
        "Answer questions, provide context" [shape=box];
        "Implementer subagent implements, tests, commits, self-reviews" [shape=box];
        "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
        "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
        "Implementer subagent fixes spec gaps" [shape=box];
        "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
        "Code quality reviewer subagent approves?" [shape=diamond];
        "Implementer subagent fixes quality issues" [shape=box];
        "Mark task complete with TaskUpdate" [shape=box];
    }

    "Read plan, extract all tasks with full text, note context, create tasks with TaskCreate" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent (whole feature, all tasks)" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract all tasks with full text, note context, create tasks with TaskCreate" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
    "Implementer subagent asks questions?" -> "Answer questions, provide context" [label="yes"];
    "Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Implementer subagent asks questions?" -> "Implementer subagent implements, tests, commits, self-reviews" [label="no"];
    "Implementer subagent implements, tests, commits, self-reviews" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)";
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
    "Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
    "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
    "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes"];
    "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
    "Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
    "Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
    "Code quality reviewer subagent approves?" -> "Mark task complete with TaskUpdate" [label="yes"];
    "Mark task complete with TaskUpdate" -> "More tasks remain?";
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent (whole feature, all tasks)" [label="no"];
    "Dispatch final code reviewer subagent (whole feature, all tasks)" -> "Use superpowers:finishing-a-development-branch";
}
```

## Evidence Requirements

Implementers MUST provide evidence before the controller marks a task complete. See `superpowers:verification-before-completion` for the canonical evidence format.

**Required per task:**

| Evidence | Type | Contents |
|----------|------|---------|
| Test output | Command | Test command, verbatim output, exit code |
| Commit | Diff | `git diff --stat`, commit SHA |

**TDD gate:** Before marking implementation complete, verify RED evidence (test fails for right reason) then GREEN evidence (test passes). Both must exist. See `superpowers:test-driven-development` for Solo TDD mode details.

**Rejection rule:** Any completion report missing command + diff evidence is rejected: "Missing evidence. Required: command (test output) + diff (commit SHA)."

## State Integration

After each task completes, update `.superpowers/state.yml`:

```yaml
plan:
  completed_tasks: [1, 2, 3]  # append task number
```

On session start (or cold resume), read state.yml to find `plan.completed_tasks` and skip already-completed tasks. This enables cross-session continuity without re-executing work.

If using directory-based plans (`docs/plans/<project>/tasks/`), load individual task files rather than the full plan — approximately 2.7x token savings for large plans.

## Re-Review Loop Bound

After 3 rejection cycles on the same task (spec or quality), stop looping and escalate:
- Report to the user with the full rejection history
- Ask whether to continue, reassign, or adjust the spec
- Do NOT silently loop a 4th time

## Pre-Flight Context Check

Before dispatching each new implementer subagent, check context utilization. If below ~50% context remaining:
- Run `/compact` to compress conversation history
- Then dispatch the subagent

Skipping this causes subagent failures mid-task when the parent context fills.

## Agent-Aware Dispatch

When a team roster exists (from composing-teams), use the specified agent definition for implementer subagents instead of generic `general-purpose`:

- If the task has an `Agent:` field, use that agent definition
- If the roster specifies a model for the agent, use that model
- If no model is specified or `model: inherit`, use the most powerful available model
- Reviewer subagents still use their standard definitions (`general-purpose` for spec, `superpowers:code-reviewer` for quality)

## Review Tiering

For simple, low-risk tasks: light review (single combined pass checking both spec compliance and code quality in one round).
For default tasks: standard two-stage review (spec compliance, then code quality).
For auth/payment/data tasks: critical — add a security-focused review pass after code quality.

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create tasks with TaskCreate]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

[Verify evidence: Command (5/5 tests pass, exit 0) + Diff (SHA: abc1234, 3 files changed)]
[Update state.yml: plan.completed_tasks: [1]]
[Mark Task 1 complete with TaskUpdate]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Verify evidence: Command (8/8 tests pass, exit 0) + Diff (SHA: def5678, 4 files changed)]
[Update state.yml: plan.completed_tasks: [1, 2]]
[Mark Task 2 complete with TaskUpdate]

...

[After all tasks]
[Dispatch final code-reviewer: review entire feature, all tasks, all commits]
Final reviewer: All requirements met, ready to merge

Done!
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Two-stage review: spec compliance, then code quality
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more prep work (extracting all tasks upfront)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip both review stages entirely — for simple tasks use a combined single-pass review, but always review something
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues
- Mark task complete without command evidence (test output) + diff evidence (commit SHA)
- Mark task complete without RED + GREEN TDD evidence

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**REQUIRED:** After all tasks are complete, invoke `superpowers:finishing-a-development-branch` to handle merge/PR/cleanup. Do not skip this step.

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
- **superpowers:agent-team-driven-development** - Use for parallel execution with persistent specialist agents across waves (better for 4+ tasks with parallelism)
