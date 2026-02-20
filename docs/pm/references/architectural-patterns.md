# Architectural Patterns for Claude Code Workflow Orchestration

> Technical reference for building an SDLC orchestration system using Claude Code plugins, skills, agents, and hooks. Patterns drawn from Superpowers, Compound Engineering, Archon, Anthropic best practices, and Trail of Bits research.

---

## Table of Contents

1. [Orchestration Patterns](#1-orchestration-patterns)
2. [Context Management Patterns](#2-context-management-patterns)
3. [Model Routing Patterns](#3-model-routing-patterns)
4. [Judgment Gate Design Patterns](#4-judgment-gate-design-patterns)
5. [Verification and Quality Patterns](#5-verification-and-quality-patterns)
6. [Plugin Architecture Patterns](#6-plugin-architecture-patterns)
7. [Plugin Composition Patterns](#7-plugin-composition-patterns)
8. [GitHub Actions / CI-CD Patterns](#8-github-actions--ci-cd-patterns)

---

## 1. Orchestration Patterns

### 1.1 Pipeline-as-Slash-Commands

Each SDLC stage is a self-contained slash command. Commands can run standalone or be chained into a full pipeline. This is the primary orchestration pattern for the system.

**Pipeline topology:**

```
/pm-discover --> /brainstorm --> /write-plan --> /execute-plan --> /review --> /compound
     |               |               |                |              |           |
  Stage 0          Stage 1         Stage 2          Stage 3        Stage 4     Stage 5
  (PM)           (Design)       (Planning)         (Build)       (Review)    (Iterate)
```

**Key properties:**

- Each command is independently invocable. A user can run `/write-plan` without having run `/pm-discover` if they already have requirements.
- Commands can invoke each other. Compound Engineering's `/lfg` command chains all stages into a single autonomous run.
- `disable-model-invocation: true` prevents the model from auto-triggering a skill; it only fires on explicit user invocation. This is critical for side-effect workflows where you do not want the agent deciding on its own to start a PM discovery session.
- `$ARGUMENTS` interpolation passes user-provided context into the command body.

**Example command definition (`commands/pm-discover.md`):**

```markdown
---
name: pm-discover
description: Run structured PM discovery for a product idea
disable-model-invocation: true
---

# PM Discovery

Run the full PM discovery workflow for: $ARGUMENTS

## Steps
1. Load the pm-discovery skill
2. Begin Phase A: Problem Understanding
3. Progress through all 6 phases
4. Output artifacts to docs/pm/ in the target project
```

**Chaining commands (Compound Engineering `/lfg` pattern):**

```markdown
---
name: lfg
description: Run the full SDLC pipeline end-to-end
disable-model-invocation: true
---

Execute the following pipeline in order. At each judgment gate, pause and
present findings for human approval before proceeding.

1. /pm-discover $ARGUMENTS
2. /brainstorm (using PRD from step 1)
3. /write-plan (using design doc from step 2)
4. /execute-plan (using task plan from step 3)
5. /review (on the code produced in step 4)
6. /compound (apply review fixes, re-review until clean)
```

---

### 1.2 Plan Approval Workflow (Judgment Gates)

Derived from Compound Engineering's `orchestrating-swarms` skill. This pattern ensures human oversight at critical decision points.

**Flow:**

```
Agent produces plan
    |
    v
plan_approval_request sent to leader (human)
    |
    v
Leader reviews:
    - APPROVE --> agent proceeds
    - REJECT  --> structured feedback returned, agent revises
    - MODIFY  --> leader edits plan directly, agent adopts changes
    |
    v
Agent blocks until response received
```

**Rejection feedback structure:**

```markdown
## Rejection Feedback

### What needs to change
- [ ] User persona "Enterprise Admin" is too vague -- specify company size and industry
- [ ] Missing non-functional requirement: latency budget for API calls

### Why
The downstream /write-plan stage needs precise persona definitions to scope features
correctly. Vague personas lead to scope creep during implementation.

### Priority
P1 -- blocks progression to next stage
```

**Implementation in a skill:**

```markdown
## Plan Approval Gate

Present the following to the user for review:

1. The complete plan document
2. A summary of key decisions and their rationale
3. Identified risks and mitigations

Ask the user to:
- **Approve** to proceed to execution
- **Reject** with specific feedback on what to change
- **Modify** by editing the plan directly

DO NOT proceed until explicit approval is received.
If rejected, address ALL feedback items before re-presenting.
```

---

### 1.3 Parallel Specialist Agents

Multiple narrow-domain agents run simultaneously, each producing findings from their specialty. A leader agent synthesizes all findings into a unified report.

**Research phase example:**

```
                    ┌─────────────────────┐
                    │   Leader Agent      │
                    │   (Orchestrator)    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              v               v               v
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Market     │  │  User        │  │  Technical   │
    │  Researcher │  │  Interviewer │  │  Analyst     │
    │  (WebSearch)│  │  (Dialog)    │  │  (Grep/Read) │
    └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
           │                │                  │
           v                v                  v
    market-findings   user-insights     tech-assessment
              │               │               │
              └───────────────┼───────────────┘
                              v
                    ┌─────────────────────┐
                    │  Synthesis Report   │
                    │  (Leader combines)  │
                    └─────────────────────┘
```

**Agent definition (`agents/market-researcher.md`):**

```markdown
---
name: market-researcher
model: sonnet
tools: WebSearch, WebFetch, Read, Write
context: fork
---

You are a market research specialist. Your job is to:

1. Search for competitors in the space defined by the product brief
2. Analyze their positioning, pricing, and feature sets
3. Identify market gaps and opportunities
4. Produce a structured market-findings.md report

Use WebSearch to scan Reddit, Hacker News, Product Hunt, and competitor sites.
Use WebFetch to deep-dive on promising results.

Output format:
- docs/pm/research/market-findings.md
```

**Review phase example (multiple reviewers):**

```markdown
---
name: compound-reviewer
description: Run parallel specialist reviews
---

Launch the following review agents in parallel:

1. **security-reviewer** (model: opus) -- OWASP, auth, data handling
2. **performance-reviewer** (model: sonnet) -- N+1 queries, caching, complexity
3. **architecture-reviewer** (model: opus) -- patterns, coupling, extensibility
4. **test-reviewer** (model: sonnet) -- coverage, edge cases, mocking

Synthesize all findings into a single review report with unified severity ratings.
```

---

### 1.4 Task Dependencies as Workflow DAG

Uses `TaskCreate` and `addBlockedBy` to build a dependency graph. Tasks auto-unblock when their blockers complete. Workers poll `TaskList` and claim available work.

**DAG for a typical feature:**

```
[Define Personas] ──────────────────────────────┐
                                                 v
[Write User Stories] ──> [Create Journey Map] ──> [Write PRD]
                                                   │
                              ┌────────────────────┤
                              v                    v
                    [Design Doc]            [Technical Spec]
                              │                    │
                              v                    v
                    [Implement Feature]    [Write Tests]
                              │                    │
                              └────────┬───────────┘
                                       v
                              [Code Review]
                                       │
                                       v
                              [Ship / PR]
```

**Task creation with dependencies:**

```markdown
## Task Breakdown

Create the following tasks with dependencies:

Task 1: "Define Personas" -- no blockers
Task 2: "Write User Stories" -- no blockers
Task 3: "Create Journey Map" -- blocked by Task 2
Task 4: "Write PRD" -- blocked by Tasks 1, 2, 3
Task 5: "Design Doc" -- blocked by Task 4
Task 6: "Technical Spec" -- blocked by Task 4
Task 7: "Implement Feature" -- blocked by Task 5
Task 8: "Write Tests" -- blocked by Task 6
Task 9: "Code Review" -- blocked by Tasks 7, 8
Task 10: "Ship" -- blocked by Task 9
```

Workers naturally parallelize: Tasks 1 and 2 can run simultaneously. Tasks 5 and 6 can run simultaneously. Tasks 7 and 8 can run simultaneously.

---

### 1.5 Swarm Mode

Self-organizing workers race to claim tasks from a shared pool. Provides natural load-balancing for stages with many independent work items.

**Pattern:**

```
                    ┌──────────────┐
                    │  Task Pool   │
                    │  (shared)    │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            v              v              v
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Worker 1 │  │ Worker 2 │  │ Worker 3 │
      └──────────┘  └──────────┘  └──────────┘

Worker loop:
  1. Poll TaskList for unclaimed, unblocked tasks
  2. Claim a task (atomic)
  3. Execute work
  4. Mark complete
  5. Return to step 1
  6. Exit when pool is empty
```

**Best used for:**
- Implementing many independent user stories
- Running tests across multiple modules
- Applying review fixes across multiple files
- Generating multiple artifact types in parallel

---

### 1.6 Knowledge Compounding Loop

The system accumulates institutional knowledge over time. Every stage can both produce and consume knowledge artifacts.

**Flow:**

```
[Any SDLC Stage]
       │
       ├──> produces ──> docs/solutions/<problem>.md
       │                 docs/decisions/<decision>.md
       │                 docs/patterns/<pattern>.md
       │
       └──> consumes <── learnings-researcher agent
                          searches docs/solutions/ during
                          planning and review phases
```

**Knowledge artifact structure (`docs/solutions/api-rate-limiting.md`):**

```markdown
# API Rate Limiting Solution

## Problem
Third-party API calls were unbounded, causing 429 errors in production.

## Solution
Implemented token bucket rate limiter with per-endpoint configuration.

## Key Decisions
- Chose token bucket over sliding window for burst tolerance
- Config lives in environment variables, not code

## Lessons Learned
- Always add rate limiting before first deploy, not after incidents
- Monitor 429 rates as a leading indicator

## Related
- docs/decisions/003-rate-limiting-strategy.md
- docs/patterns/resilience.md
```

**The learnings-researcher agent:**

```markdown
---
name: learnings-researcher
model: sonnet
tools: Read, Grep, Glob
context: fork
user-invocable: false
---

Before planning or reviewing, search for relevant prior solutions:

1. Grep docs/solutions/ for keywords related to the current task
2. Grep docs/decisions/ for related architectural decisions
3. Grep docs/patterns/ for applicable patterns
4. Summarize findings and present to the planning/review agent

This prevents the team from re-solving problems already solved.
```

---

## 2. Context Management Patterns

### 2.1 Progressive Disclosure

Context is loaded in layers, from always-on lightweight context to full skill content loaded only on demand. This prevents context window exhaustion.

**Layer architecture:**

```
Layer 0: CLAUDE.md (always loaded, < 500 lines)
         - Project overview, key conventions, file structure
         - Links to deeper docs, NOT full content

Layer 1: Skill descriptions (loaded at session start, ~2% of context)
         - name + description fields from SKILL.md frontmatter
         - Enough for the model to know WHEN to suggest a skill
         - Full skill body NOT loaded

Layer 2: Skill body (loaded on invocation)
         - Full SKILL.md content loaded when user invokes /command
         - References loaded via @path/to/import syntax
         - disable-model-invocation: true ensures Layer 2 is never
           loaded without explicit user action

Layer 3: Reference files (loaded on demand within skill)
         - @references/frameworks.md loaded only when skill
           instructions say to load it
         - Keeps even large skills lightweight at invocation time
```

**CLAUDE.md sizing guidelines:**

```markdown
# Good: Under 500 lines, links to detail
See [Architecture](docs/architecture.md) for full system design.
See [Artifact Catalog](docs/artifact-catalog.md) for output format specs.

# Bad: Embedding full architecture in CLAUDE.md
[3000 lines of architecture detail that consume context on every session]
```

**Monorepo pattern -- child directory CLAUDE.md:**

```
project-root/
  CLAUDE.md            # Project-wide conventions
  packages/
    frontend/
      CLAUDE.md        # React-specific conventions, loaded when working in frontend/
    backend/
      CLAUDE.md        # API-specific conventions, loaded when working in backend/
    shared/
      CLAUDE.md        # Shared types and utilities
```

Child CLAUDE.md files are only loaded when the agent's working directory is within that subtree, keeping the context window focused.

---

### 2.2 Context Isolation

Prevents cross-contamination between unrelated tasks and limits each agent's blast radius.

**`context: fork` for subagents:**

```markdown
---
name: security-reviewer
context: fork
tools: Read, Grep, Glob
---

This agent runs in a forked context:
- Gets a clean context window (no parent conversation history)
- Can only use Read, Grep, Glob (no Write, no Bash -- cannot modify files)
- Returns findings to the parent agent when complete
- Parent agent's context is not polluted by the reviewer's exploration
```

**Scoped tool access:**

| Agent Role | Allowed Tools | Rationale |
|---|---|---|
| market-researcher | WebSearch, WebFetch, Read, Write | Needs web access, writes reports |
| user-interviewer | Read, Write | Dialog-based, no web needed |
| artifact-generator | Read, Write, Bash | Generates files, runs scripts |
| security-reviewer | Read, Grep, Glob | Read-only analysis |
| code-writer | Read, Write, Bash, Grep, Glob | Full file system access |

**Session hygiene:**

```
/clear              # Wipe context between unrelated tasks
/compact <focus>    # Compress context while retaining focus area

Example:
  /compact "Focus on the authentication module implementation.
            Retain: API schema, auth middleware, test patterns.
            Discard: unrelated frontend discussion."
```

---

### 2.3 Context-as-Dictionary Between Stages (Archon Pattern)

Each pipeline stage deposits its output into a shared context dictionary. Downstream stages access upstream results by key.

**Conceptual model:**

```python
# Pseudocode for the pipeline context dictionary
context = {}

# Stage 0: PM Discovery
context["pm_discover"] = {
    "prd": "docs/pm/prd.md",
    "personas": "docs/pm/personas.md",
    "journey_maps": "docs/pm/journey-maps/",
    "user_stories": "docs/pm/user-stories.md",
}

# Stage 1: Brainstorm
context["brainstorm"] = {
    "design_doc": "docs/design/design-doc.md",
    "technical_decisions": "docs/decisions/",
}

# Stage 2: Write Plan
context["write_plan"] = {
    "task_plan": "docs/plan/task-plan.md",
    "task_count": 14,
    "estimated_effort": "3 sprints",
}

# Stage 3: Execute Plan
context["execute_plan"] = {
    "completed_tasks": ["task-1", "task-2", ...],
    "files_changed": ["src/auth.ts", "src/api.ts", ...],
}

# Each stage can access any upstream stage's output:
# context["pm_discover"]["prd"] -> path to PRD
```

**In practice with Claude Code,** the filesystem IS the dictionary. Each stage writes to known paths, and downstream stages read from those paths:

```
docs/pm/prd.md                    # PM stage output
docs/design/design-doc.md         # Brainstorm stage output
docs/plan/task-plan.md            # Planning stage output
docs/decisions/*.md               # Decision records (any stage)
docs/solutions/*.md               # Knowledge artifacts (any stage)
```

---

### 2.4 File-Based State (Planning-with-Files Pattern)

From Trail of Bits. Treats the filesystem as persistent disk and the context window as volatile RAM. Critical for long-running sessions.

**Core files:**

```
docs/plan/
  task-plan.md       # The master plan -- task breakdown, priorities, dependencies
  findings.md        # Accumulated discoveries during execution
  progress.md        # Completion tracking -- what's done, what's next
  blockers.md        # Current blockers and their resolution status
```

**task-plan.md structure:**

```markdown
# Task Plan: Authentication System

## Overview
Implement OAuth2 + JWT authentication with role-based access control.

## Tasks

### Task 1: Database Schema [COMPLETE]
- Add users, roles, permissions tables
- Migration file: migrations/001_auth_tables.sql

### Task 2: JWT Service [IN PROGRESS]
- Token generation, validation, refresh
- Files: src/services/jwt.ts, src/middleware/auth.ts

### Task 3: OAuth2 Provider Integration [BLOCKED]
- Blocked by: Task 2 (needs JWT service)
- Providers: Google, GitHub

### Task 4: RBAC Middleware [NOT STARTED]
- Blocked by: Task 1 (needs schema)
- Permission checking middleware
```

**progress.md structure:**

```markdown
# Progress Tracker

## Status: 1/4 tasks complete (25%)

| Task | Status | Notes |
|------|--------|-------|
| Database Schema | COMPLETE | Migrations applied |
| JWT Service | IN PROGRESS | Token generation done, refresh pending |
| OAuth2 Integration | BLOCKED | Waiting on JWT service |
| RBAC Middleware | NOT STARTED | -- |

## Current Focus
Task 2: JWT Service -- implementing token refresh logic

## Blockers
- None currently active

## Decisions Made
- Using RS256 for JWT signing (see docs/decisions/004-jwt-algorithm.md)
```

**Why this matters:** Claude's context window is limited and subject to compaction. If critical state (like what tasks are done) lives only in the conversation, it can be lost during long sessions. File-based state survives compaction, session restarts, and context forks.

---

## 3. Model Routing Patterns

### 3.1 Task-Based Model Selection

Different tasks have different complexity and cost profiles. Route to the appropriate model tier.

| Task Type | Model | Rationale |
|---|---|---|
| File discovery, quick search | Haiku | Fast, cheap, sufficient for glob/grep |
| Code scaffolding, boilerplate | Sonnet | Good code generation at lower cost |
| Standard code review | Sonnet | Balanced quality/cost for routine review |
| PM discovery, requirements | Opus | Deep reasoning about ambiguous problems |
| Security review | Opus | High stakes, cannot miss vulnerabilities |
| Architecture decisions | Opus | Complex trade-off analysis |
| Complex debugging | Opus | Root cause analysis across multiple files |
| Daily reports, summaries | Sonnet | Routine synthesis, cost-sensitive |
| Anti-rationalization checks | Haiku | Quick verification, binary output |

**Cost implications:** Opus is roughly 15x more expensive than Haiku and 5x more expensive than Sonnet per token. Routing correctly can reduce costs by 60-80% on mixed workloads without sacrificing quality on critical tasks.

---

### 3.2 Per-Subagent Model Configuration

Set the `model` field in agent frontmatter to override the session default.

```markdown
---
name: security-reviewer
model: opus
tools: Read, Grep, Glob
context: fork
---

You are a security review specialist. Analyze code for:
- OWASP Top 10 vulnerabilities
- Authentication and authorization flaws
- Data exposure risks
- Injection vectors
- Cryptographic weaknesses
```

```markdown
---
name: boilerplate-generator
model: sonnet
tools: Read, Write
context: fork
---

Generate boilerplate code following the project's established patterns.
Read existing files in the same directory to match conventions.
```

```markdown
---
name: file-finder
model: haiku
tools: Grep, Glob
context: fork
---

Find files matching the requested pattern. Return file paths only.
```

---

### 3.3 Per-Skill Model Override

Skills can specify `model:` in their frontmatter to override the session-level default. This ensures high-stakes skills always use the appropriate model regardless of how the user has configured their session.

```markdown
---
name: pm-discovery
description: Structured product management discovery workflow
model: opus
disable-model-invocation: true
---

# PM Discovery Skill

This skill requires deep reasoning about ambiguous product requirements.
The model override ensures Opus is used even if the session default is Sonnet.
```

**Precedence order (highest to lowest):**
1. Agent-level `model:` (most specific)
2. Skill-level `model:` (invocation-specific)
3. Session-level `--model` flag (user's choice)
4. System default

---

## 4. Judgment Gate Design Patterns

### 4.1 Visual Decision-Support Artifacts

Judgment gates must present information in formats that support fast, accurate human decisions. Raw text dumps are insufficient for complex decisions.

**Artifact types by decision context:**

| Decision Context | Artifact Format | Why |
|---|---|---|
| User journey review | HTML experience map | Spatial layout shows flow, pain points visible at a glance |
| Persona validation | Visual persona cards | Photos, key stats, and quotes are faster to scan than prose |
| PRD approval | Structured markdown + PDF | Stakeholders expect familiar document format |
| Architecture review | Mermaid diagrams | System topology is inherently visual |
| Risk assessment | Severity-colored table | Red/yellow/green encoding speeds triage |
| Progress tracking | Dashboard with metrics | Numbers and charts beat narrative for status |

**HTML artifact generation example:**

```javascript
// scripts/generate-experience-map.js
const puppeteer = require('puppeteer');

async function generateExperienceMap(data, outputPath) {
  const html = renderTemplate('templates/experience-map.html', data);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  // Save as HTML for interactive viewing
  fs.writeFileSync(`${outputPath}.html`, html);

  // Save as PDF for sharing
  await page.pdf({ path: `${outputPath}.pdf`, format: 'A3', landscape: true });

  await browser.close();
}
```

**Humanizer pass before presenting:**

```markdown
Before presenting any artifact to the user for judgment:
1. Check for jargon that could be misunderstood
2. Add executive summary at the top (3-5 bullet points)
3. Highlight the specific decisions needed in bold
4. Provide clear accept/reject/modify options
5. Include confidence levels for recommendations
```

---

### 4.2 Gate Information Requirements

Every judgment gate must answer four questions before presenting to the human.

**Gate design checklist:**

```markdown
## Gate: PRD Approval

### 1. What information aids the judgment?
- The PRD itself (problem statement, requirements, success metrics)
- Competitive analysis summary (how does this compare to alternatives?)
- User research highlights (what do users actually say?)
- Technical feasibility assessment (is this buildable?)
- Estimated effort (how long will this take?)

### 2. What does the human need to do the judgment?
- Enough domain context to evaluate requirements
- Comparison against business objectives
- Understanding of trade-offs being made

### 3. What format best represents the information?
- PRD: structured markdown with clear sections
- Competition: comparison table
- User research: persona cards + key quotes
- Feasibility: traffic-light assessment (green/yellow/red)
- Effort: T-shirt sizes with confidence intervals

### 4. What information must be stored for future gates?
- The decision itself (approved/rejected/modified)
- Rationale for the decision
- Any modifications made
- Who approved and when
- Open questions deferred to later gates
```

---

### 4.3 Severity-Based Gate Enforcement

From Compound Engineering. Issues found at judgment gates are classified by severity, and severity determines whether the pipeline can proceed.

**Severity levels:**

```markdown
## P1: BLOCKS Progression
Must be resolved before moving to the next stage.
Examples:
- Missing critical requirement
- Security vulnerability in design
- Contradictory requirements
- Missing success metrics

## P2: Should Be Fixed
Recommended to fix before continuing, but can be deferred with explicit acknowledgment.
Examples:
- Incomplete edge case coverage
- Missing non-functional requirement
- Unclear acceptance criteria for one story

## P3: Nice-to-Have
Can be deferred to a future iteration without risk.
Examples:
- Additional persona detail
- Enhanced error messages
- Optional analytics events
```

**Gate enforcement logic:**

```markdown
## Gate Decision Rules

IF any P1 issues exist:
  -> BLOCK: Cannot proceed. List all P1 issues.
  -> Agent must address P1 issues and re-present.

IF only P2 issues exist:
  -> WARN: "The following issues should be addressed."
  -> User can APPROVE (proceed with P2s noted) or REJECT (fix first).

IF only P3 issues exist:
  -> PASS: Note P3s for future iteration and proceed.

IF no issues:
  -> PASS: Proceed to next stage.
```

---

### 4.4 Decision Artifact Persistence

Every judgment gate produces a decision artifact that is stored for future reference. This builds institutional memory and provides an audit trail.

**Decision record format (`docs/decisions/001-auth-strategy.md`):**

```markdown
# Decision 001: Authentication Strategy

## Date
2026-02-19

## Status
APPROVED

## Gate
PRD Approval (Phase E)

## Context
The application needs user authentication. Options considered:
1. Session-based auth with cookies
2. JWT tokens with refresh
3. OAuth2 delegation only (no local accounts)

## Decision
Option 2: JWT tokens with refresh flow.

## Rationale
- Stateless backend aligns with our containerized deployment
- Refresh tokens provide security without constant re-login
- Can add OAuth2 providers later as optional login methods

## Consequences
- Must implement secure token storage on client side
- Need token refresh middleware
- Must handle token revocation for logout

## Participants
- Product Manager (human) -- approved
- Security Reviewer (agent) -- recommended additional token rotation

## Related
- docs/pm/prd.md (Section 4.2: Authentication Requirements)
- docs/solutions/jwt-refresh-pattern.md
```

---

## 5. Verification and Quality Patterns

### 5.1 Anti-Rationalization Hook

From Trail of Bits. Uses a cheap model (Haiku) to verify that Claude actually completed work rather than rationalizing why it did not need to.

**The problem:** Claude sometimes produces plausible-sounding explanations for why code is correct without actually verifying it, or claims a task is complete when it is partially done.

**The solution: a stop hook that verifies completion.**

**Hook configuration (`.claude/hooks.json`):**

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "python3 scripts/verify-completion.py"
      }
    ]
  }
}
```

**Verification script (`scripts/verify-completion.py`):**

```python
#!/usr/bin/env python3
"""
Anti-rationalization hook.
Uses Haiku to verify Claude actually completed the claimed work.
Runs on Stop event -- before the agent declares itself done.
"""
import subprocess
import json
import sys

def verify():
    # Read the transcript summary from stdin (hook receives context)
    transcript = sys.stdin.read()

    # Use Haiku (cheap, fast) to verify
    prompt = f"""
    Review this agent session transcript. Answer ONLY "VERIFIED" or "INCOMPLETE".

    INCOMPLETE if:
    - Agent said it would do something but did not
    - Agent claimed code works but did not run tests
    - Agent said "I'll skip this for now" on a required item
    - Agent produced a plan but did not execute it
    - Files were mentioned as created but may not exist

    VERIFIED if:
    - All claimed actions were actually performed
    - Tests were run and passed (if applicable)
    - All required artifacts exist

    Transcript:
    {transcript}
    """

    result = subprocess.run(
        ["claude", "--model", "haiku", "--print", "-p", prompt],
        capture_output=True, text=True
    )

    if "INCOMPLETE" in result.stdout:
        print("HOOK FAILURE: Anti-rationalization check failed.")
        print("Agent may not have completed all claimed work.")
        print(result.stdout)
        sys.exit(1)  # Non-zero exit blocks the stop

    print("HOOK PASS: Work verified as complete.")
    sys.exit(0)

verify()
```

**Cost profile:** Haiku verification adds approximately $0.001 per check. Running it on every Stop event is negligible compared to the cost of the Opus/Sonnet session it verifies.

---

### 5.2 System-Wide Test Check

From Compound Engineering. Before marking any task complete, the agent must answer five questions about system-wide impact.

**The five questions:**

```markdown
## Pre-Completion Checklist

Before marking this task as DONE, verify:

### 1. What fires when this runs?
- List all callbacks, middleware, observers, and event handlers
  that activate when this code path executes.
- Have you accounted for all of them?

### 2. Do tests exercise the real chain?
- Are tests using mocks that hide real behavior?
- Does the test actually invoke the middleware/hooks that
  production will invoke?
- Would a bug in a mock-hidden dependency go undetected?

### 3. Can failure leave orphaned state?
- If this operation fails halfway, what state is left behind?
- Are there database records without corresponding file system
  artifacts (or vice versa)?
- Is there a cleanup/rollback path?

### 4. What other interfaces expose this?
- API endpoints, CLI commands, background jobs, webhooks --
  does the change affect all of them consistently?
- Is there a code path that bypasses the new logic?

### 5. Do error strategies align across layers?
- If the database layer throws, does the API layer handle it?
- Are error codes consistent across layers?
- Does the client receive meaningful error information?
```

**Implementation as a skill reference:**

```markdown
<!-- skills/code-review/references/completion-checklist.md -->

When a developer agent marks a task complete, load this checklist
and verify all five items. If any item reveals a gap, the task
is NOT complete -- reopen it and address the gap.
```

---

### 5.3 Writer/Reviewer Pattern

One session writes code. A separate, fresh session reviews it. The clean context ensures honest review without confirmation bias.

**Why this works:** When the same context window contains both the writing process and the review, the model has already "justified" its design choices during writing. A fresh context sees only the output and evaluates it objectively.

**Implementation:**

```markdown
## Step 1: Write (Session A)
/execute-plan
# Agent writes code, tests, documentation

## Step 2: Review (Session B -- fresh context)
/review
# Fresh agent reviews code with no knowledge of the writing process
# Sees only: the code, the requirements, and the test results
# Cannot rationalize "I wrote it this way because..."
```

**In CI/CD, this is natural:** The GitHub Action that runs on `pull_request` events always gets a fresh context. The reviewing Claude has never seen the writing Claude's reasoning.

---

### 5.4 Incremental Commit Heuristic

A simple rule for when to commit during long implementation sessions.

**The rule:**

> "Can I write a commit message that describes a complete, valuable change? If yes, commit. If the message would say 'WIP' or 'partial implementation', keep working."

**Good commit boundaries:**

```
"Add user authentication middleware with JWT validation"     # Complete feature unit
"Fix race condition in token refresh by adding mutex"        # Complete bug fix
"Add integration tests for OAuth2 login flow"                # Complete test suite
"Refactor database queries to use prepared statements"       # Complete refactor
```

**Bad commit boundaries:**

```
"WIP: started working on auth"                    # Incomplete
"Add half the tests"                              # Incomplete
"Refactor part 1 of 3"                            # Incomplete
```

**Implementation in agent instructions:**

```markdown
After completing each logically complete unit of work, commit with a
descriptive message. Do NOT commit partial work. Do NOT batch multiple
unrelated changes into a single commit.

Test: Can you describe this commit in one sentence without using
"WIP", "partial", "started", or "in progress"? If not, keep working.
```

---

### 5.5 Hooks as Guardrails

Hooks guarantee execution, unlike CLAUDE.md instructions which are advisory. Use hooks for invariants that must never be violated.

**Available hook points:**

| Hook | Fires When | Use Case |
|---|---|---|
| `PostToolUse` | After any tool call | Run linter after file edits |
| `Stop` | Before agent declares done | Anti-rationalization check |
| `TaskCompleted` | When a task is marked complete | Verify tests pass |
| `TeammateIdle` | When a swarm worker has no tasks | Send feedback/redirect |

**PostToolUse linter hook (`.claude/hooks.json`):**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "type": "command",
        "command": "scripts/lint-changed-files.sh",
        "match_tool": "Write|Edit"
      }
    ]
  }
}
```

**`scripts/lint-changed-files.sh`:**

```bash
#!/bin/bash
# Runs after every Write or Edit tool call
# Lints only the files that were just modified

CHANGED_FILE="$TOOL_OUTPUT_PATH"

if [[ "$CHANGED_FILE" == *.ts || "$CHANGED_FILE" == *.tsx ]]; then
  npx eslint "$CHANGED_FILE" --fix
elif [[ "$CHANGED_FILE" == *.py ]]; then
  ruff check "$CHANGED_FILE" --fix
fi
```

**Key insight:** CLAUDE.md says "always run the linter." A hook _forces_ the linter to run. The difference matters when sessions are long, context is compressed, or the agent is under cognitive load.

---

## 6. Plugin Architecture Patterns

### 6.1 Standard Plugin Structure

Every plugin follows a consistent directory structure.

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (name, version, description)
├── skills/
│   └── skill-name/
│       ├── SKILL.md             # Skill definition (frontmatter + instructions)
│       └── references/          # Supporting documents loaded via @import
│           ├── frameworks.md
│           └── examples.md
├── commands/
│   ├── primary-command.md       # User-facing slash commands
│   └── secondary-command.md
├── agents/                      # Subagent definitions (optional)
│   ├── specialist-one.md
│   └── specialist-two.md
├── hooks/                       # Lifecycle hooks (optional)
│   └── hooks.json
├── scripts/                     # Supporting scripts (optional)
│   └── generate-report.js
├── templates/                   # Output templates (optional)
│   └── report.html
├── CLAUDE.md                    # Plugin-level context
└── package.json                 # Dependencies (if any)
```

**`plugin.json` manifest:**

```json
{
  "name": "pm-artifacts",
  "version": "1.0.0",
  "description": "AI Product Manager for structured discovery and artifact generation",
  "skills": ["pm-discovery"],
  "commands": ["pm-discover", "pm-resume", "pm-review"],
  "agents": ["market-researcher", "user-interviewer", "artifact-generator"]
}
```

---

### 6.2 Skill Frontmatter Fields

The SKILL.md frontmatter controls how and when a skill is loaded, what tools it can access, and how it interacts with the session.

```yaml
---
# Identity
name: pm-discovery
description: >
  Structured product management discovery workflow that produces PRDs,
  user stories, journey maps, personas, and handoff specs.

# Invocation control
disable-model-invocation: true     # Only fires on explicit /pm-discover
user-invocable: true               # Appears in slash command list

# Execution environment
model: opus                        # Override session model for this skill
context: fork                      # Run in isolated context window
agent: artifact-generator          # Use this agent definition for forked context

# Capability restrictions
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---
```

**Field reference:**

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string | required | Unique skill identifier |
| `description` | string | required | Used for auto-invocation matching and skill listing |
| `disable-model-invocation` | boolean | false | If true, model cannot auto-invoke; requires explicit slash command |
| `user-invocable` | boolean | true | If false, skill is background knowledge only |
| `model` | string | session default | Model override: haiku, sonnet, opus |
| `context` | string | "inherit" | "fork" for isolated context, "inherit" for shared |
| `agent` | string | none | Agent definition to use for forked context |
| `allowed-tools` | list | all | Restrict which tools the skill can use |

---

### 6.3 Placeholder Connectors (`~~` Pattern)

From Anthropic's knowledge-work plugins. Skills reference external services through `~~` placeholders. Users map placeholders to specific MCP servers in `.mcp.json`. This decouples skill logic from specific service integrations.

**Skill using placeholders:**

```markdown
---
name: project-sync
description: Sync PM artifacts to project tracker
---

## Sync Workflow

1. Read the PRD from docs/pm/prd.md
2. Extract user stories
3. Create tickets in ~~project tracker~~ for each story
4. Post summary to ~~chat~~ channel #product-updates
5. Update ~~knowledge base~~ with the new PRD
```

**`.mcp.json` mapping (user configures):**

```json
{
  "mcpServers": {
    "project tracker": {
      "type": "linear",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-linear"],
      "env": {
        "LINEAR_API_KEY": "lin_api_..."
      }
    },
    "chat": {
      "type": "slack",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-slack"],
      "env": {
        "SLACK_TOKEN": "xoxb-..."
      }
    },
    "knowledge base": {
      "type": "notion",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-notion"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
      }
    }
  }
}
```

**Graceful degradation:**

```markdown
When a ~~ connector is not configured:
1. Note which connector is missing
2. Skip that step with a warning to the user
3. Continue with remaining steps
4. At the end, summarize what was skipped and what manual steps the user needs to take

Example output:
"Note: ~~project tracker~~ is not configured. User stories were saved to
docs/pm/user-stories.md but not synced to a project tracker. To configure,
add a 'project tracker' entry to .mcp.json."
```

---

### 6.4 Marketplace Pattern

Plugins are distributed via marketplace repositories. Users discover and install plugins through CLI commands.

**`marketplace.json` at repo root:**

```json
{
  "name": "sdlc-plugins",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "pm-artifacts",
      "description": "AI Product Manager for structured discovery",
      "path": "./pm-artifacts",
      "version": "1.0.0",
      "skills": ["pm-discovery"],
      "commands": ["pm-discover", "pm-resume", "pm-review"]
    },
    {
      "name": "code-review",
      "description": "Multi-specialist code review",
      "path": "./code-review",
      "version": "1.0.0",
      "skills": ["code-review"],
      "commands": ["review"]
    }
  ]
}
```

**Installation flow:**

```bash
# Register a marketplace
claude plugin marketplace add https://github.com/org/sdlc-plugins

# List available plugins
claude plugin marketplace list

# Install a specific plugin
claude plugin install pm-artifacts@sdlc-plugins

# Namespaced invocation (if needed)
# /pm-artifacts:pm-discover
```

---

## 7. Plugin Composition Patterns

### 7.1 Pipeline Composition (Sequential)

Plugins chain sequentially. Each plugin's output feeds the next plugin's input via the filesystem.

**Full SDLC pipeline:**

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ pm-artifacts│     │  superpowers  │     │  superpowers  │
│ /pm-discover│────>│  /brainstorm  │────>│  /write-plan  │
│             │     │              │     │              │
│ Output:     │     │ Input:       │     │ Input:       │
│ docs/pm/    │     │ docs/pm/prd  │     │ docs/design/ │
│  prd.md     │     │              │     │              │
│  personas/  │     │ Output:      │     │ Output:      │
│  stories.md │     │ docs/design/ │     │ docs/plan/   │
└─────────────┘     └──────────────┘     └──────────────┘
        │                                        │
        │                                        v
        │                              ┌──────────────┐
        │                              │  superpowers  │
        │                              │ /execute-plan │
        │                              │              │
        │                              │ Input:       │
        │                              │ docs/plan/   │
        │                              │              │
        │                              │ Output:      │
        │                              │ src/         │
        │                              └──────┬───────┘
        │                                     │
        │                                     v
        │                              ┌──────────────┐
        │                              │ code-review   │
        │                              │ /review       │
        │                              │              │
        │                              │ Input:       │
        │                              │ src/ + plan  │
        │                              │              │
        │                              │ Output:      │
        │                              │ review.md    │
        │                              └──────┬───────┘
        │                                     │
        v                                     v
┌─────────────┐                      ┌──────────────┐
│ pm-artifacts│                      │  commit-cmds  │
│ /pm-review  │                      │ /compound     │
│             │                      │              │
│ Closes the  │                      │ Fix + reship │
│ loop        │                      │              │
└─────────────┘                      └──────────────┘
```

**Interface contract between stages:**

Each stage must document:
1. **Input paths** -- what files it reads and what format it expects
2. **Output paths** -- what files it writes and what format they use
3. **Required fields** -- minimum content needed from upstream
4. **Optional enrichment** -- additional context that improves output quality

---

### 7.2 Quality Gate Injection (Cross-Cutting)

Quality plugins inject into the pipeline at specific points without the core pipeline knowing about them. This is the cross-cutting concerns pattern applied to SDLC workflows.

**Injection points:**

```
                Before human-facing output:
                ┌──────────────┐
     ───────────│  humanizer   │──────────> Human sees polished output
                └──────────────┘

                Before credential handling:
                ┌───────────────────────┐
     ───────────│  security-awareness   │──────────> Flagged if secrets detected
                └───────────────────────┘

                Before deployment:
                ┌────────────────────────────┐
     ───────────│  security-best-practices   │──────────> Blocked if vuln found
                └────────────────────────────┘
```

**Implementation as hooks:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "scripts/check-secrets.sh",
        "match_tool": "Write|Edit",
        "description": "Block writes that contain secrets"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "scripts/humanize-output.sh",
        "match_tool": "Write",
        "match_path": "docs/pm/**",
        "description": "Polish PM-facing artifacts"
      }
    ]
  }
}
```

---

### 7.3 Knowledge Capture Loop (Meta Pattern)

After completing any workflow, extract reusable patterns as skills. Over time, this builds an organization-specific skill library.

**Flow:**

```
[Complete a workflow]
        │
        v
