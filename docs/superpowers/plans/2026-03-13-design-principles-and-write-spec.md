# Design Principles & Write-Spec Skills Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two new skills — `identify-design-principles` and `write-spec` — that reduce interactive brainstorming overhead by surfacing cross-cutting design decisions upfront and enabling autonomous spec generation with design-principles awareness.

**Architecture:** Two independent skill directories under `skills/`, each with a `SKILL.md` orchestrator and supporting prompt templates. `identify-design-principles` uses three subagents (dependency-analyzer, brainstorm-simulator, theme-extractor) in a three-phase pipeline. `write-spec` reuses the existing `spec-document-reviewer-prompt.md` from brainstorming and adds its own orchestration logic. Both skills produce/consume `docs/superpowers/design-principles.md` as the shared artifact.

**Tech Stack:** Claude Code Agent tool (subagent dispatch), Bash (git operations), GitHub MCP tools (issue fetching), TaskCreate/TaskUpdate for checklist tracking

---

## File Structure

```
skills/identify-design-principles/
├── SKILL.md                           → Orchestrator: 3-phase pipeline (discover, simulate, extract)
├── dependency-analyzer-prompt.md      → Subagent: read stories + PRD, produce dependency graph
├── brainstorm-simulator-prompt.md     → Subagent: simulate brainstorming per story, build questions ledger
└── theme-extractor-prompt.md          → Subagent: cluster questions into design-principle themes

skills/write-spec/
└── SKILL.md                           → Orchestrator: autonomous brainstorming with design-principles lookup
```

No existing files are modified. The `write-spec` skill reuses `skills/brainstorming/spec-document-reviewer-prompt.md` by reference (not copy).

---

## Chunk 1: identify-design-principles Prompt Templates (Tasks 1-3)

### Task 1: Create `skills/identify-design-principles/dependency-analyzer-prompt.md`

**Files:**
- Create: `skills/identify-design-principles/dependency-analyzer-prompt.md`

**Reference:** `skills/refining-specs/spec-simulator-prompt.md` for template format conventions

- [ ] **Step 1: Create the prompt template file**

```markdown
# Dependency-Analyzer Subagent Prompt Template

Use this template when dispatching the dependency-analyzer subagent to produce a dependency graph and ordered processing sequence for stories.

` ` `text
Task tool (general-purpose):
  description: "Analyze story dependencies"
  prompt: |
    You are analyzing story dependencies to determine processing order for brainstorm simulation.

    ## PRD Content

    {prd_content}

    ## Stories

    {stories}

    ## Your Job

    1. Read all story definitions and the PRD
    2. For each story, identify:
       - What it depends on (other stories that must be understood first)
       - What it enables (other stories that depend on it)
    3. Produce a topological ordering — stories with no dependencies first
    4. If you detect a cycle, report it clearly

    ## Dependency Detection Rules

    - A story depends on another if it references concepts, APIs, data models, or flows defined by that other story
    - Shared infrastructure (auth, database) creates implicit dependencies — stories that define infrastructure come before stories that consume it
    - If two stories are truly independent (no shared concepts), they have no dependency relationship
    - When in doubt about a dependency, include it — false positives are less harmful than false negatives for ordering

    ## Report Format

    DEPENDENCY_ANALYSIS:
      status: success | cycle_detected
      cycle_details: "[description of cycle, if any]"
      stories:
        - id: "[story identifier]"
          source: "[file path or github issue reference]"
          title: "[brief story title]"
          depends_on: ["[list of story ids this depends on]"]
          order: [processing order number, 1-based]
          reasoning: "[brief explanation of dependency placement]"

    ## Rules

    - Read-only — never modify any files
    - If a story references a GitHub issue, use the issue title and body as the story content
    - If story content is ambiguous, note it in the reasoning field
    - Order must be deterministic — when two stories have equal priority, order alphabetically by id
` ` `
```

Note: Replace `` ` ` ` `` with actual triple backticks.

- [ ] **Step 2: Verify file exists and has correct structure**

Run: `head -5 skills/identify-design-principles/dependency-analyzer-prompt.md`
Expected: Shows `# Dependency-Analyzer Subagent Prompt Template`

- [ ] **Step 3: Commit**

```bash
git add skills/identify-design-principles/dependency-analyzer-prompt.md
git commit -m "feat(identify-design-principles): add dependency analyzer prompt template"
```

---

### Task 2: Create `skills/identify-design-principles/brainstorm-simulator-prompt.md`

**Files:**
- Create: `skills/identify-design-principles/brainstorm-simulator-prompt.md`

- [ ] **Step 1: Create the prompt template file**

