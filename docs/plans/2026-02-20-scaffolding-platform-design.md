---
artifact: design-doc
project: "Claude Code Scaffolding Platform"
date: "2026-02-20"
status: approved
author: "Milind + Claude"
---

# Design Document: Claude Code Scaffolding Platform

## Overview

A deeply customized fork of Superpowers (obra/superpowers) that transforms Claude Code into a judgment-gated SDLC automation platform. The system adds three layers: (1) PM discovery, (2) SDLC orchestration with severity-based gates, and (3) context management with model routing. Built for a single power user targeting 80% autonomous execution, 20% human judgment at structured decision points.

**Approach:** Orchestrator Agent + Native Primitives. A thin custom agent that leverages Claude Code's native Task tool, hooks, model routing, and AskUserQuestion — writing configuration and domain logic, not infrastructure.

---

## Section 1: Repository & File Structure

The project is two layers: a minimal fork of superpowers (commands, hooks, agents) and personal skills in `~/.config/superpowers/skills/`.

```
superpowers/                          (forked, minimal changes)
├── CLAUDE.md                         (modified: add orchestration context)
├── commands/
│   ├── brainstorm.md                 (existing)
│   ├── write-plan.md                 (existing)
│   ├── execute-plan.md               (existing)
│   ├── scaffold.md                   (NEW: /scaffold command)
│   └── orchestrate.md               (NEW: /orchestrate command)
├── hooks/
│   └── (existing hooks unchanged)
├── agents/
│   └── (existing agents unchanged)
└── ...                               (everything else untouched)

~/.claude/agents/                     (user-level agent definitions)
├── orchestrator.md                   (model: opus — pipeline conductor)
├── market-researcher.md              (model: sonnet — web research)
├── artifact-generator.md             (model: sonnet — PM artifact generation)
├── verifier.md                       (model: sonnet — anti-rationalization checks)
└── humanizer.md                      (model: sonnet — strip AI patterns)

~/.config/superpowers/skills/         (personal skills)
├── pm-discovery/
│   ├── SKILL.md                      (6-phase PM workflow)
│   ├── templates/                    (PRD, stories, personas, journey map, PM spec)
│   └── scripts/                      (HTML generation)
├── scaffolding/
│   ├── SKILL.md                      (scaffolding engine logic)
│   └── templates/
│       ├── software.yaml
│       ├── claude-code-plugin.yaml
│       ├── course.yaml
│       └── content.yaml
├── judgment-gates/
│   ├── SKILL.md                      (gate presentation + decision persistence)
│   └── templates/
│       └── decision-record.md        (template for docs/pm/decisions/)
└── context-management/
    ├── SKILL.md                      (context scoping rules)
    └── model-routing.yaml            (task-type → model mapping)

~/.claude/settings.json               (hooks configuration)
├── Stop hook → verifier agent
├── TaskCompleted hook → artifact schema validation
└── SessionStart hook → load pipeline state

Target project (user's actual project):
├── docs/pm/                          (all PM artifacts land here)
│   ├── .pipeline-state.json          (current stage, completed stages)
│   ├── .pipeline-progress.md         (living plan with checkboxes)
│   ├── decisions/                    (persisted judgment gate decisions)
│   ├── review-findings/              (P2/P3 findings logged here)
│   ├── learnings/                    (knowledge compounding)
│   │   ├── market-patterns/
│   │   ├── discovery-patterns/
│   │   ├── architecture-patterns/
│   │   └── anti-patterns/
│   └── pipeline.yaml                 (stage sequence config for this project)
└── ...
```

**Key principle:** The fork touches only `commands/` (2 new files) and `CLAUDE.md`. Everything else is additive in user-level directories. Upstream merges stay clean.

---

## Section 2: Pipeline Configuration & Orchestrator Agent

The orchestrator reads a `pipeline.yaml` from the target project's `docs/pm/` directory. This file defines the stage sequence, which agent/skill handles each stage, gate severity level, and what artifacts the stage must produce.

### pipeline.yaml