[skill-extractor agent]
  - What patterns emerged?
  - What decisions were reusable?
  - What prompts worked well?
        │
        v
[New skill saved to ~/.claude/skills/ or .claude/skills/]
        │
        v
[Available in future sessions automatically]
```

**Skill extraction prompt:**

```markdown
Review the completed workflow and extract reusable patterns:

1. Were there prompting strategies that consistently produced good results?
2. Were there multi-step processes that should be codified?
3. Were there domain-specific rules that apply beyond this project?
4. Were there tool usage patterns worth preserving?

For each extracted pattern, create a skill file with:
- Clear name and description
- Step-by-step instructions
- Examples of good and bad output
- Required tools and model recommendations
```

---

## 8. GitHub Actions / CI-CD Patterns

### 8.1 Available Triggers

Claude Code integrates with GitHub Actions for automated workflows.

| Trigger | Event | Use Case |
|---|---|---|
| `issue_comment` | @claude mention in issue/PR | Interactive assistance, code fixes on demand |
| `pull_request` | PR opened/synchronized | Automated code review |
| `issues` | Issue created/labeled | Feature implementation from issue description |
| `schedule` | Cron schedule | Daily reports, maintenance, dependency updates |

**Issue comment trigger (interactive):**

```yaml
name: Claude Code Assistant
on:
  issue_comment:
    types: [created]