```markdown
# Brainstorm-Simulator Subagent Prompt Template

Use this template when dispatching the brainstorm-simulator subagent to simulate brainstorming for a single story and build the questions ledger.

**Dispatch:** One dispatch per story in dependency order. The orchestrator carries the questions ledger between dispatches.

` ` `text
Task tool (general-purpose):
  description: "Simulate brainstorming: {story_id}"
  prompt: |
    You are simulating a brainstorming session for a single story to discover what design decisions it requires.

    ## PRD Content

    {prd_content}

    ## Current Story

    {story_content}

    ## Story Context

    Story ID: {story_id}
    Story Source: {story_source}
    Dependency Order: {story_order} of {total_stories}
    Dependencies: {story_dependencies}

    ## Questions Ledger (from previous stories)

    {questions_ledger}

    ## Simulation Mindset

    You are about to brainstorm this story with a user. Role-play the brainstorming
    skill: what questions would you ask? What decisions need to be made before you
    could produce a spec?

    For each question you would ask:
    1. Always take the recommended approach to continue exploration
    2. When the answer is "both" or "all of the above," select those to cover maximum decision surface
    3. Use assumed answers from earlier stories (in the ledger) as established context

    ## Question Discovery Rules

    Walk through each brainstorming stage for this story:
    - Purpose and constraints
    - Success criteria
    - Scope boundaries
    - Architecture decisions
    - Component design
    - Data flow
    - Error handling
    - Testing strategy

    For each stage, ask: "What would I need the user to decide?"

    ## Output Format

    Return the UPDATED questions ledger (previous entries + new entries for this story).

    Each entry follows this schema:
    - question: "[the question text]"
      why_it_matters: "[what this decision unblocks]"
      story_id: "{story_id}"
      assumed_answer: "[recommended approach, or broadest option if no clear recommendation]"
      confidence: "clear-recommendation" | "no-clear-recommendation"

    QUESTIONS_LEDGER:
      - question: "[question text]"
        why_it_matters: "[what it unblocks]"
        story_id: "[which story triggered this]"
        assumed_answer: "[the assumed answer]"
        confidence: "clear-recommendation" | "no-clear-recommendation"

    ## Rules

    - Read-only — never modify any files
    - Carry forward ALL previous ledger entries unchanged — only ADD new entries for the current story
    - Do not duplicate questions already in the ledger — if a previous story covered the same decision, skip it
    - If a previous assumed answer informs this story's decisions, reference it rather than re-asking
    - If you would ask the same question but the context differs enough to warrant a different answer, add a new entry noting the distinction
` ` `

**Context management for large story sets (>15 stories):**

When the orchestrator detects that the story count exceeds 15, it summarizes the accumulated ledger before passing it to the simulator. The summary retains:
- All assumed decisions (question + answer pairs)
- Dependency relationships
- Key constraints

It drops:
- Detailed "why it matters" rationale from already-processed stories
- Per-question confidence annotations from already-processed stories

The orchestrator performs this summarization, not the simulator subagent.
```

Note: Replace `` ` ` ` `` with actual triple backticks.

- [ ] **Step 2: Verify file exists**

Run: `head -5 skills/identify-design-principles/brainstorm-simulator-prompt.md`
Expected: Shows `# Brainstorm-Simulator Subagent Prompt Template`

- [ ] **Step 3: Commit**

```bash
git add skills/identify-design-principles/brainstorm-simulator-prompt.md
git commit -m "feat(identify-design-principles): add brainstorm simulator prompt template"
```

---

### Task 3: Create `skills/identify-design-principles/theme-extractor-prompt.md`

**Files:**
- Create: `skills/identify-design-principles/theme-extractor-prompt.md`

- [ ] **Step 1: Create the prompt template file**

