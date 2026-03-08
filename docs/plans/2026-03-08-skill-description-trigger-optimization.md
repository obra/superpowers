# Skill Description Trigger Optimization - (IMPLEMENTED IN FULL)

**Date:** 2026-03-08
**Status:** Phases 1-3 Complete — "MUST USE" language applied to all workflow-critical skills (Phase 4: Validation pending user testing)
**Goal:** Increase skill invocation rates by optimizing the `description` frontmatter across all 23 skills.

## Problem

Claude Code only sees the `description` field from each skill's frontmatter in the system prompt. Current descriptions are generic ("Use when X") and lack explicit trigger phrases, causing the model to skip skill invocation and handle tasks with built-in behavior instead. Users report that skills are never explicitly loaded or announced.

## Why This Matters

The `description` is the **sole trigger mechanism** for skills in Claude Code. The model reads all descriptions, matches them against the current user request, and decides whether to call the `Skill` tool. A vague description competes poorly against the model's confidence in its own abilities. A specific, assertive description with explicit trigger phrases creates a stronger match signal.

## Evidence

- The standalone `claude-md-creator` skill (with explicit trigger phrases like "Triggers on any request involving 'create CLAUDE.md'") was consistently invoked on `/init`.
- The plugin version (with generic "Use when creating or improving CLAUDE.md") was never invoked on `/init`.
- After updating the plugin version with explicit triggers and "MUST USE" language, we expect improved invocation rates.

## Design Principles for Optimized Descriptions

### 1. Use assertive language
- Bad: `Use when creating CLAUDE.md files`
- Good: `MUST USE when creating, writing, or improving CLAUDE.md files`

### 2. List explicit trigger phrases
Include the exact user phrases, commands, and contexts that should activate the skill:
- Slash commands: `/init`, `/commit`, `/review`
- Natural language: "build this feature", "fix this bug", "plan the implementation"
- Contextual signals: "before merge", "after tests pass", "this looks broken"

### 3. Differentiate from built-in behavior
State what the skill adds beyond what the model would do on its own:
- Bad: `Expert Senior Software Engineer for coding tasks`
- Good: `MUST USE for implementation tasks. Enforces structured approach: requirements verification, edge case analysis, and incremental testing before writing code. Triggers on: "build this", "implement", "code this feature", "add functionality"`

### 4. Keep descriptions under 3 lines
Long descriptions get skimmed. Front-load the trigger conditions.

### 5. Include "MUST USE" for critical workflow skills
Skills that define the Superpowers methodology (using-superpowers, adaptive-workflow-selector, verification-before-completion) should use mandatory language.

## Implementation Plan

### Phase 1: Classify skills by trigger priority

**Always-on (session-level):**
- `token-efficiency` — already well-described
- `using-superpowers` — needs trigger optimization

**Workflow entry points (must trigger reliably):**
- `adaptive-workflow-selector`
- `claude-md-creator` — already updated
- `brainstorming`
- `systematic-debugging`
- `senior-engineer`

**Workflow continuations (triggered by other skills):**
- `writing-plans` (after brainstorming)
- `executing-plans` (after writing-plans)
- `subagent-driven-development` (alternative to executing-plans)
- `test-driven-development` (during implementation)
- `verification-before-completion` (before any completion claim)
- `finishing-a-development-branch` (after verification)

**On-demand specialists:**
- `frontend-craftsmanship`
- `security-reviewer`
- `testing-specialist`
- `requesting-code-review`
- `receiving-code-review`
- `prompt-optimizer`
- `context-management`
- `dispatching-parallel-agents`
- `using-git-worktrees`
- `writing-skills`

### Phase 2: Rewrite descriptions per skill

Each skill gets a new description following this template:

```yaml
description: >
  MUST USE when <primary trigger condition>.
  Triggers on: <explicit phrases, commands, contexts>.
  <One sentence on what it enforces/adds beyond default behavior>.
```

#### Proposed new descriptions:

**using-superpowers:**
```yaml
description: >
  MUST INVOKE at the start of every session and before any technical work.
  Selects and sequences the correct superpowers workflow skills.
  Triggers on: session start, new task, topic change, "what should I use",
  any technical request that hasn't been routed through a skill yet.
```

**adaptive-workflow-selector:**
```yaml
description: >
  MUST USE before any technical execution to classify task complexity as
  lightweight or full and select the minimum safe workflow path.
  Triggers on: any implementation request, bug fix, feature request,
  refactor, or code change before work begins.
```

**brainstorming:**
```yaml
description: >
  MUST USE when the user wants new features, behavior changes, architecture
  changes, or design decisions and there is no approved design yet.
  Triggers on: "build this", "add a feature", "I want to change",
  "how should we", "design", "architect", "new project", "greenfield".
  Enforces design-before-code with explicit user approval gate.
```

**systematic-debugging:**
```yaml
description: >
  MUST USE when a bug, test failure, error, or unexpected behavior appears
  and root cause is not yet proven. Triggers on: "it's broken", "this fails",
  "error", "bug", "not working", "unexpected behavior", test failures,
  stack traces, error logs. Enforces hypothesis-driven root cause analysis
  before any fix attempt.
```

**senior-engineer:**
```yaml
description: >
  MUST USE for all implementation and coding tasks. Enforces structured
  software engineering: requirements verification, edge case analysis,
  and incremental development. Triggers on: "implement", "build", "code",
  "create", "write the code", "develop", any request to produce source code.
```

**writing-plans:**
```yaml
description: >
  MUST USE when requirements are approved and implementation needs to be
  decomposed into executable tasks before coding starts. Triggers on:
  "write a plan", "plan the implementation", "break this down",
  after brainstorming approval, "how do we build this".
```