```yaml
pipeline:
  name: "Full SDLC"
  stages:
    - id: pm-discover
      type: skill
      skill: pm-discovery
      model: opus
      gate: p1
      gate_prompt: "Review PM artifacts: personas, journey maps, user stories, PRD, PM spec"
      produces:
        - docs/pm/*-personas.md
        - docs/pm/*-journey-map.md
        - docs/pm/*-user-stories.md
        - docs/pm/*-feature-stories.md
        - docs/pm/*-prd.md
        - docs/pm/*-pm-spec.md

    - id: brainstorm
      type: skill
      skill: superpowers:brainstorming
      model: opus
      gate: p1
      gate_prompt: "Review the design document"
      consumes:
        - docs/pm/*-pm-spec.md
      produces:
        - docs/plans/*-design.md

    - id: write-plan
      type: skill
      skill: superpowers:writing-plans
      model: opus
      gate: p1
      gate_prompt: "Review the implementation plan"
      consumes:
        - docs/plans/*-design.md
      produces:
        - docs/plans/*-plan.md

    - id: execute-plan
      type: skill
      skill: superpowers:executing-plans
      model: sonnet
      gate: none
      consumes:
        - docs/plans/*-plan.md
      produces:
        - src/**

    - id: code-review
      type: agent
      agent: code-reviewer
      model: sonnet
      gate: p1
      gate_prompt: "Review code quality findings"
      consumes:
        - src/**
        - docs/plans/*-plan.md

    - id: ship
      type: skill
      skill: superpowers:finishing-a-development-branch
      model: sonnet
      gate: none
```

### orchestrator.md

```yaml
---
name: orchestrator
description: "SDLC pipeline conductor. Dispatches stages, validates outputs, inserts severity-based gates."
model: opus
tools: Read, Glob, Grep, Task, Bash, AskUserQuestion
skills:
  - judgment-gates
  - context-management
---

You are the SDLC orchestrator. Your job:

1. Read docs/pm/pipeline.yaml for the stage sequence
2. Read docs/pm/.pipeline-state.json for current progress
3. Search docs/pm/learnings/ for relevant past learnings and include in context
4. For each uncompleted stage:
   a. Read only the artifacts listed in `consumes` (scoped context)
   b. Include relevant decision summaries from docs/pm/decisions/
   c. Dispatch the stage via Task tool (for agents) or Skill invocation (for skills)
   d. Validate that all artifacts in `produces` exist and are non-empty
   e. Run verifier agent on output — classify findings as P1/P2/P3
   f. If P1 findings exist: invoke judgment-gates skill (present artifacts, get approval)
   g. If P2/P3 only: log to docs/pm/review-findings/, continue automatically
   h. Update .pipeline-state.json and .pipeline-progress.md
5. If a stage fails: retry once with adjusted prompt, then escalate to judgment gate
6. Log all transitions to docs/pm/.pipeline-log.md

Autonomous mode (--auto flag):
- Skip all gates. Log P1 findings to docs/pm/review-findings/ with REQUIRES_ATTENTION flag.
- Run full pipeline end-to-end without stopping.
- Human reviews final output, not intermediate artifacts.
```

### .pipeline-state.json

```json
{
  "pipeline": "Full SDLC",
  "mode": "severity-gated",
  "current_stage": "brainstorm",
  "completed": ["pm-discover"],
  "decisions": [
    {
      "gate": "pm-discover",
      "decision": "approved",
      "severity": "p1",
      "timestamp": "2026-02-19T14:30:00Z",
      "file": "docs/pm/decisions/2026-02-19-pm-discover-gate.md"
    }
  ]
}
```

### .pipeline-progress.md (Living Plan)

```markdown
## Pipeline Progress

- [x] PM Discovery — completed 2026-02-19
- [x] Brainstorm — completed 2026-02-19
- [ ] Write Plan — in progress
- [ ] Execute Plan
- [ ] Code Review
- [ ] Ship
```

**Resumability:** When `/orchestrate` is invoked in a new session, the orchestrator reads `.pipeline-state.json`, identifies the next uncompleted stage, and resumes from there. State is on disk, not in memory.

---

## Section 3: Judgment Gates