```markdown
# Theme-Extractor Subagent Prompt Template

Use this template when dispatching the theme-extractor subagent to cluster the questions ledger into design-principle themes.

` ` `text
Task tool (general-purpose):
  description: "Extract design-principle themes"
  prompt: |
    You are clustering a questions ledger into design-principle themes for user confirmation.

    ## Questions Ledger

    {questions_ledger}

    ## Your Job

    1. Read all questions in the ledger
    2. Cluster questions that share a domain concern — where answering one question informs the others
    3. For each cluster, create a theme
    4. For each theme, compose a multiple-choice question for the user
    5. Order themes by impact — themes that affect the most stories first

    ## Clustering Criteria

    Group questions when they:
    - Address the same domain concern (e.g., all auth-related questions form "Authentication Strategy")
    - Share a decision axis (e.g., "stateful vs stateless" applies to sessions, caching, and connection management)
    - Would naturally be answered together in conversation

    Do NOT group questions just because they came from the same story. Cross-story clustering is the point.

    ## Theme Quality Rules

    - Each theme should contain 2+ questions (single-question themes are under-clustered)
    - No question should appear in multiple themes (no overlap)
    - If a question doesn't fit any theme, create a "Miscellaneous Decisions" theme
    - Theme names should be descriptive and domain-specific (not "Theme 1", "Group A")

    ## Report Format

    THEMES:
      - theme_name: "[descriptive name, e.g., Authentication Strategy]"
        questions: ["[list of question texts from ledger that form this theme]"]
        stories_affected: ["[list of story_ids whose questions appear in this theme]"]
        proposed_question: "[a multiple-choice question that captures the theme's core decision]"
        options:
          - label: "A"
            text: "[option text]"
            rationale: "[why this is a valid choice]"
          - label: "B"
            text: "[option text]"
            rationale: "[why this is a valid choice]"
          - label: "C"
            text: "[option text, if applicable]"
            rationale: "[why this is a valid choice]"
        recommended: "[label of recommended option]"
        recommendation_reasoning: "[why this option is recommended]"

    ## Rules

    - Read-only — never modify any files
    - Every question in the ledger must appear in exactly one theme
    - If two themes overlap significantly (>50% shared questions), merge them
    - The proposed question must be answerable without reading the individual ledger entries
    - Options should represent genuinely different approaches, not minor variations
` ` `
```

Note: Replace `` ` ` ` `` with actual triple backticks.

- [ ] **Step 2: Verify file exists**

Run: `head -5 skills/identify-design-principles/theme-extractor-prompt.md`
Expected: Shows `# Theme-Extractor Subagent Prompt Template`

- [ ] **Step 3: Commit**

```bash
git add skills/identify-design-principles/theme-extractor-prompt.md
git commit -m "feat(identify-design-principles): add theme extractor prompt template"
```

---

## Chunk 2: identify-design-principles SKILL.md (Task 4)

### Task 4: Create `skills/identify-design-principles/SKILL.md`

**Files:**
- Create: `skills/identify-design-principles/SKILL.md`

**Reference:** `skills/brainstorming/SKILL.md` and `skills/refining-specs/SKILL.md` for structure, flowcharts, and orchestration patterns

- [ ] **Step 1: Create the SKILL.md file**

