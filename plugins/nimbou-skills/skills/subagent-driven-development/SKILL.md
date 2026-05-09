---
name: subagent-driven-development
description: Use when executing an approved implementation plan through subagents, especially when task-level spec compliance and code quality review gates are required.
---

# Subagent-Driven Development

Execute plan by dispatching a fresh implementer subagent per task, with two-stage review after each: spec compliance review first, then code quality review. Tasks inside the same wave dispatch in parallel; after every wave, run an automatic `nimbou-skills:request-review` over the wave's diff before advancing. When the plan came from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh implementer subagent per task + two-stage review (spec then quality) = high quality, fast iteration. Parallel within a wave, sequential between waves only when a contract dependency justifies it, automatic `nimbou-skills:request-review` checkpoint between waves.

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
    "Stay in this session?" -> "executing-plans" [label="no - direct inline execution preferred"];
}
```

**vs. Executing Plans:**
- `executing-plans` is the direct executor: the controller agent performs the plan itself
- `subagent-driven-development` executes the plan through subagents
- Each task gets mandatory staged reviews: spec compliance first, then code quality
- Use this when stronger quality gates matter more than minimizing orchestration overhead

## Boundary

Use this skill for full plan execution when subagents are the implementation mechanism.

Do not use it just to fan out unrelated failures. That belongs to `nimbou-skills:dispatching-parallel-agents`.

Do not use it when the plan should simply be executed inline by the controller agent with normal verification steps. That belongs to `nimbou-skills:executing-plans`.

## Role Routing

Plans produced by `nimbou-skills:nestjs-plan` and `nimbou-skills:nuxt-plan` declare a `**Role:**` slug per task. The slug already includes the `nimbou-skills:` prefix — use it **directly** as the `subagent_type` argument of the `Agent` tool. Do not strip the prefix. The role agent already carries Clean Architecture, naming, and boundary rules — keep the dispatch prompt lean (task spec + scene-setting + delivery contract).

| Role slug (use as `subagent_type`) | Use when |
|---|---|
| `nimbou-skills:prisma-schema-author` | task evolves `schema.prisma` and/or migrations |
| `nimbou-skills:prisma-repository-author` | task implements/extends a repository adapter against an application port |
| `nimbou-skills:nestjs-usecase-author` | task creates one application use-case (one verb) and its ports |
| `nimbou-skills:nestjs-controller-author` | task wires HTTP transport: controller, DTOs, guards, module |
| `nimbou-skills:vue-component-author` | task creates/evolves a Vue SFC under `components/` |
| `nimbou-skills:nuxt-composable-author` | task creates/evolves a composable or its util |
| `nimbou-skills:nuxt-page-author` | task creates/evolves a page, layout, or route wiring |

**Fallback:** if a task has no `**Role:**` field, dispatch with `general-purpose` and surface the missing role as a planning warning in your TodoWrite/post-task report. Do not silently rely on the fallback — fix the plan instead.

The same `Role:` slug also feeds `./spec-reviewer-prompt.md` and `./code-quality-reviewer-prompt.md`, which use it to anchor the boundary contract during review. See those templates for the per-role focus list.

## The Process

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Read task's Role: slug (fallback: general-purpose with warning)" [shape=box];
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
        "Mark task complete in TodoWrite" [shape=box];
    }

    "Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent for entire implementation" [shape=box];
    "Use nimbou-skills:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Read task's Role: slug (fallback: general-purpose with warning)";
    "Read task's Role: slug (fallback: general-purpose with warning)" -> "Dispatch implementer subagent (./implementer-prompt.md)";
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
    "Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
    "Mark task complete in TodoWrite" -> "More tasks remain?";
    "More tasks remain?" -> "Read task's Role: slug (fallback: general-purpose with warning)" [label="yes"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
    "Dispatch final code reviewer subagent for entire implementation" -> "Use nimbou-skills:finishing-a-development-branch";
}
```

## Wave Coordination

Plans from `nestjs-plan` and `nuxt-plan` ship as `## Ondas de Execução`. Honor that topology:

1. Group the extracted tasks by their declared wave.
2. For each wave, dispatch every task's implementer subagent in parallel — single message, multiple `Agent` tool calls. The per-task spec → code-quality review loop still runs per task.
3. Wait for the entire wave to finish (all tasks complete and approved by both reviewers) before opening the next wave.
4. **After every wave, dispatch a single `nimbou-skills:request-review` over the wave's combined diff.** Resolve any blocker-class findings via the implementer subagents before opening the next wave. Note this as a checkpoint in TodoWrite.
5. If the plan originated from `nestjs-plan`, the final wave is `nimbou-skills:nestjs-test`. Run it after the last implementation wave's review checkpoint, and brief it with scope covering **only the files this plan changed** — controllers, use-cases, repositories, Prisma adapters, and migrations introduced across waves 1 through N — and nothing else. The briefing must enumerate explicit suite/file paths and require the runner to be invoked with those paths; never approve a final-wave dispatch that would resolve to an unfiltered `pnpm test`.
6. Never dispatch a later wave's tasks until earlier waves are reviewed and green — that is the only legitimate reason a later wave exists.

A later wave that introduces no contract dependency on earlier work is a planning bug. Flag it instead of executing it as-is.

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

**DONE:** Proceed to spec compliance review.

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

[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "Use the infrastructure adapter under src/infra/filesystem/"

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
- More orchestration overhead
- Stronger review discipline
- Better fit when per-task implementation and review should be delegated explicitly

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
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Serialize tasks that share a wave (the wave is the parallelism boundary; only different waves are sequential)
- Skip the post-wave `nimbou-skills:request-review` checkpoint
- Skip the final-wave `nimbou-skills:nestjs-test` dispatch when the plan came from `nestjs-plan`, or let it widen beyond the files this plan changed (the scope must span the plan's whole diff but **only** that diff — no full-suite runs, no unfiltered `pnpm test`)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues
- Open the next wave while the post-wave review has open blockers
- Dispatch with `general-purpose` when the task carries a valid `**Role:**` slug (always honor the role; the fallback is only for missing/unknown slugs)
- Silently swallow the missing-role warning when a task arrives without `**Role:**` (always surface it as a planning gap)

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
- **nimbou-skills:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **nimbou-skills:nestjs-plan** - Creates the plan this skill executes
- **nimbou-skills:request-review** - REQUIRED: dispatched automatically after every wave's diff
- **nimbou-skills:nestjs-test** - REQUIRED final wave when the plan came from `nestjs-plan`, scoped strictly to the files this plan changed (no full-suite runs)
- **nimbou-skills:finishing-a-development-branch** - Complete development after all waves

**Subagents should use:**
- **nimbou-skills:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **nimbou-skills:executing-plans** - Use when the controller agent should execute the plan directly instead of routing each task through subagents