Judgment gates are a skill (`judgment-gates/SKILL.md`) that the orchestrator invokes when a stage produces P1 findings. They are not triggered on every stage transition.

### Severity Classification

| Severity | Triggers Gate? | Examples |
|---|---|---|
| **P1 — Critical** | Yes, blocks pipeline | Missing core requirements, contradictory constraints, security concerns, architecture decisions with irreversible consequences |
| **P2 — Important** | No, logged to review-findings/ | Suboptimal approach detected, minor inconsistencies between artifacts, non-critical gaps |
| **P3 — Informational** | No, logged only | Style suggestions, optional enhancements, things that could be improved later |

### What Happens at a Gate

```
Orchestrator completes a stage
  → Runs verifier agent (sonnet) to check for rationalization/drift
  → Verifier classifies findings as P1/P2/P3
  → P2/P3: logged to docs/pm/review-findings/, pipeline continues
  → P1: invokes judgment-gates skill which:
      1. Generates visual artifacts (HTML) if applicable
      2. Opens them in browser
      3. Builds a structured summary:
         - What was completed
         - Key artifacts produced (with file paths)
         - P1 findings requiring decision
         - P2/P3 findings logged (for awareness)
         - Recommended action
      4. Runs humanizer agent to strip AI verbal tics
      5. Calls AskUserQuestion with options: Approve / Revise / Reject
      6. Persists the decision to docs/pm/decisions/
```

### Decision Record Format

Saved to `docs/pm/decisions/YYYY-MM-DD-<stage>-gate.md`:

```yaml
---
gate: pm-discover
stage: pm-discover
decision: approved
severity: p1
timestamp: 2026-02-19T14:30:00Z
artifacts_reviewed:
  - docs/pm/2026-02-19-scaffolding-platform-personas.md
  - docs/pm/2026-02-19-scaffolding-platform-prd.md
  - docs/pm/2026-02-19-scaffolding-platform-pm-spec.md
verifier_findings:
  p1: 0
  p2: 2
  p3: 1
---

## Decision

Approved all PM artifacts.

## Rationale

Requirements capture the core problem accurately. The 80/20 autonomy
model and judgment gate design align with the fundamental philosophy.

## Revisions Made

None.
```

### Handling Revise and Reject

- **Approve**: Orchestrator updates `.pipeline-state.json` and proceeds to next stage.
- **Revise**: Orchestrator re-dispatches the same stage with the user's feedback appended to the prompt. Revised artifacts overwrite originals (git tracks the diff). Gate runs again after revision.
- **Reject**: Orchestrator marks the stage as failed in `.pipeline-state.json` and stops. User can restart the stage manually or adjust the pipeline config.

### Humanization

Before presenting the summary at a gate, the orchestrator runs it through the humanizer agent (sonnet) to strip AI verbal tics ("I'd be happy to", "Let me", "Great question", hedging, over-qualification). If the humanizer fails, raw output is shown with a warning.

### Visual Artifacts

The judgment-gates skill checks if the stage produced data that can be visualized (journey maps, architecture diagrams, comparison tables). If so, it generates HTML using scripts in `pm-discovery/scripts/` and opens them before presenting the AskUserQuestion.

---

## Section 4: Context Management & Model Routing

### Context Scoping

The orchestrator reads only `consumes` artifacts per stage. No firehose context.

**What each stage sees:**

| Stage | Consumes | Does NOT see |
|---|---|---|
| pm-discover | Project description only | Nothing else exists yet |
| brainstorm | PM spec | Raw research, interview notes |
| write-plan | Design doc | PM spec, raw research |
| execute-plan | Plan doc | Design doc, PM spec |
| code-review | Plan doc + source code | PM spec, design doc |
| ship | Code review results | Everything else |

**Decision summaries:** When a later stage needs context from a prior decision, the orchestrator includes a one-paragraph summary from the decision record, not the full artifact set.

### Research-Before-Ask Pattern

Every agent exhausts automated research before asking the human:

