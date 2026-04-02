# Plugin Integration Reference: GSD & Superpowers

How Prompt Forge output should be structured to maximize the effectiveness of these two major Claude Code workflow plugins.

## Table of Contents
1. GSD (Get Shit Done) — How it works
2. GSD — What it needs from Prompt Forge
3. Superpowers — How it works
4. Superpowers — What it needs from Prompt Forge
5. Detecting which plugin is active
6. Output format comparison

---

## 1. GSD (Get Shit Done) — How it works

GSD is a spec-driven development system that fights context degradation by spawning fresh subagent contexts for each task. It has two main modes:

### Full project mode (`/gsd:new-project` or `/gsd:new-milestone`)

The flow is a chain of phases, each in a fresh context:

1. **Interview** — GSD asks clarifying questions about requirements, constraints, and goals. It extracts what you're building, for whom, with what constraints.
2. **Research** — Parallel research agents investigate libraries, APIs, design patterns, and best practices. Results are saved to `.planning/research/`.
3. **Requirements scoping** — Per-category feature selection (what's in v1?). Creates PROJECT.md and SUMMARY.md.
4. **Roadmap** — Phased roadmap with task breakdowns. Each phase has objectives, files, verification steps, and success criteria.
5. **Planning** — Per-phase PLAN.md files. Each plan is small enough (~50% of context window) for a fresh subagent to execute without degradation.
6. **Execution** — Subagents execute plans. Atomic commits per task. Wave-based parallelism for independent tasks.
7. **Verification** — Goal-backward: "what must be TRUE?" not "what tasks did we do?"

### Quick mode (`/gsd:quick`)

Same guarantees but faster path. You describe what you want, GSD creates a PLAN.md and SUMMARY.md, then executes. Flags modify behavior:
- `--discuss` — Discussion before planning
- `--research` — Spawns a researcher first
- `--full` — Adds plan-checking and post-execution verification
- Flags are composable

### What GSD stores

Everything lives in `.planning/`:
- `PROJECT.md` — Project definition and requirements
- `SUMMARY.md` — Synthesized context (this is the key state file)
- `research/` — Research agent findings
- `phases/NNN-phase-name/PLAN.md` — Execution plans
- `quick/NNN-task-name/PLAN.md` — Quick mode plans

### The key insight for Prompt Forge

GSD's quality depends on what goes into the interview phase. If the initial description is vague, the interview wastes time extracting basics. If it's rich and grounded, the interview goes deeper — asking about edge cases and architecture decisions instead of "what framework are you using?"

The PLAN.md files are the actual prompts that subagents receive. They need to be specific enough that a fresh agent with no prior context can execute them. Prompt Forge's grounding work (real file paths, real function names, real patterns) directly improves plan quality.

---

## 2. GSD — What it needs from Prompt Forge

### For `/gsd:new-project` or `/gsd:new-milestone`:

**Structure the input as a rich project brief.** This becomes the starting point for GSD's interview.

```
## Project/Feature: [Name]

### What I'm building
[2-3 sentences: what it does, who it's for, why it matters]

### Technical environment
- Runtime: [Node 20, Python 3.12, etc.]
- Framework: [Express 4.18, Next.js 15, Django 5, etc.]
- Database: [PostgreSQL + Prisma 5.x, MongoDB + Mongoose, etc.]
- Auth: [JWT in @src/middleware/auth.ts, OAuth via @src/lib/oauth.ts, etc.]
- Testing: [Jest + Supertest, pattern in @tests/routes/orders.test.ts]
- Key packages: [list with versions from package.json]

### Existing patterns to follow
- API routes follow the pattern in @src/routes/orders.ts
- Services follow @src/services/order-service.ts
- DB access through Prisma client in @src/lib/prisma.ts
- Error handling uses AppError class in @src/lib/errors.ts

### Scope boundaries
IN: [what to build — be specific]
OUT: [what NOT to touch — be explicit]

### Non-functional requirements
- Security: [specific concerns from security lens]
- Performance: [specific requirements from performance lens]
- Compatibility: [what must keep working]

### Success criteria
[Testable statements — "user can do X", "endpoint returns Y when Z"]

### Research findings
[From Prompt Forge's web research — best practices, gotchas, version notes.
This gives GSD's research agents a head start.]
```

### For `/gsd:quick`:

**Structure as a focused task description.** This is what GSD plans and executes directly.

```
[Task description — clear, grounded, 2-3 sentences max]

Technical context: [stack, affected files with @references]
Follow pattern in: @[reference file]
Constraints: [what not to break]
Verify: [test command + what to check]

Research note: [any version-specific gotcha or best practice]
```

---

## 3. Superpowers — How it works

Superpowers is a composable skills framework that enforces a structured development methodology. Skills activate automatically when relevant.

### The core workflow

1. **Brainstorming** (`/superpowers:brainstorm` or `/brainstorming`)
   - Mandatory before any creative work (features, components, behavior changes)
   - Socratic questioning: refines rough ideas through questions
   - Explores alternatives, presents design in digestible sections
   - Saves a design document that feeds into planning

2. **Planning** (`/superpowers:write-plan` or `/writing-plans`)
   - Takes the approved design and creates micro-tasks (2-5 minutes each)
   - Each task has exact file paths, complete code description, verification steps
   - Tasks are ordered for TDD: test first, then implementation

3. **Execution** (`/superpowers:execute-plan` or `/executing-plans` / `/subagent-driven-development`)
   - Fresh subagent per task (clean context, no degradation)
   - Two-stage review: spec compliance, then code quality
   - Batched with human checkpoints
   - Code-reviewer agent validates against plan and coding standards

4. **TDD** (`/test-driven-development`)
   - Activates during implementation
   - Enforces RED-GREEN-REFACTOR: write failing test → watch it fail → write minimal code → watch it pass → commit
   - No exceptions to this order

5. **Debugging** (`/systematic-debugging`)
   - Four-phase methodology: reproduce → investigate root cause → fix → verify
   - Must confirm root cause before any fix

6. **Verification** (`/verification-before-completion`)
   - Activates before claiming work is done
   - Evidence-based: prove it works, don't claim it works

### What Superpowers values

- **Tests always before code.** No exceptions.
- **Domain over implementation.** Work at the problem level, not the solution level.
- **Complexity reduction.** Simplicity as primary goal. YAGNI.
- **Evidence over claims.** Verify before declaring success.
- **Systematic over ad-hoc.** Process over guessing.

### The key insight for Prompt Forge

Superpowers' brainstorming phase is where quality is won or lost. If it starts from a vague "I want a feature," it spends most of its time extracting basics. If it starts from a **rich, pre-analyzed prompt with design considerations already surfaced**, the brainstorming goes deeper — exploring architectural alternatives, edge cases, and failure modes instead of asking "what does this feature do?"

The planning phase creates tasks with exact file paths. Prompt Forge's code grounding ensures these paths are correct from the start, preventing the #1 failure mode: plans that reference files that don't exist.

---

## 4. Superpowers — What it needs from Prompt Forge

### For brainstorming input:

**Structure as a rich feature brief with design considerations pre-loaded.** The brainstorming skill will refine this, not extract it.

```
## Feature: [Name]

### Intent
[What I want to build and why — business context, user problem being solved]

### Technical landscape
- Stack: [framework, versions]
- Affected code: @[list of files that will be touched]
- Related implementations: @[similar feature already in codebase]
- Test setup: [framework, patterns in @test-file]

### Design considerations (for brainstorming to refine)

**Architecture:** [How this fits into the existing codebase structure.
Reference existing patterns. Flag any architectural decisions needed.]

**Security:** [Auth implications, input validation needs, data exposure risks.
Specific to this feature, not generic security advice.]

**Performance:** [Expected load, caching considerations, query concerns.
Reference specific DB queries or endpoints.]

**UX:** [What the user sees/experiences, error states, loading states.]

**Edge cases:** [Specific scenarios that could break, boundary conditions,
error handling requirements.]

### Testing strategy (for TDD planning)
- Must test: [critical paths — feeds TDD red phase]
- Edge cases to cover: [specific scenarios]
- What NOT to test: [things that are already covered]

### Research findings
[Best practices for this specific pattern + stack.
Known issues with current library versions.
Alternative approaches considered and why the chosen one is preferred.]

### Constraints
- Don't modify: @[protected files]
- Stay compatible with: [APIs, interfaces, contracts]
- Version notes: [deprecation warnings from research]
```

### For direct task execution:

When the task doesn't need brainstorming (small, well-defined), structure it so the planning and TDD phases have everything they need:

```
## Task: [Name]

[Clear description — what to do]

Files to modify: @[list]
Follow pattern: @[reference]
Test file: @[where tests should go, following @reference-test pattern]

Test first:
- RED: [what the failing test should assert]
- GREEN: [minimal implementation to pass]
- REFACTOR: [any cleanup needed]

Constraints: [what not to touch]
Verify: [command to run]
```

---

## 5. Detecting which plugin is active

Check for these signals in the user's project:

**GSD indicators:**
- `.planning/` directory exists
- `.claude/commands/gsd/` directory with slash command files
- User mentions "gsd", "/gsd:", "planning directory", or "roadmap"
- `SUMMARY.md` or `PROJECT.md` in `.planning/`

**Superpowers indicators:**
- Skills directory with superpowers skills (e.g., `brainstorming/`, `test-driven-development/`)
- `.claude-plugin/` with superpowers plugin.json
- User mentions "superpowers", "brainstorm", "/superpowers:", "TDD workflow"
- Agents directory with code-reviewer or similar

**Both could be installed.** If both are detected, ask the user which workflow they want to use for this task, or offer both formatted outputs.

**Neither detected.** Default to the standard task-type-specific prompt from `references/task-type-blueprints.md`.

---

## 6. Output format comparison

Here's how the same feature request looks across all three output modes:

**Raw input:** "add stripe payments"

### Standard Claude Code prompt:
```
Before starting, read @CLAUDE.md...

## Context
Express 4.18 app with Prisma 5.x, PostgreSQL. Existing user auth via JWT in @src/middleware/auth.ts.

## Task
Add Stripe Checkout integration for one-time payments...
[full task-type blueprint structure]
```

### GSD-optimized:
```
## Feature: Stripe Checkout Integration

### What I'm building
One-time payment flow using Stripe Checkout for the existing Express/Prisma app...

### Technical environment
- Framework: Express 4.18
- Database: PostgreSQL + Prisma 5.x
- Auth: JWT middleware in @src/middleware/auth.ts
[... grounded context, scope, success criteria, research findings]
```

### Superpowers-optimized:
```
## Feature: Stripe Checkout Integration

### Intent
Add one-time payment capability so users can purchase premium features...

### Design considerations
**Security:** Webhook signature verification critical — use Stripe's built-in
verification. Raw body parsing needed for webhook endpoint...
**Architecture:** Follow existing service pattern in @src/services/order-service.ts...
[... design considerations, testing strategy, research findings]
```

The content is the same — the structure is adapted to what each system's intake phase expects.