```markdown
---
name: identify-design-principles
description: Use when starting a multi-story project and you want to surface cross-cutting design decisions upfront before writing individual specs. Requires a PRD or roadmap with multiple stories.
---

# Identify Design Principles

Surface cross-cutting design decisions across all stories in a project before writing individual specs. Produces a `design-principles.md` file that `write-spec` consumes for autonomous spec generation.

**Core principle:** Ask high-level questions once, apply answers across all stories — don't repeat the same decisions per story.

**Announce at start:** "I'm using the identify-design-principles skill to surface cross-cutting design decisions."

**Harness requirement:** This skill dispatches dependency-analyzer, brainstorm-simulator, and theme-extractor subagents. It requires a platform with subagent support (such as Claude Code or Codex). If subagents are not available, notify the user and stop.

## When to Use

- Starting a multi-story project (PRD + roadmap with 3+ stories)
- Want to reduce repeated decision-making during per-story spec writing
- Have stories across GitHub issues, roadmap files, or standalone files

## When NOT to Use

- Single-story project — just use brainstorming or write-spec directly
- No written stories exist — help the user write them first
- Already have a design-principles.md — use write-spec directly

## The Process

You MUST create a task for each phase step and complete in order.

` ` `dot
digraph identify_design_principles {
    rankdir=TB;

    "Phase 1: Discover inputs" [shape=box];
    "Saved ledger exists?" [shape=diamond];
    "Offer to load saved ledger" [shape=box];
    "Confirm inputs with user" [shape=diamond];
    "Dispatch dependency-analyzer" [shape=box];
    "Cycle detected?" [shape=diamond];
    "User resolves cycle" [shape=box];
    "Phase 2: Simulate brainstorming" [shape=box];
    "For each story in order:\nDispatch brainstorm-simulator" [shape=box];
    ">15 stories?" [shape=diamond];
    "Summarize ledger before next dispatch" [shape=box];
    "Context limit failure?" [shape=diamond];
    "Retry with summarized ledger" [shape=box];
    "Retry also fails?" [shape=diamond];
    "Skip story, report to user" [shape=box];
    "Phase 3: Extract themes" [shape=box];
    "Dispatch theme-extractor" [shape=box];
    "Overlapping themes?" [shape=diamond];
    "User picks grouping" [shape=box];
    "Present themes one at a time" [shape=box];
    "User confirms/modifies" [shape=diamond];
    "Write principle to design-principles.md" [shape=box];
    "Run assumption impact check" [shape=box];
    "Contradiction found?" [shape=diamond];
    "Flag contradiction, user confirms adjustment" [shape=box];
    "More themes?" [shape=diamond];
    "Commit design-principles.md" [shape=box style=filled fillcolor=lightgreen];

    "Phase 1: Discover inputs" -> "Saved ledger exists?";
    "Saved ledger exists?" -> "Offer to load saved ledger" [label="yes"];
    "Offer to load saved ledger" -> "Confirm inputs with user";
    "Saved ledger exists?" -> "Confirm inputs with user" [label="no"];
    "Confirm inputs with user" -> "Dispatch dependency-analyzer" [label="confirmed"];
    "Dispatch dependency-analyzer" -> "Cycle detected?";
    "Cycle detected?" -> "User resolves cycle" [label="yes"];
    "User resolves cycle" -> "Dispatch dependency-analyzer";
    "Cycle detected?" -> "Phase 2: Simulate brainstorming" [label="no"];
    "Phase 2: Simulate brainstorming" -> ">15 stories?";
    ">15 stories?" -> "Summarize ledger before next dispatch" [label="yes"];
    "Summarize ledger before next dispatch" -> "For each story in order:\nDispatch brainstorm-simulator";
    ">15 stories?" -> "For each story in order:\nDispatch brainstorm-simulator" [label="no"];
    "For each story in order:\nDispatch brainstorm-simulator" -> "Context limit failure?";
    "Context limit failure?" -> "Retry with summarized ledger" [label="yes"];
    "Retry with summarized ledger" -> "Retry also fails?";
    "Retry also fails?" -> "Skip story, report to user" [label="yes"];
    "Retry also fails?" -> "For each story in order:\nDispatch brainstorm-simulator" [label="no, continue"];
    "Context limit failure?" -> "Phase 3: Extract themes" [label="no, all done"];
    "Skip story, report to user" -> "Phase 3: Extract themes";
    "Phase 3: Extract themes" -> "Dispatch theme-extractor";
    "Dispatch theme-extractor" -> "Overlapping themes?";
    "Overlapping themes?" -> "User picks grouping" [label="yes"];
    "User picks grouping" -> "Present themes one at a time";
    "Overlapping themes?" -> "Present themes one at a time" [label="no"];
    "Present themes one at a time" -> "User confirms/modifies";
    "User confirms/modifies" -> "Write principle to design-principles.md";
    "Write principle to design-principles.md" -> "Run assumption impact check";
    "Run assumption impact check" -> "Contradiction found?";
    "Contradiction found?" -> "Flag contradiction, user confirms adjustment" [label="yes"];
    "Flag contradiction, user confirms adjustment" -> "More themes?";
    "Contradiction found?" -> "More themes?" [label="no"];
    "More themes?" -> "Present themes one at a time" [label="yes"];
    "More themes?" -> "Commit design-principles.md" [label="no"];
}
` ` `

### Phase 1: Discovery & Dependency Analysis

1. Check for saved ledger at `docs/superpowers/.design-principles-ledger.json`. If found, offer to load: "I found a saved questions ledger from a previous run ({N} questions, {M} stories processed). Load it and continue with remaining stories?"
2. Scan `docs/` for PRD and roadmap files
3. Check for GitHub issues explicitly referenced in those files (e.g., `#12`, `#15`)
4. For label-based discovery, ask the user whether to also search for issues with a specific label rather than guessing
5. Confirm findings with user: "I found PRD at `docs/prd.md` and 8 stories in `docs/roadmap.md`. I also see issues #12, #15, #20 referenced in the roadmap — correct?"
6. User can correct or add additional inputs
7. Dispatch **dependency-analyzer** subagent with all story content + PRD:

` ` `
Agent tool:
  subagent_type: "general-purpose"
  prompt: [use dependency-analyzer-prompt.md template, inject {prd_content}, {stories}]
` ` `

> **Note:** The dependency-analyzer is designed for a lighter-weight model (sonnet-class) and the brainstorm-simulator and theme-extractor are designed for a heavier model (opus-class), but model selection depends on platform capabilities. The Agent/Task tool does not currently support a `model` parameter.

8. If cycle detected: report cycle to user, ask which dependency to drop, re-dispatch analyzer

### Phase 2: Brainstorm Simulation

Dispatch **brainstorm-simulator** subagent iteratively — one dispatch per story in dependency order.

` ` `
For each story in dependency order:
  Agent tool:
    subagent_type: "general-purpose"
    prompt: [use brainstorm-simulator-prompt.md template, inject:
      {prd_content}, {story_content}, {story_id}, {story_source},
      {story_order}, {total_stories}, {story_dependencies},
      {questions_ledger}  ← output from previous dispatch (empty for first story)
    ]
` ` `