```
1. Read the codebase (Glob, Grep, Read) → Don't ask. Read it.
2. Search docs/pm/learnings/ → Don't ask. Search it.
3. Check available skills → Don't ask. Check them.
4. Web research (WebSearch, WebFetch) → Don't ask. Research it.
5. None of the above answers the question → NOW ask the human.
```

When the system does ask, it asks one question at a time and provides what it already found so the human is validating and refining, not providing discoverable information.

### Model Routing

Static routing based on practitioner data. Sonnet 4.6 is within 1.2 points of Opus on SWE-bench at 1/5th the cost. Opus earns its premium for planning/architecture and sustained complex reasoning.

| Pipeline Stage | Model | Rationale |
|---|---|---|
| **Orchestrator** | Opus | Complex reasoning, pipeline management |
| **PM Discovery** (Phases A-C) | Sonnet | Structured Q&A, web search synthesis |
| **PM Discovery** (Phase D synthesis) | Opus | Cross-referencing many inputs, large context |
| **Brainstorm** | Sonnet | Speed matters for iterative ideation |
| **Write Plan** | Opus | Architecture decisions — Opus's sweet spot per `opusplan` pattern |
| **Execute Plan** | Sonnet | Code generation — 79.6% SWE-bench at 1/5th cost |
| **Code Review** | Sonnet | Deep issue detection |
| **Verifier** | Sonnet | Output quality checking |
| **Humanizer** | Sonnet | Text rewriting |
| **Market Researcher** | Sonnet | Web search + synthesis |
| **Artifact Generator** | Sonnet | Structured document generation |
| **Ship** | Sonnet | Git operations |

**Configuration:**

```json
// .claude/settings.json
{
  "model": "opusplan",
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"
  }
}
```

### Context Budget Management

- Agent descriptions stay under 200 characters. Examples and detailed instructions go in the agent body.
- Reference-only skills that don't need model invocation are marked accordingly.
- Token usage per stage is logged to `.pipeline-log.md` for future analysis.

---

## Section 5: Knowledge Compounding

Built into the core loop from day one. Each project makes the next one easier.

### Capture

After any project completes or after any significant resolution, learnings are captured:

```
docs/pm/learnings/
├── market-patterns/
│   └── 2026-02-19-claude-code-plugin-landscape.md
├── discovery-patterns/
│   └── 2026-02-19-deep-questions-beat-brainstorming.md
├── architecture-patterns/
│   └── 2026-02-19-overlay-fork-strategy.md
└── anti-patterns/
    └── 2026-02-19-shallow-scaffolding-causes-drift.md
```

Each file has YAML frontmatter:

```yaml
---
date: 2026-02-19
project: scaffolding-platform
project_type: claude-code-plugin
category: discovery-patterns
tags: [deep-questions, conversational-extraction, follow-ups]
outcome: success
---

## What Worked
...

## What Didn't Work
...

## Reusable Pattern
...
```

### Retrieval

Before every new project, the orchestrator:

1. Searches `docs/pm/learnings/` by project type and domain tags
2. Includes relevant learnings in the PM discovery agent's context as "past experience"
3. Learnings inform questions but don't constrain answers
4. Contradictory learnings are presented with their project contexts — the human decides

### Protection

`docs/pm/learnings/` and `docs/pm/decisions/` are explicitly protected from cleanup by any review agent. If a code-review or code-simplicity agent suggests deleting these, the finding is discarded.

---

## Section 6: Build Sequence

Orchestrator first so we can dogfood it during development of everything else.

**Phase 1: Foundation (Week 1)**
- Fork superpowers, add `/scaffold` and `/orchestrate` commands
- Create `orchestrator.md` agent definition
- Create `pipeline.yaml` schema and `.pipeline-state.json` tracking
- Implement severity-based gate logic (P1/P2/P3) in judgment-gates skill
- Set up `docs/pm/learnings/` structure with protected artifacts
- Implement living plans with checkbox progress tracking

**Phase 2: Port PM Discovery (Week 2)**
- Move PM discovery skill to `~/.config/superpowers/skills/pm-discovery/`
- Adapt to superpowers skill format (SKILL.md frontmatter conventions)
- Add research-before-ask pattern to all agents
- Add learnings-researcher integration (search past learnings before asking questions)
- Wire up to orchestrator as first pipeline stage

