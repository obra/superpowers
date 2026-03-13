# Design Principles & Write-Spec Skills

Two new skills that reduce interactive brainstorming overhead by surfacing cross-cutting decisions upfront and enabling autonomous spec generation.

## Problem

The current brainstorming skill is fully interactive — every design decision requires user input. When a user has a PRD with many stories, they repeat similar decisions across stories (auth strategy, error handling, data modeling patterns). This is tedious and slows down spec generation.

## Solution

Two new skills:

1. **`identify-design-principles`** — Simulates brainstorming across all stories, clusters decision points into themes, and asks the user high-level questions that produce a `design-principles.md` file.
2. **`write-spec`** — Like brainstorming but design-principles-aware. Runs autonomously by consulting design-principles for decisions, only escalating to the user when necessary.

## Skill 1: `identify-design-principles`

### Overall Flow

Three phases orchestrated by the skill:

**Phase 1 — Discovery & Dependency Analysis**
- Scan `docs/` for PRD and roadmap files; check for GitHub issues referenced in those files or labeled with a project-specific label (e.g., `roadmap`, `story`)
- Infer inputs from project structure; confirm with user ("I found PRD at `docs/prd.md` and 8 stories in `docs/roadmap.md`. I also see issues #12, #15, #20 referenced in the roadmap — correct?")
- User can correct or add additional inputs (GitHub issues, local files)
- Dispatch **dependency-analyzer** subagent (sonnet) that reads all stories + PRD, produces a dependency graph and ordered processing sequence

**Phase 2 — Brainstorm Simulation**
- Dispatch **brainstorm-simulator** subagent (opus) that processes stories in dependency order
- For each story, it role-plays the brainstorming skill: what questions would it ask? What decisions need to be made?
- Always takes the recommended approach to continue exploration
- When the answer is "both" or "all of the above," selects those to cover maximum decision surface
- Accumulates a **questions ledger** — structured list of every question, the assumed answer, and which story triggered it
- Context from earlier stories (including assumed answers) feeds into later ones
- **Context management for large story sets**: if the story count exceeds 15, the simulator summarizes accumulated context from earlier stories rather than carrying the full ledger forward. The summary retains: all assumed decisions (question + answer pairs), dependency relationships, and key constraints. It drops: the detailed "why it matters" rationale and per-question confidence annotations from already-processed stories

**Phase 3 — Theme Extraction & User Session**
- Dispatch **theme-extractor** subagent (opus) that clusters the questions ledger into design-principle themes
- Present themes to the user as brainstorming-style questions (one at a time, multiple choice preferred)
- When saving a new principle, check existing principles' Assumptions sections for impacts
- Flag contradictions and recommend adjustments; user confirms or modifies
- Write confirmed answers to `docs/superpowers/design-principles.md`
- Commit the file

### Subagent Design

**Dependency-Analyzer (sonnet)**
- Input: All story definitions (from roadmap file, local files, or GitHub issues) + PRD
- Output: Ordered list of stories with dependency annotations, structured as:
  ```
  stories:
    - id: "login-flow"
      source: "docs/roadmap.md#login-flow" | "github:#12" | "stories/login.md"
      depends_on: []
      order: 1
    - id: "api-auth"
      source: "github:#15"
      depends_on: ["login-flow"]
      order: 2
  ```
- Read-only — never modifies files

**Brainstorm-Simulator (opus)**
- Input: Ordered stories, PRD, and a running questions ledger (starts empty)
- Mindset: "I'm about to brainstorm this story with a user. What questions would I need answered before I could produce a spec?"
- For each story, captures:
  - Question text
  - Why it matters (what it unblocks)
  - Which story triggered it
  - Assumed answer (recommended approach, or broadest option if no clear recommendation)
  - Confidence level: `clear-recommendation` vs `no-clear-recommendation`
- Carries forward: assumed answers from earlier stories become context for later ones
- Read-only — produces the ledger as structured output, never writes files

**Theme-Extractor (opus)**
- Input: The complete questions ledger
- Output: Grouped themes, each with:
  - Theme name (e.g., "Authentication Strategy", "Error Handling Philosophy")
  - The clustered questions that form this theme
  - A proposed multiple-choice question for the user
  - A recommended answer
- Clustering criteria: questions that share a domain concern, where answering one informs the others
- Read-only

### Input Formats Supported