**executing-plans:**
```yaml
description: >
  MUST USE when executing an existing implementation plan in batches with
  review checkpoints. Triggers on: "execute the plan", "start building",
  "follow the plan", when a plan.md exists and user wants to begin work.
```

**subagent-driven-development:**
```yaml
description: >
  MUST USE when executing a plan in the current session using parallel
  subagents for per-task implementation with staged reviews. Triggers on:
  "use subagents", "parallel implementation", large plans with independent
  tasks, when executing-plans would benefit from parallelization.
```

**test-driven-development:**
```yaml
description: >
  MUST USE when implementing or fixing behavior to ensure tests are written
  first and verified failing before code changes. Triggers on: "write tests
  first", "TDD", any behavior change during implementation, bug fixes that
  need regression tests.
```

**verification-before-completion:**
```yaml
description: >
  MUST USE before claiming completion, correctness, or readiness for
  commit/PR. Requires fresh verification evidence (test output, build
  success, manual check). Triggers on: "done", "finished", "ready to
  commit", "ready for PR", "ship it", any completion claim.
```

**finishing-a-development-branch:**
```yaml
description: >
  MUST USE when implementation is verified and you need to choose the
  branch outcome: merge, PR, keep, or discard. Triggers on: "merge this",
  "create a PR", "we're done with this branch", "clean up the branch",
  after verification-before-completion passes.
```

**frontend-craftsmanship:**
```yaml
description: >
  MUST USE for any frontend, UI, or web interface implementation.
  Enforces production-grade visual quality, accessibility, responsive
  design, and professional polish. Triggers on: "build a UI", "frontend",
  "website", "landing page", "dashboard", "make it look professional",
  "modern design", any React/Vue/Svelte/HTML component work.
```

**security-reviewer:**
```yaml
description: >
  MUST USE for security-sensitive code: authentication, authorization,
  data handling, API endpoints, input validation, secrets management.
  Triggers on: "security review", "is this secure", auth code, API
  routes handling user data, before merging security-critical changes.
```

**testing-specialist:**
```yaml
description: >
  MUST USE when building comprehensive test suites or when test quality
  is the primary concern. Triggers on: "write tests", "improve test
  coverage", "test suite", "testing strategy", dedicated testing tasks.
```

**requesting-code-review:**
```yaml
description: >
  MUST USE after meaningful code changes or before merge to request
  structured review against requirements and quality standards.
  Triggers on: "review my code", "code review", "check this before merge",
  after implementation is complete and tests pass.
```

**receiving-code-review:**
```yaml
description: >
  MUST USE when handling review feedback to verify suggestions, resolve
  unclear items, and implement changes with technical rigor. Triggers on:
  review comments received, "address review feedback", "fix review comments",
  PR review responses.
```

**prompt-optimizer:**
```yaml
description: >
  Use when the user wants to improve a prompt before execution. Generates
  optimized variants and lets the user choose. Triggers on: "optimize this
  prompt", "improve my prompt", "make this prompt better", "rewrite this
  instruction".
```

**context-management:**
```yaml
description: >
  Use in long or noisy sessions to compress prior state into state.md
  and reduce context pollution. Triggers on: sessions exceeding 8 turns,
  repeated failures, topic shifts, "compress context", "clean up session",
  when token usage is visibly growing.
```

**dispatching-parallel-agents:**
```yaml
description: >
  Use when multiple tasks are independent and can run concurrently without
  file or state conflicts. Triggers on: "run these in parallel",
  "do these at the same time", plans with 3+ independent tasks,
  when subagent-driven-development identifies parallelizable work.
```

**using-git-worktrees:**
```yaml
description: >
  Use before implementation when work should be isolated from the current
  branch. Triggers on: "use a worktree", "isolate this work",
  "don't touch main", experimental or risky changes that need isolation.
```

**writing-skills:**
```yaml
description: >
  Use when creating or updating Superpowers skills and validating trigger
  accuracy. Triggers on: "create a skill", "write a skill", "update this
  skill", "improve skill triggering", skill development tasks.
```

**token-efficiency:**
Already well-described. No change needed.

### Phase 3: Update all SKILL.md files

For each skill:
1. Replace the `description` field in the YAML frontmatter with the new version.
2. Add a `## Trigger Conditions` section to the body (like we did for `claude-md-creator`) listing explicit activation conditions.
3. Do NOT change the skill body logic or workflow steps — only the trigger surface.

### Phase 4: Validate

- Test each updated skill by simulating the trigger phrases in a fresh Claude Code session.
- Verify that skills are explicitly invoked (the `Skill` tool is called) rather than just passively influencing behavior.
- Document trigger success rates before and after the change.

## Risks

- **Over-triggering:** "MUST USE" on too many skills could cause the model to invoke skills unnecessarily for simple tasks. Mitigated by `adaptive-workflow-selector` which gates micro tasks away from skills entirely.
- **Description length:** Longer descriptions add tokens to the system prompt. At ~3 lines per skill x 23 skills, this is ~69 lines — still negligible.
- **Conflicting triggers:** Multiple skills could match the same phrase (e.g., "build this" matches both `brainstorming` and `senior-engineer`). The `using-superpowers` routing guide handles sequencing, but descriptions should clarify which triggers first.

## Success Criteria

- Skills are explicitly invoked (visible "Loaded X Skill" in output) for their trigger conditions at least 80% of the time.
- The `/init` command consistently triggers `claude-md-creator`.
- A "build me a feature" request triggers the `using-superpowers` → `adaptive-workflow-selector` → `brainstorming` chain.
- A bug report triggers `systematic-debugging` without the user having to ask for it.