The orchestrator carries the questions ledger between dispatches. Each simulator dispatch receives the current ledger and returns an updated ledger.

**Context management for >15 stories:** If story count exceeds 15, summarize the accumulated ledger before passing to the next simulator dispatch. The summary retains: all assumed decisions (question + answer pairs), dependency relationships, and key constraints. It drops: detailed "why it matters" rationale and per-question confidence annotations from already-processed stories.

**Context-limit failure handling:** On a per-story context-limit failure:
1. Retry that single story with a summarized ledger (same summarization strategy as >15 threshold)
2. If retry also fails, skip that story and report it to the user
3. After a context-limit failure triggers summarization, continue using summarized form for all subsequent dispatches (permanent activation)
4. Save the questions ledger collected so far to `docs/superpowers/.design-principles-ledger.json`
5. Report to user which stories were processed and which remain
6. User can re-invoke the skill with remaining stories; on startup, Phase 1 checks for a saved ledger and offers to load it as starting context

**Ledger save/reload:** The orchestrator saves the questions ledger to `docs/superpowers/.design-principles-ledger.json` on context-limit failure. On skill startup (Phase 1), check if this file exists. If it does, offer to the user: "I found a saved questions ledger from a previous run ({N} questions, {M} stories processed). Load it and continue with remaining stories?" On user confirmation, load the ledger and skip already-processed stories. After successful completion of all phases, delete the saved ledger file. The ledger file is intermediate state — add `docs/superpowers/.design-principles-ledger.json` to `.gitignore` if not already present.

### Phase 3: Theme Extraction & User Session

1. Dispatch **theme-extractor** subagent with the complete questions ledger:

` ` `
Agent tool:
  subagent_type: "general-purpose"
  prompt: [use theme-extractor-prompt.md template, inject {questions_ledger}]
` ` `

2. If overlapping themes detected: present to user, ask which grouping or whether to merge
3. Present themes to user one at a time as multiple-choice questions
4. After each user confirmation:
   a. Write that principle to `docs/superpowers/design-principles.md`
   b. Run assumption impact check against existing principles
   c. If contradiction found: flag it, recommend adjustment, user confirms
   d. Impact check is single-pass: if an existing principle is adjusted, re-run impact check on that adjusted principle only (one level of cascade, not recursive)
5. Commit the file after all themes are confirmed

### Assumption Impact Check

When saving a new design principle:
1. Check all existing principles' Assumptions sections
2. If the new decision contradicts or invalidates an assumption, flag it to the user
3. Recommend how to adjust the affected assumption
4. User confirms or modifies
5. If an existing principle was adjusted, re-run impact check on that adjusted principle only (single-pass, one level of cascade)
6. Updated principles are saved together

### design-principles.md File Format

Location: `docs/superpowers/design-principles.md`

` ` `markdown
# Design Principles

> Generated by identify-design-principles on YYYY-MM-DD
> Source: docs/prd.md, docs/roadmap.md

## [Theme Name]

**Decision:** [the what]

**Context:** [which stories drove it, why]

**Assumptions:**
- [what must hold true for this decision to be valid]

**Implications:**
- [what it means for implementation]
` ` `

### Input Formats Supported