Stories can come from any of:
- **GitHub issues** — referenced by number (e.g., #12, #15)
- **Sections in a roadmap markdown file** — parsed from headings/structure
- **Standalone local files** — one file per story
- **A mix of all three**

The skill infers inputs by scanning `docs/` and the project structure, then confirms with the user before proceeding.

## Skill 2: `write-spec`

### Overall Flow

1. **Setup** — Read the story definition (from any of the 3 formats), load `docs/superpowers/design-principles.md` and PRD
2. **Autonomous brainstorming** — Work through the same stages as the existing brainstorming skill (purpose/constraints, success criteria, scope boundaries, architecture, components, data flow, error handling, testing), consulting design-principles for every decision point
3. **Decision handling** — three modes depending on context:
   - **Covered by design-principles**: use it, no question asked
   - **Not covered, clear recommendation exists**: in default mode, ask user and upon confirmation write the new principle to design-principles + check assumption impacts; in autopilot mode, take recommended approach and mark as `[inferred]` in spec (do NOT update design-principles since there is no human confirmation)
   - **Not covered, no clear recommendation**: always ask the user, regardless of mode
4. **Output** — produces spec file at `docs/superpowers/specs/YYYY-MM-DD-<story>-design.md`
5. **Spec review loop** — reuses the existing `spec-document-reviewer` subagent from the brainstorming skill (same prompt template at `skills/brainstorming/spec-document-reviewer-prompt.md`, same input: spec file path, same output: status + issues + recommendations). One addition to the reviewer's context: the path to `design-principles.md` is included, and the reviewer checks that spec decisions don't contradict established principles. Iterate until approved (max 5 rounds, then escalate to user)
6. **User reviews spec** — user reviews the written spec, `[inferred]` decisions are visible for scrutiny

### Autopilot Activation

At any point when the skill asks a question, the user can activate autopilot by expressing intent to let the skill decide (e.g., "autopilot for the rest", "just pick the recommended", "go autonomous"). This is detected by intent, not literal phrase match. The skill confirms: "Switching to autopilot — I'll take recommended approaches and mark them as [inferred]. I'll still ask if there's no clear recommendation. OK?" Upon confirmation, the skill switches mode for the remainder of that session:
- Takes recommended approach for all subsequent decisions
- Marks these as `[inferred]` in the spec
- Does NOT update design-principles (no human confirmation)
- Exception: still asks the user when there is no clear recommendation

### Invocation

One story at a time. The user invokes `write-spec` per story. The skill works through that single story and produces one spec file.

### Context

The skill receives:
- Story definition
- PRD
- `design-principles.md`
- Any existing specs for dependent stories (if they exist)

### Graceful Degradation

`write-spec` works without `identify-design-principles` having been run — it just asks more questions, degrading gracefully to something closer to current brainstorming. It also works with a manually written `design-principles.md`.

## `design-principles.md` File Format

Location: `docs/superpowers/design-principles.md`

```markdown
# Design Principles

> Generated by identify-design-principles on YYYY-MM-DD
> Source: docs/prd.md, docs/roadmap.md

## Authentication Strategy

**Decision:** JWT with refresh tokens, stateless validation at the edge.

**Context:** Stories #3 (login flow), #7 (API auth), #12 (session management) all require auth decisions.

**Assumptions:**
- API gateway supports JWT validation natively
- Token expiry of 15min is acceptable for the UX
- A deny-list service is acceptable overhead for revocation

**Implications:**
- Token refresh logic needed in every client
- No server-side session revocation without a deny-list
- Edge validation means no DB round-trip per request
```

Each principle has:
- **Decision** — the what
- **Context** — which stories drove it, why
- **Assumptions** — what must hold true for this decision to be valid
- **Implications** — what it means for implementation

### `[inferred]` Marker in Spec Output

When `write-spec` runs in autopilot mode and takes a recommended approach without user confirmation, it marks the decision inline in the spec with an `[inferred]` tag:

```markdown
**Database:** PostgreSQL with row-level security [inferred]
```

The tag appears at the end of any decision line that was not confirmed by a human. This allows reviewers to quickly scan for autonomous decisions during the per-spec review step. The `[inferred]` tag follows the same convention used by the refine-specs and refine-plans skills.

### Assumption Impact Detection

When saving a new design principle, the skill:
1. Checks all existing principles' Assumptions sections
2. If the new decision contradicts or invalidates an assumption, flags it to the user
3. Recommends how to adjust the affected assumption
4. User confirms or modifies
5. Updated principles are saved together

## How the Two Skills Connect

```
PRD + Roadmap + Stories
        |
        v
identify-design-principles
        |
        |-- Phase 1: Discover inputs, analyze dependencies (sonnet)
        |-- Phase 2: Simulate brainstorming across all stories (opus)
        |-- Phase 3: Extract themes, ask user questions (opus)
        |
        v
docs/superpowers/design-principles.md
        |
        v
write-spec (invoked per story)
        |
        |-- Consults design-principles for decisions
        |-- Asks user only when necessary
        |-- User can enable autopilot mid-session
        |-- Updates design-principles when user answers (non-autopilot)
        |
        v
docs/superpowers/specs/YYYY-MM-DD-<story>-design.md
        |
        v
writing-plans (existing skill, next step)
```

**Independence:** Neither skill requires the other. `identify-design-principles` produces a useful artifact on its own. `write-spec` degrades gracefully without it. But they're designed to work together for maximum autonomy.

## Error Handling

**Dependency-analyzer produces a cycle:** Report the cycle to the user with the involved stories. Ask the user to clarify which dependency to drop, then re-run the analyzer.

**Brainstorm-simulator hits context limits mid-run:** Save the questions ledger collected so far. Report to the user which stories were processed and which remain. The user can re-invoke with the remaining stories, and the existing ledger is loaded as starting context.

**GitHub issue fetch fails:** Skip the issue, log a warning, continue with available stories. Report skipped issues to the user during the confirmation step so they can provide the content manually.

**Theme-extractor produces overlapping themes:** The skill presents the overlapping themes to the user and asks which grouping makes more sense, or whether to merge them.

**Spec-document-reviewer loop exceeds 5 rounds:** Escalate to the user with the remaining issues, same as the existing brainstorming skill behavior.

## What This Drops

- Batch processing in `write-spec` — one story at a time, composable externally
- Consolidated `[inferred]` review — per-spec review is sufficient
- Parallel story simulation — dependency ordering makes sequential processing the right choice