jobs:
  respond:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          claude_args: "--model sonnet --max-turns 20"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Pull request review trigger:**

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: "/review"
          claude_args: "--model sonnet --max-turns 30"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Scheduled maintenance:**

```yaml
name: Daily Dependency Check
on:
  schedule:
    - cron: '0 9 * * 1-5'  # 9 AM weekdays

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: "Check for outdated dependencies. If any have security advisories, create a PR to update them."
          claude_args: "--model sonnet --max-turns 15"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

### 8.2 Key Configuration Options

**Action parameters:**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    # Required
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

    # Model and limits
    claude_args: >
      --model sonnet
      --max-turns 30

    # MCP server configuration
    mcp_config: |
      {
        "mcpServers": {
          "github": {
            "command": "npx",
            "args": ["-y", "@anthropic/mcp-github"],
            "env": {
              "GITHUB_TOKEN": "${{ secrets.GITHUB_TOKEN }}"
            }
          }
        }
      }

    # Custom prompt (can reference skills)
    prompt: "/review --focus security,performance"
```

---

### 8.3 Cost Optimization for CI/CD

CI/CD runs can accumulate significant costs without guardrails.

**Strategies:**

```yaml
# 1. Limit turns to prevent runaway iterations
claude_args: "--max-turns 20"

# 2. Use Sonnet as default CI model (5x cheaper than Opus)
claude_args: "--model sonnet"

# 3. Set workflow-level timeout
jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 15         # Kill after 15 minutes

# 4. Concurrency controls -- prevent parallel runs on same PR
concurrency:
  group: claude-${{ github.event.pull_request.number }}
  cancel-in-progress: true      # New push cancels old run

# 5. Conditional execution -- only run on meaningful changes
jobs:
  review:
    if: |
      github.event.pull_request.changed_files > 0 &&
      !contains(github.event.pull_request.title, '[skip-review]')
```