Stories can come from:
- **GitHub issues** — referenced by number (e.g., #12, #15), fetched via GitHub MCP tools
- **Sections in a roadmap markdown file** — parsed from headings/structure
- **Standalone local files** — one file per story
- **A mix of all three**

## Error Handling

| Error | Response |
|-------|----------|
| Dependency cycle detected | Report cycle, ask user which dependency to drop, re-run analyzer |
| Brainstorm-simulator context limit (per-story) | Retry with summarized ledger; if retry fails, skip story and report |
| GitHub issue fetch fails | Skip issue, log warning, report during confirmation step |
| Theme-extractor produces overlapping themes | Present overlaps to user, ask which grouping or whether to merge |

## Red Flags

**Never:**
- Skip the dependency analysis phase
- Let brainstorm-simulator modify any files (read-only)
- Proceed to Phase 3 without confirming inputs with user
- Write to design-principles.md without user confirmation per theme
- Skip the assumption impact check after writing a principle
- Run recursive impact checks (single-pass with one cascade level only)

## Remember

- One question at a time during Phase 3 — don't overwhelm the user
- The questions ledger schema is the contract between simulator and extractor
- Context-limit failure permanently activates summarization mode
- Impact check is single-pass: one level of cascade, not recursive
- The orchestrator carries state between subagent dispatches — subagents are stateless
- Save ledger to `docs/superpowers/.design-principles-ledger.json` on context-limit failure; check for saved ledger on startup; delete after successful completion
```

Note: Replace `` ` ` ` `` with actual triple backticks throughout.

- [ ] **Step 2: Verify file structure**

Run: `head -10 skills/identify-design-principles/SKILL.md`
Expected: Shows YAML frontmatter with `name: identify-design-principles`

- [ ] **Step 3: Verify word count is reasonable**

Run: `wc -w skills/identify-design-principles/SKILL.md`
Expected: Under 2000 words (this is a complex orchestration skill, higher word count acceptable)

- [ ] **Step 4: Commit**

```bash
git add skills/identify-design-principles/SKILL.md
git commit -m "feat(identify-design-principles): add SKILL.md orchestrator"
```

---

## Chunk 3: write-spec SKILL.md (Task 5)

### Task 5: Create `skills/write-spec/SKILL.md`

**Files:**
- Create: `skills/write-spec/SKILL.md`

**Reference:** `skills/brainstorming/SKILL.md` for brainstorming stages, `skills/brainstorming/spec-document-reviewer-prompt.md` for review loop pattern

- [ ] **Step 1: Create the SKILL.md file**

```markdown
---
name: write-spec
description: Use when you have a story to spec and design-principles exist (or can be created on the fly). Runs brainstorming autonomously, consulting design-principles for decisions, only escalating when necessary.
---

# Write Spec

Autonomous spec generation for a single story, guided by design-principles. Like brainstorming but design-principles-aware — consults established decisions instead of asking the user, only escalating when necessary.

**Core principle:** Consult design-principles first, ask the user only when you must.

**Announce at start:** "I'm using the write-spec skill to generate a spec for this story."

## When to Use

- Have a story definition (GitHub issue, file, or roadmap section)
- Want faster spec generation with fewer interactive questions
- Have design-principles.md from identify-design-principles (optional but recommended)

## When NOT to Use

- No story definition exists — help the user write one first
- Exploring an idea without a defined story — use brainstorming instead
- Need to establish design principles across many stories — use identify-design-principles first

## Graceful Degradation

write-spec works without identify-design-principles having been run. Without design-principles.md, it asks more questions, degrading gracefully to something closer to current brainstorming. It also works with a manually written design-principles.md.

## The Process

You MUST create a task for each phase step and complete in order.

` ` `dot
digraph write_spec {
    rankdir=TB;

    "Setup: load story, PRD, design-principles" [shape=box];
    "Design-principles exist?" [shape=diamond];
    "Note: will ask more questions" [shape=box];
    "Autonomous brainstorming" [shape=box];
    "Decision point" [shape=diamond];
    "Covered by design-principles" [shape=box];
    "Not covered, clear recommendation" [shape=diamond];
    "Autopilot active?" [shape=diamond];
    "Take recommended, mark [inferred]" [shape=box];
    "Ask user, write new principle" [shape=box];
    "Not covered, no clear recommendation" [shape=box];
    "Always ask user" [shape=box];
    "More decisions?" [shape=diamond];
    "Write spec file" [shape=box];
    "Spec review loop\n(spec-document-reviewer)" [shape=box];
    "Review passed?" [shape=diamond];
    "Fix issues, re-dispatch reviewer" [shape=box];
    "Exceeded 5 rounds?" [shape=diamond];
    "Escalate to user" [shape=box];
    "User reviews spec" [shape=box];
    "Offer: refining-specs or writing-plans" [shape=doublecircle];

    "Setup: load story, PRD, design-principles" -> "Design-principles exist?";
    "Design-principles exist?" -> "Autonomous brainstorming" [label="yes"];
    "Design-principles exist?" -> "Note: will ask more questions" [label="no"];
    "Note: will ask more questions" -> "Autonomous brainstorming";
    "Autonomous brainstorming" -> "Decision point";
    "Decision point" -> "Covered by design-principles" [label="covered"];
    "Decision point" -> "Not covered, clear recommendation" [label="not covered"];
    "Decision point" -> "Not covered, no clear recommendation" [label="unclear"];
    "Covered by design-principles" -> "More decisions?";
    "Not covered, clear recommendation" -> "Autopilot active?";
    "Autopilot active?" -> "Take recommended, mark [inferred]" [label="yes"];
    "Autopilot active?" -> "Ask user, write new principle" [label="no"];
    "Take recommended, mark [inferred]" -> "More decisions?";
    "Ask user, write new principle" -> "More decisions?";
    "Not covered, no clear recommendation" -> "Always ask user";
    "Always ask user" -> "More decisions?";
    "More decisions?" -> "Autonomous brainstorming" [label="yes"];
    "More decisions?" -> "Write spec file" [label="no"];
    "Write spec file" -> "Spec review loop\n(spec-document-reviewer)";
    "Spec review loop\n(spec-document-reviewer)" -> "Review passed?";
    "Review passed?" -> "Fix issues, re-dispatch reviewer" [label="no"];
    "Fix issues, re-dispatch reviewer" -> "Exceeded 5 rounds?";
    "Exceeded 5 rounds?" -> "Escalate to user" [label="yes"];
    "Exceeded 5 rounds?" -> "Spec review loop\n(spec-document-reviewer)" [label="no"];
    "Review passed?" -> "User reviews spec" [label="yes"];
    "User reviews spec" -> "Offer: refining-specs or writing-plans" [label="approved"];
    "User reviews spec" -> "Write spec file" [label="changes requested"];
}
` ` `

### Step 1: Setup

1. Accept story definition (GitHub issue number, file path, or roadmap section reference)
2. Load story content from the appropriate source
3. Load PRD (auto-detect from `docs/` or ask user)
4. Load `docs/superpowers/design-principles.md` if it exists
5. Scan `docs/superpowers/specs/` for existing spec files matching `*-design.md`. Load all matching specs as contextual background. The skill does not require or use a dependency graph — it loads whatever specs exist to inform its decisions.
6. If design-principles.md doesn't exist, inform user: "No design-principles found. I'll ask more questions as we go. You can run identify-design-principles first if you prefer to establish cross-cutting decisions upfront."

### Step 2: Autonomous Brainstorming

Work through the same stages as the brainstorming skill:
- Purpose and constraints
- Success criteria
- Scope boundaries
- Architecture decisions
- Component design
- Data flow
- Error handling
- Testing strategy

No subagent is dispatched for this phase — the skill's main agent handles it directly.

At each decision point, follow this logic:

**Decision Handling — Three Modes:**

| Scenario | Default Mode | Autopilot Mode |
|----------|-------------|----------------|
| Covered by design-principles | Use it silently | Use it silently |
| Not covered, clear recommendation exists | Ask user; on confirmation write new principle to design-principles.md + check assumption impacts | Take recommended approach, mark as `[inferred]` in spec. Do NOT update design-principles |
| Not covered, no clear recommendation | Always ask user | Always ask user |

**When writing a new principle (default mode, user-confirmed):**
- Decision: from the user's answer
- Context: the story that triggered it
- Assumptions: inferred from the single-story context
- Implications: inferred from the decision
- Note: these will be less comprehensive than principles from identify-design-principles since they derive from single-story context

### Step 3: Autopilot Mode

At any point when the skill asks a question, the user can activate autopilot by expressing intent (e.g., "autopilot for the rest", "just pick the recommended", "go autonomous"). Detect by intent, not literal phrase match.

**On activation, confirm:** "Switching to autopilot — I'll take recommended approaches and mark them as [inferred]. I'll still ask if there's no clear recommendation. OK?"

Upon confirmation:
- Take recommended approach for all subsequent decisions
- Mark these as `[inferred]` in the spec
- Do NOT update design-principles (no human confirmation)
- Exception: still ask the user when there is no clear recommendation

The user can deactivate autopilot by expressing intent to resume manual control. Confirm the mode switch in both directions.

### Step 4: Output

Write spec file to `docs/superpowers/specs/YYYY-MM-DD-<story>-design.md`

### The `[inferred]` Tag

When autopilot takes a recommended approach, mark the decision inline:

` ` `markdown
**Database:** PostgreSQL with row-level security [inferred]
` ` `

The tag appears at the end of any decision line not confirmed by a human. Same convention as refine-specs and refine-plans skills.

### Step 5: Spec Review Loop

Reuse the existing `spec-document-reviewer` from brainstorming:

` ` `
Agent tool:
  subagent_type: "general-purpose"
  prompt: [use skills/brainstorming/spec-document-reviewer-prompt.md template,
    inject {SPEC_FILE_PATH}]
` ` `

When dispatching the reviewer, insert the design-principles block at the top of the `prompt:` value, before the line "You are a spec document reviewer." The injected block reads: "Also verify that spec decisions do not contradict these design principles: {design_principles_content}". This injects design-principles as additional context in the prompt body itself, not as a template parameter — the existing reviewer template is reused without modification.

Iterate until approved (max 5 rounds, then escalate to user).

### Step 6: User Reviews Spec

> "Spec written and committed to `<path>`. `[inferred]` decisions are highlighted for your scrutiny. Please review and let me know if you want changes before we write the implementation plan."

Wait for user response. If changes requested, make them and re-run spec review loop.

After user approves the spec, offer a choice: "Spec approved. Two options: (1) Refine spec — run refining-specs to pressure-test before planning. (2) Generate plan — invoke writing-plans to create the implementation plan. Which approach?"

### Assumption Impact Check

Same mechanism as identify-design-principles. When saving a new principle in default mode:
1. Check all existing principles' Assumptions sections
2. If new decision contradicts an assumption, flag to user
3. Recommend adjustment, user confirms
4. If adjusted, re-run impact check on adjusted principle only (single-pass, one cascade level)
5. Save updated principles together

## Invocation

One story at a time. The user invokes write-spec per story. The skill works through that single story and produces one spec file.

## Context

The skill receives:
- Story definition
- PRD
- `design-principles.md` (if exists)
- Existing specs for dependent stories (if they exist)

**The terminal state is invoking either refining-specs or writing-plans.** After user approves the spec, offer the choice between pressure-testing via refining-specs or proceeding to writing-plans.

## Red Flags

**Never:**
- Skip consulting design-principles when they exist
- Update design-principles in autopilot mode (no human confirmation = no principle update)
- Mark a decision as `[inferred]` in default mode (user confirmed = not inferred)
- Proceed past the spec review loop without approval
- Skip the user review step
- Run autonomous brainstorming without loading available context first

## Remember

- Consult design-principles first — ask users only when you must
- Autopilot means `[inferred]` tags and no principle updates
- Default mode means ask user and write principle on confirmation
- No clear recommendation = always ask, regardless of mode
- Spec reviewer gets design-principles path for contradiction checking
- The terminal state is invoking either refining-specs or writing-plans — offer the user the choice
```

Note: Replace `` ` ` ` `` with actual triple backticks throughout.

- [ ] **Step 2: Verify file structure**

Run: `head -10 skills/write-spec/SKILL.md`
Expected: Shows YAML frontmatter with `name: write-spec`

- [ ] **Step 3: Verify word count**

Run: `wc -w skills/write-spec/SKILL.md`
Expected: Under 1500 words

- [ ] **Step 4: Commit**

```bash
git add skills/write-spec/SKILL.md
git commit -m "feat(write-spec): add SKILL.md orchestrator"
```

---

## Chunk 4: Final Verification (Task 6)

### Task 6: Verify complete file structure and cross-references

**Files:**
- Verify: all files created in Tasks 1-5

- [ ] **Step 1: Add ledger file to .gitignore**

Run: `grep -q 'design-principles-ledger' .gitignore 2>/dev/null || echo 'docs/superpowers/.design-principles-ledger.json' >> .gitignore`
Then: `git add .gitignore && git commit -m "chore: gitignore design-principles ledger file"`

- [ ] **Step 2: Verify directory structure matches spec**

Run: `find skills/identify-design-principles skills/write-spec -type f | sort`
Expected:
```
skills/identify-design-principles/brainstorm-simulator-prompt.md
skills/identify-design-principles/dependency-analyzer-prompt.md
skills/identify-design-principles/SKILL.md
skills/identify-design-principles/theme-extractor-prompt.md
skills/write-spec/SKILL.md
```

- [ ] **Step 3: Verify all prompt templates have correct structure**

Run: `for f in skills/identify-design-principles/*-prompt.md; do echo "=== $f ==="; head -3 "$f"; echo; done`
Expected: Each file shows `# [Name] Subagent Prompt Template`

- [ ] **Step 4: Verify SKILL.md files have YAML frontmatter**

Run: `for f in skills/identify-design-principles/SKILL.md skills/write-spec/SKILL.md; do echo "=== $f ==="; head -4 "$f"; echo; done`
Expected: Each shows `---`, `name:`, `description:`, `---`

- [ ] **Step 5: Verify write-spec references brainstorming reviewer correctly**

Run: `grep -c "spec-document-reviewer-prompt.md" skills/write-spec/SKILL.md`
Expected: At least 1 match (cross-reference to brainstorming's reviewer)

- [ ] **Step 6: Verify design-principles.md format is documented in both skills**

Run: `grep -l "design-principles.md" skills/identify-design-principles/SKILL.md skills/write-spec/SKILL.md`
Expected: Both files listed

- [ ] **Step 7: Verify [inferred] tag convention is documented**

Run: `grep -c "\[inferred\]" skills/write-spec/SKILL.md`
Expected: At least 3 matches (tag is documented in multiple sections)

- [ ] **Step 8: Final commit with all files**

Only if any uncommitted changes remain:

```bash
git status
# If clean, skip. If uncommitted files exist:
git add skills/identify-design-principles/ skills/write-spec/
git commit -m "feat: add identify-design-principles and write-spec skills"
```
