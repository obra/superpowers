---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task. Reviews (spec compliance + code quality) run **per batch of 3-5 tasks or at end of sprint**, not after every task — this keeps the inner loop fast while still catching drift at natural checkpoints.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + batched two-stage review (spec then quality) = high quality, tight inner loop. See `using-superpowers` § Sprint Mode for the rationale.

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
- Two-stage review per batch (3-5 tasks) or per sprint: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

## The Process

```dot
digraph process {
    rankdir=TB;

    "Read plan, extract all tasks with full text, note context, confirm risk tier, create TodoWrite" [shape=box];

    subgraph cluster_per_task {
        label="Per Task (lightweight inner loop)";
        "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)" [shape=box];
        "Implementer asks questions?" [shape=diamond];
        "Answer questions, provide context" [shape=box];
        "Implementer implements, tests, commits, self-reviews" [shape=box];
        "Mark task complete in TodoWrite" [shape=box];
    }

    "End of batch (3-5 tasks) or end of plan?" [shape=diamond];

    subgraph cluster_per_batch {
        label="Per Batch (review pair)";
        "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md) for the batch" [shape=box];
        "Spec reviewer confirms batch matches spec?" [shape=diamond];
        "Implementer fixes spec gaps in affected tasks" [shape=box];
        "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md) for the batch" [shape=box];
        "Code quality reviewer approves?" [shape=diamond];
        "Implementer fixes quality issues" [shape=box];
    }

    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent for entire implementation" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract all tasks with full text, note context, confirm risk tier, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)";
    "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)" -> "Implementer asks questions?";
    "Implementer asks questions?" -> "Answer questions, provide context" [label="yes"];
    "Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)";
    "Implementer asks questions?" -> "Implementer implements, tests, commits, self-reviews" [label="no"];
    "Implementer implements, tests, commits, self-reviews" -> "Mark task complete in TodoWrite";
    "Mark task complete in TodoWrite" -> "End of batch (3-5 tasks) or end of plan?";
    "End of batch (3-5 tasks) or end of plan?" -> "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)" [label="no — next task"];
    "End of batch (3-5 tasks) or end of plan?" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md) for the batch" [label="yes"];
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md) for the batch" -> "Spec reviewer confirms batch matches spec?";
    "Spec reviewer confirms batch matches spec?" -> "Implementer fixes spec gaps in affected tasks" [label="no"];
    "Implementer fixes spec gaps in affected tasks" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md) for the batch" [label="re-review"];
    "Spec reviewer confirms batch matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md) for the batch" [label="yes"];
    "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md) for the batch" -> "Code quality reviewer approves?";
    "Code quality reviewer approves?" -> "Implementer fixes quality issues" [label="no"];
    "Implementer fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md) for the batch" [label="re-review"];
    "Code quality reviewer approves?" -> "More tasks remain?" [label="yes"];
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md — includes Golden Rule directive)" [label="yes — next batch"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
    "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
}
```

## Scaling Reviews by Risk Tier

The batched review pair (spec + quality) runs at batch boundaries, not after every task. The **depth** of each review pair scales with the risk tier of the batch (see `using-superpowers` § Risk Tiers):

- **Trivial batch:** skip the spec reviewer dispatch; rely on the implementer's self-review + a light controller-side quality glance only.
- **Standard batch:** spec reviewer + code quality reviewer at batch end, with fix loops as needed.
- **Critical batch:** spec + quality reviewers at batch end + always run the final global code reviewer before `finishing-a-development-branch`.

Any batch that touches a Non-Negotiable (see `using-superpowers` § Non-Negotiables) is treated as **critical** regardless of size or surface signals.

The final global review before `finishing-a-development-branch` is always run at sprint exit, regardless of tier.

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

**Architecture, design, and review tasks**: use the most capable available model.

**Task complexity signals:**
- Touches 1-2 files with a complete spec → cheap model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

## Handling Implementer Status

Implementer subagents report one of four statuses. Handle each appropriately:

**DONE:** Mark the task complete in TodoWrite and move on. Spec compliance review runs at the batch boundary (every 3-5 tasks) or at end of sprint, not after this single task.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the human

**Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]

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

[Mark Task 1 complete]

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

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
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
- Per task: only the implementer subagent (plus its self-review)
- Per batch (3-5 tasks) or per sprint: spec + code quality reviewers applied to the batch as a whole
- Per sprint exit: one final code reviewer before finishing-a-development-branch
- Controller does prep work upfront (extracting tasks, curating context)
- Review loops add iterations but catch issues early (cheaper than debugging later)
- Net effect: reviews are batched, not per-task, keeping the inner loop tight

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip the batch review pair (spec + quality) at batch or sprint boundaries
- Skip the final code reviewer at sprint exit
- Proceed with unfixed issues from a batch review
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace the batch review pair (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Close a sprint while either the batch review pair or the final review has open issues

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

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