**Cost estimation:**

| Scenario | Model | Turns | Est. Cost |
|---|---|---|---|
| PR review (small) | Sonnet | 10 | $0.10-0.30 |
| PR review (large) | Sonnet | 30 | $0.50-1.50 |
| Feature from issue | Sonnet | 50 | $1.00-3.00 |
| Security review | Opus | 20 | $1.00-5.00 |
| Daily maintenance | Sonnet | 15 | $0.20-0.50 |

---

## Appendix A: Pattern Selection Guide

Use this table to select the right pattern for your situation.

| Situation | Primary Pattern | Supporting Patterns |
|---|---|---|
| Building a new SDLC pipeline | Pipeline-as-Slash-Commands | File-Based State, Context-as-Dictionary |
| Need human oversight at key points | Plan Approval Workflow | Visual Decision-Support, Severity-Based Gates |
| Many independent tasks to parallelize | Swarm Mode | Task Dependencies as DAG |
| Long-running session (>30 min) | File-Based State | Progressive Disclosure, /compact |
| Multi-specialist analysis needed | Parallel Specialist Agents | Context Isolation, Per-Subagent Model Config |
| Worried about Claude cutting corners | Anti-Rationalization Hook | Writer/Reviewer, System-Wide Test Check |
| Building reusable plugin | Standard Plugin Structure | Marketplace Pattern, Placeholder Connectors |
| CI/CD integration | GitHub Actions triggers | Cost Optimization, Writer/Reviewer |
| Cross-cutting quality concerns | Quality Gate Injection | Hooks as Guardrails |
| Accumulating team knowledge | Knowledge Compounding Loop | Knowledge Capture Loop, Decision Persistence |

## Appendix B: Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Better Alternative |
|---|---|---|
| Everything in CLAUDE.md | Exceeds 500 lines, wastes context on every session | Progressive Disclosure with @imports |
| Single monolithic skill | Too much context loaded at once | Break into focused skills with references/ |
| Same model for everything | Wastes money on simple tasks, underperforms on complex ones | Task-Based Model Selection |
| Trusting CLAUDE.md for invariants | Advisory only, can be ignored under cognitive load | Hooks as Guardrails |
| Same session writes and reviews | Confirmation bias, cannot objectively evaluate own work | Writer/Reviewer Pattern |
| No file-based state | State lost during compaction or long sessions | Planning-with-Files Pattern |
| No judgment gates | Runaway agent produces unwanted output | Plan Approval Workflow at every stage boundary |
| Hardcoded service integrations | Cannot swap Linear for Jira without rewriting skill | Placeholder Connectors (~~pattern) |
| No cost controls in CI | Runaway iteration burns budget | max-turns + timeout + concurrency limits |
| Committing WIP | Pollutes git history, hard to revert | Incremental Commit Heuristic |