**Phase 3: Judgment Gates + Verification (Week 3)**
- Build judgment-gates skill with P1/P2/P3 classification
- Build verifier agent (sonnet) for anti-rationalization checks
- Build humanizer agent (sonnet) for output cleanup
- Implement decision persistence to `docs/pm/decisions/`
- Wire TeammateIdle and TaskCompleted hooks for quality enforcement

**Phase 4: Context Management (Week 3-4)**
- Implement `consumes`/`produces` scoping in orchestrator
- Configure model routing per agent (Opus/Sonnet per routing table)
- Implement knowledge compounding capture after project completion
- Add context budget enforcement (200-char descriptions, reference skill marking)

**Phase 5: Scaffolding Engine (Week 4)**
- Build scaffolding skill with YAML templates
- Create 4 initial templates: software, claude-code-plugin, course, content
- Implement `--dry-run` preview mode
- Implement `.scaffoldrc` override support

**Phase 6: Integration & Autonomous Mode (Week 5)**
- End-to-end pipeline testing (orchestrator chains all stages)
- Add `--auto` autonomous mode
- Validate upstream merge cleanliness with superpowers
- Capture learnings from the build process itself into `docs/pm/learnings/`

---

## Design Philosophy

Seven principles embedded as architectural constraints:

1. **Judgment before tools** — severity-based gates surface decisions that matter, not rubber-stamp approvals
2. **Know where you end and the tool begins** — explicit human/AI boundaries at P1 gates
3. **Competence breeds confidence** — the system builds user capability; over time, fewer P1 findings
4. **Learn by doing your own work** — dogfood the orchestrator during its own development
5. **Verify before you trust** — anti-rationalization verification at every stage
6. **The frontier is always moving** — modular architecture; new models, plugins, and patterns integrate without rewriting
7. **Amplification, not replacement** — research-before-ask means the human validates and refines, not provides

---

## Key Patterns Incorporated

From Compound Engineering (EveryInc):
- **Research before ask** — exhaust automated research before asking the human
- **Severity-based gates** — P1 blocks, P2/P3 inform; not every transition needs approval
- **Knowledge compounding** — capture after every project, retrieve before every new one
- **Autonomous mode** — `--auto` flag runs full pipeline unattended
- **Living plans** — markdown with checkboxes as the progress tracker
- **Protected artifacts** — learnings and decisions are shielded from cleanup agents
- **Context budget** — agent descriptions under 200 chars, reference skills marked

From Anthropic Best Practices:
- **`opusplan` hybrid** — Opus for planning, Sonnet for execution
- **Native primitives** — Task tool, hooks, AskUserQuestion, model routing per agent
- **Subagents over agent teams** — right primitive for sequential pipelines

From Trail of Bits:
- **Anti-rationalization hooks** — Stop hook runs verifier before presenting output
- **Workflow-skill-design** — skills as the unit of reusable capability

---

## Open Questions (Deferred to Implementation)

1. How to structure the Superpowers fork to minimize merge conflicts in `CLAUDE.md`?
2. Should `pipeline.yaml` support conditional stages (e.g., skip brainstorm if PM spec is thorough)?
3. How to handle learnings retrieval when the knowledge base grows beyond 100 files?
4. Should the verifier run on its own output (recursive verification)?
5. What's the right threshold for auto-suggesting P1→P2 demotion based on pass rate data?

---

## References

- [PM Discovery Artifacts](../pm/) — All approved PM artifacts from discovery phase
- [Consolidated Research](../pm/references/discovery-research-consolidated.md) — Market landscape and competitive analysis
- [Trail of Bits Deep Dive](../pm/references/trailofbits-deep-dive.md) — Plugin patterns and anti-rationalization
- [Architectural Patterns](../pm/references/architectural-patterns.md) — Orchestration, context, and model routing patterns
- [Superpowers](https://github.com/obra/superpowers) — Base plugin being forked
- [Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin) — Knowledge compounding and severity gates patterns
