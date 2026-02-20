# Scaffolding Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the SDLC orchestrator, judgment gates, PM discovery port, scaffolding engine, and context management as a minimal fork of Superpowers + personal skills.

**Architecture:** Thin orchestrator agent using Claude Code's native Task tool, hooks, AskUserQuestion, and model routing. Skills in `~/.claude/skills/`, agents in `~/.claude/agents/`, two new commands in the Superpowers fork. Pipeline config per-project in `docs/pm/pipeline.yaml`.

**Tech Stack:** Claude Code plugin system (SKILL.md, agents/, commands/, hooks/), YAML for pipeline config, Node.js for HTML generation scripts, Bash for hook scripts.

**Key convention note:** Custom skills go in `~/.claude/skills/` (not `~/.config/superpowers/skills/` which is deprecated). Agents go in `~/.claude/agents/`.

---

## Phase 1: Foundation — Fork + Orchestrator + Pipeline Config

### Task 1: Fork Superpowers

**Files:**
- Create: `~/Documents/dev_work/scaffolding-platform/` (new repo, forked from obra/superpowers)

**Step 1: Fork the repo on GitHub**

Run: `gh repo fork obra/superpowers --clone --remote ~/Documents/dev_work/scaffolding-platform`

Expected: Forked repo cloned locally with upstream remote configured.

**Step 2: Verify the fork**

Run: `cd ~/Documents/dev_work/scaffolding-platform && git remote -v`

Expected: `origin` pointing to your fork, `upstream` pointing to `obra/superpowers`.

**Step 3: Create a feature branch**

Run: `git checkout -b feat/sdlc-orchestration`

Expected: New branch created.

**Step 4: Verify existing skills/commands load**

Run: `ls commands/ skills/ agents/`

Expected: Existing superpowers commands (brainstorm.md, write-plan.md, execute-plan.md), skills, and agents visible.

**Step 5: Commit**

No changes to commit yet — just confirming the fork is clean.

---

### Task 2: Create the `/orchestrate` Command

**Files:**
- Create: `commands/orchestrate.md`

**Step 1: Write the command file**

```markdown
---
description: Run the SDLC orchestration pipeline — chains PM discovery, brainstorm, plan, implement, review, and ship with severity-based judgment gates
disable-model-invocation: true
---

Invoke the orchestration skill and follow it exactly as presented to you.

Arguments:
- `--auto`: Run in autonomous mode (no judgment gates, full pipeline unattended)
- Default: severity-gated mode (P1 findings block, P2/P3 logged)
```

**Step 2: Verify the file is valid**

Run: `head -10 commands/orchestrate.md`

Expected: YAML frontmatter with description and disable-model-invocation fields.

**Step 3: Commit**

```bash
git add commands/orchestrate.md
git commit -m "feat: add /orchestrate command definition"
```

---

### Task 3: Create the `/scaffold` Command

**Files:**
- Create: `commands/scaffold.md`

**Step 1: Write the command file**

```markdown
---
description: Generate complete project scaffolding based on project type — creates CLAUDE.md, directory structure, skills, agents, hooks, and config from YAML templates
disable-model-invocation: true
---

Invoke the scaffolding skill and follow it exactly as presented to you.

Arguments:
- First argument: project type (software, claude-code-plugin, course, content)
- Second argument: project name
- `--dry-run`: Preview what would be generated without creating files
- Example: `/scaffold software my-app`
- Example: `/scaffold claude-code-plugin my-plugin --dry-run`
```

**Step 2: Verify the file is valid**

Run: `head -10 commands/scaffold.md`

Expected: YAML frontmatter with description and disable-model-invocation fields.

**Step 3: Commit**

```bash
git add commands/scaffold.md
git commit -m "feat: add /scaffold command definition"
```

---

### Task 4: Create the Orchestrator Agent Definition

**Files:**
- Create: `~/.claude/agents/orchestrator.md`

**Step 1: Create the agents directory if it doesn't exist**

Run: `mkdir -p ~/.claude/agents`

**Step 2: Write the orchestrator agent**

```markdown
---
name: orchestrator
description: |
  SDLC pipeline conductor. Reads pipeline.yaml, dispatches stages sequentially via Task tool, validates outputs, inserts severity-based judgment gates. Use when the user invokes /orchestrate.
  <example>Context: User wants to run the full SDLC pipeline for a new project.
  user: "/orchestrate my-new-project"
  assistant: "Reads pipeline.yaml, identifies current stage, dispatches the appropriate skill/agent, and manages stage transitions with gates."</example>
model: opus
---

You are the SDLC orchestrator. You manage the full software development lifecycle pipeline.

## Your Job

1. Read `docs/pm/pipeline.yaml` for the stage sequence
2. Read `docs/pm/.pipeline-state.json` for current progress (if it exists)
3. Search `docs/pm/learnings/` for relevant past learnings and include in context
4. For each uncompleted stage:
   a. Read only the artifacts listed in `consumes` for that stage (scoped context)
   b. Include relevant decision summaries from `docs/pm/decisions/`
   c. Dispatch the stage via Task tool (for agents) or Skill invocation (for skills)
   d. Validate that all artifacts in `produces` exist and are non-empty
   e. Run verifier agent on output — classify findings as P1/P2/P3
   f. If P1 findings exist: invoke judgment-gates skill
      - Generate visual artifacts if applicable
      - Run humanizer on the summary
      - Present via AskUserQuestion with Approve / Revise / Reject options
      - Persist decision to `docs/pm/decisions/`
   g. If P2/P3 only: log to `docs/pm/review-findings/`, continue automatically
   h. Update `.pipeline-state.json` and `.pipeline-progress.md`
5. If a stage fails: retry once with adjusted prompt, then escalate to judgment gate
6. Log all transitions to `docs/pm/.pipeline-log.md`

## Autonomous Mode (--auto flag)

When the user passes `--auto`:
- Skip all gates
- Log P1 findings to `docs/pm/review-findings/` with REQUIRES_ATTENTION flag
- Run full pipeline end-to-end without stopping
- Human reviews final output, not intermediate artifacts

## Research Before Ask

Before asking the human ANY question:
1. Read the codebase (Glob, Grep, Read)
2. Search `docs/pm/learnings/` for past learnings
3. Check available skills for relevant guidance
4. Run web research (WebSearch, WebFetch) if applicable
5. Only ask the human if none of the above provides the answer

When you do ask, ask one question at a time and share what you already found so the human is validating, not providing discoverable information.

## Pipeline State

Track state in `docs/pm/.pipeline-state.json`:

```json
{
  "pipeline": "Full SDLC",
  "mode": "severity-gated",
  "current_stage": "<stage-id>",
  "completed": ["<stage-ids>"],
  "decisions": [
    {
      "gate": "<stage-id>",
      "decision": "approved|revised|rejected",
      "severity": "p1",
      "timestamp": "<ISO-8601>",
      "file": "docs/pm/decisions/<filename>.md"
    }
  ]
}
```

Track progress in `docs/pm/.pipeline-progress.md`:

```markdown
## Pipeline Progress

- [x] Stage Name — completed YYYY-MM-DD
- [ ] Stage Name — in progress
- [ ] Stage Name
```

## Resumability

When invoked in a new session:
1. Check if `docs/pm/.pipeline-state.json` exists
2. If yes: read it, present a brief status summary, resume from the next uncompleted stage
3. If no: initialize a new pipeline run
```

**Step 3: Verify the file is valid**

Run: `head -20 ~/.claude/agents/orchestrator.md`

Expected: YAML frontmatter with name, description (multiline with example), and model fields.

**Step 4: Commit**

This file is in `~/.claude/agents/` which is outside the repo. No git commit needed — it's a user-level config file.

---

### Task 5: Create the Verifier Agent Definition

**Files:**
- Create: `~/.claude/agents/verifier.md`

**Step 1: Write the verifier agent**

```markdown
---
name: verifier
description: |
  Anti-rationalization checker. Validates agent output against original requirements. Classifies findings as P1 (critical, blocks pipeline), P2 (important, logged), or P3 (informational). Use after any stage produces output.
  <example>Context: A sub-agent just generated a PRD from PM discovery.
  user: "Verify this PRD against the original requirements"
  assistant: "Checks for unaddressed requirements, generic filler, unsupported claims, and classifies each finding by severity."</example>
model: sonnet
---

You are the anti-rationalization verifier. Your job is to check agent output for quality issues.

## What You Check

1. **Unaddressed requirements** — requirements from the input that the output acknowledges but doesn't actually address
2. **Generic filler** — sections containing generic advice or boilerplate rather than project-specific content
3. **Unsupported claims** — assertions in the output that aren't grounded in the input context
4. **Drift from intent** — output that technically addresses requirements but misses the spirit of what was asked
5. **Placeholder text** — any TODO, TBD, [insert here], or similar markers left in the output

## Severity Classification

- **P1 — Critical**: Missing core requirements, contradictory statements, security concerns, architecture decisions with irreversible consequences. These BLOCK the pipeline.
- **P2 — Important**: Suboptimal approach, minor inconsistencies, non-critical gaps. Logged for human review but don't block.
- **P3 — Informational**: Style suggestions, optional enhancements, improvements for later. Logged only.

## Output Format

Return your findings as a structured report:

```yaml
verification:
  stage: "<stage-id>"
  timestamp: "<ISO-8601>"
  findings:
    p1:
      - finding: "<description>"
        requirement: "<which requirement was violated>"
        evidence: "<quote from output showing the issue>"
    p2:
      - finding: "<description>"
    p3:
      - finding: "<description>"
  summary: "<one-paragraph assessment>"
  recommendation: "proceed|gate|retry"
```

## Rules

- Be specific. "The PRD lacks detail" is not a finding. "FR-003 mentions 'visual artifacts' but no artifact format is specified" is.
- Don't flag style issues as P1. Style is P3.
- Don't flag things that are explicitly deferred (Won't Have items, Could Have items).
- Compare against the ACTUAL input requirements, not your general knowledge of what a good output should contain.
```

**Step 2: Verify the file**

Run: `head -20 ~/.claude/agents/verifier.md`

Expected: YAML frontmatter with name, description, model: sonnet.

---

### Task 6: Create the Humanizer Agent Definition

**Files:**
- Create: `~/.claude/agents/humanizer.md`

**Step 1: Write the humanizer agent**

```markdown
---
name: humanizer
description: |
  Strips AI verbal tics and formulaic patterns from human-facing output. Preserves structure, data accuracy, and meaning while making text read like it was written by a direct, competent professional.
  <example>Context: A judgment gate summary needs to be presented to the user.
  user: "Humanize this gate summary before presenting it"
  assistant: "Removes AI crutch phrases, hedging, and over-qualification while preserving all factual content and structure."</example>
model: sonnet
---

You are the humanizer. Your job is to rewrite AI-generated text so it reads like clear, direct professional prose.

## Remove These Patterns

- "I'd be happy to" / "I'd love to help"
- "Certainly!" / "Absolutely!" / "Great question!"
- "Let me think about this step by step"
- "Here's a comprehensive overview"
- "It's worth noting that" / "It's important to note"
- "In order to" (just use "to")
- Excessive hedging: "might", "could potentially", "it seems like"
- Over-qualification: "while there are many approaches, one particularly effective..."
- List-mania: turning everything into bullet points when prose is clearer
- Emoji spam (never add emojis)
- Repetitive summarization: restating what was just said

## Preserve

- All factual content — never remove or distort data
- Document structure — headings, tables, code blocks stay as they are
- Technical terminology — don't simplify domain terms
- File paths and references — exact, unchanged
- Decision options — Approve/Revise/Reject and their descriptions

## Style Target

Write like a direct, senior colleague giving a status update. Short sentences. Active voice. No filler. Say what happened, what matters, and what the person needs to decide.
```

**Step 2: Verify the file**

Run: `head -10 ~/.claude/agents/humanizer.md`

Expected: YAML frontmatter with name, description, model: sonnet.

---

### Task 7: Create the Pipeline YAML Schema and Default Template

**Files:**
- Create: `~/.claude/skills/orchestration/templates/pipeline-default.yaml`

**Step 1: Create the directory structure**

Run: `mkdir -p ~/.claude/skills/orchestration/templates`

**Step 2: Write the default pipeline template**

```yaml
# Default SDLC Pipeline
# This file is copied to docs/pm/pipeline.yaml when a project is scaffolded.
# Modify per-project as needed.

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
        - "docs/pm/*-personas.md"
        - "docs/pm/*-journey-map.md"
        - "docs/pm/*-user-stories.md"
        - "docs/pm/*-feature-stories.md"
        - "docs/pm/*-prd.md"
        - "docs/pm/*-pm-spec.md"

    - id: brainstorm
      type: skill
      skill: superpowers:brainstorming
      model: opus
      gate: p1
      gate_prompt: "Review the design document"
      consumes:
        - "docs/pm/*-pm-spec.md"
      produces:
        - "docs/plans/*-design.md"

    - id: write-plan
      type: skill
      skill: superpowers:writing-plans
      model: opus
      gate: p1
      gate_prompt: "Review the implementation plan"
      consumes:
        - "docs/plans/*-design.md"
      produces:
        - "docs/plans/*-plan.md"

    - id: execute-plan
      type: skill
      skill: superpowers:executing-plans
      model: sonnet
      gate: none
      consumes:
        - "docs/plans/*-plan.md"
      produces:
        - "src/**"

    - id: code-review
      type: skill
      skill: superpowers:requesting-code-review
      model: sonnet
      gate: p1
      gate_prompt: "Review code quality findings"
      consumes:
        - "src/**"
        - "docs/plans/*-plan.md"

    - id: ship
      type: skill
      skill: superpowers:finishing-a-development-branch
      model: sonnet
      gate: none
```

**Step 3: Verify the file parses as valid YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('$HOME/.claude/skills/orchestration/templates/pipeline-default.yaml'))" && echo "Valid YAML"`

Expected: "Valid YAML"

**Step 4: Commit**

User-level file, outside repo. No commit needed.

---

### Task 8: Create the Orchestration Skill (SKILL.md)

**Files:**
- Create: `~/.claude/skills/orchestration/SKILL.md`

**Step 1: Write the orchestration skill**

```markdown
---
name: orchestration
description: "SDLC pipeline orchestration — chains PM discovery, brainstorm, plan, implement, review, and ship stages with severity-based judgment gates and context scoping."
---

# SDLC Orchestration

## Overview

Manage the full software development lifecycle as a staged pipeline. Each stage dispatches a specific skill or agent, validates output, and either proceeds automatically (P2/P3 findings) or triggers a judgment gate (P1 findings).

## Prerequisites

Before starting orchestration, verify:
1. The project has a `docs/pm/pipeline.yaml` file defining the stage sequence
2. If no `pipeline.yaml` exists, copy the default from `~/.claude/skills/orchestration/templates/pipeline-default.yaml`
3. Create `docs/pm/` directory if it doesn't exist

## Process

### Step 1: Initialize Pipeline State

If `docs/pm/.pipeline-state.json` does not exist, create it:

```json
{
  "pipeline": "<name from pipeline.yaml>",
  "mode": "severity-gated",
  "current_stage": "<first stage id>",
  "completed": [],
  "decisions": []
}
```

Create `docs/pm/.pipeline-progress.md` with all stages as unchecked checkboxes.

If `.pipeline-state.json` already exists, read it and present a brief status summary:
- Stages completed
- Current stage
- Past decisions (one-line summaries)
- Then resume from the next uncompleted stage.

### Step 2: Execute Each Stage

For each uncompleted stage in the pipeline:

1. **Assemble scoped context**: Read only the files matching the `consumes` glob patterns for this stage. Include one-paragraph summaries of relevant past decisions from `docs/pm/decisions/`. Search `docs/pm/learnings/` for applicable past learnings.

2. **Dispatch the stage**:
   - If `type: skill` → invoke the named skill with the scoped context
   - If `type: agent` → use the Task tool to dispatch the named agent with the scoped context

3. **Validate output**: Check that all files matching the `produces` glob patterns exist and are non-empty.

4. **Run verification**: Dispatch the verifier agent against the output. The verifier classifies findings as P1/P2/P3.

5. **Gate decision**:
   - If `gate: none` → proceed to next stage
   - If `gate: p1` and no P1 findings → log P2/P3 to `docs/pm/review-findings/`, proceed
   - If `gate: p1` and P1 findings exist → trigger judgment gate (see Step 3)
   - If `gate: always` → always trigger judgment gate regardless of findings

6. **Update state**: Mark stage as completed in `.pipeline-state.json` and check it off in `.pipeline-progress.md`.

### Step 3: Judgment Gate (When Triggered)

1. Collect all produced artifacts and verifier findings
2. Generate visual artifacts (HTML) if the stage produced visualizable data
3. Open HTML artifacts in the browser
4. Run the humanizer agent on the summary text
5. Present to the user via AskUserQuestion:
   - What was completed (files produced)
   - P1 findings requiring decision
   - P2/P3 findings (for awareness, already logged)
   - Recommended action
   - Options: **Approve** / **Revise** / **Reject**
6. Record the decision in `docs/pm/decisions/YYYY-MM-DD-<stage-id>-gate.md`

**If Approved**: Continue to next stage.
**If Revise**: Re-dispatch the same stage with user's feedback appended to the prompt. Run gate again after revision.
**If Reject**: Mark stage as failed, stop pipeline. User can restart manually.

### Step 4: Pipeline Complete

When all stages are completed:
1. Update `.pipeline-state.json` with final status
2. Mark all stages as checked in `.pipeline-progress.md`
3. Present a summary of the full pipeline run: stages completed, decisions made, total time
4. Trigger knowledge compounding: ask if any learnings should be captured to `docs/pm/learnings/`

## Autonomous Mode

When invoked with `--auto`:
- Set mode to "autonomous" in `.pipeline-state.json`
- Skip ALL gates — never call AskUserQuestion
- P1 findings are logged to `docs/pm/review-findings/` with `REQUIRES_ATTENTION: true` in frontmatter
- Run full pipeline end-to-end
- Present final summary at the end with all logged findings

## Key Principles

- **Research before ask**: Exhaust automated research before asking the human anything
- **Scoped context**: Each stage gets only what it needs, not the full project history
- **Severity-based gates**: P1 blocks, P2/P3 inform. The pipeline keeps moving unless something critical is wrong.
- **State on disk**: Pipeline state is derived from `.pipeline-state.json` and artifact existence. Resumable across sessions.
- **Knowledge compounding**: Search past learnings before every stage. Capture new learnings after every project.
```

**Step 2: Verify the file**

Run: `head -5 ~/.claude/skills/orchestration/SKILL.md`

Expected: YAML frontmatter with `name: orchestration` and description.

---

### Task 9: Create the Judgment Gates Skill

**Files:**
- Create: `~/.claude/skills/judgment-gates/SKILL.md`
- Create: `~/.claude/skills/judgment-gates/templates/decision-record.md`

**Step 1: Create the directory structure**

Run: `mkdir -p ~/.claude/skills/judgment-gates/templates`

**Step 2: Write the judgment gates skill**

```markdown
---
name: judgment-gates
description: "Severity-based decision gates for the SDLC pipeline — presents visual artifacts, humanized summaries, and structured decision prompts at P1 findings."
---

# Judgment Gates

## Overview

Present the human with decision-support information at critical pipeline moments. Gates trigger when the verifier finds P1 (critical) issues, or when a stage is configured with `gate: always`.

## Gate Presentation

When a judgment gate is triggered:

### 1. Collect Context

- Read all artifacts produced by the stage (`produces` from pipeline.yaml)
- Read the verifier's findings report
- Read relevant past decisions from `docs/pm/decisions/` (if this stage relates to prior decisions)

### 2. Generate Visual Artifacts (If Applicable)

Check if the stage produced data suitable for visualization:
- Journey maps → generate HTML experience maps
- Architecture diagrams → generate Mermaid diagrams
- Comparison tables → generate HTML comparison view
- Metric dashboards → generate HTML dashboard

If visual artifacts are generated, save them to `docs/pm/` and open in the browser.

### 3. Build the Summary

Structure:

```
## Gate: [Stage Name]

### Completed
[1-3 sentences on what this stage produced. List file paths.]

### Findings
[P1 findings — these require your decision]
[P2/P3 findings — logged for your awareness, not blocking]

### Recommendation
[What the system recommends and why, in 1-2 sentences]
```

### 4. Humanize

Run the summary through the humanizer agent before presenting. If the humanizer fails, present raw text with a note that humanization was skipped.

### 5. Present Decision

Use AskUserQuestion with exactly three options:
- **Approve** — Accept the output and proceed to the next stage
- **Revise** — Provide feedback; the stage will re-run with your input
- **Reject** — Stop the pipeline at this stage

### 6. Persist Decision

Save to `docs/pm/decisions/YYYY-MM-DD-<stage-id>-gate.md` using the decision record template.

## Decision Record Fields

- `gate`: stage ID
- `decision`: approved / revised / rejected
- `severity`: p1 (always, since only P1 triggers gates)
- `timestamp`: ISO-8601
- `artifacts_reviewed`: list of file paths
- `verifier_findings`: count of P1/P2/P3
- `rationale`: user's stated reason (from AskUserQuestion follow-up or default)
- `revisions_made`: description of changes if revised

## Related Past Decisions

When preparing a gate, search `docs/pm/decisions/` for decisions related to the current stage's topic. If found, include a "Related Past Decisions" section in the summary so the human can maintain consistency or consciously deviate.
```

**Step 3: Write the decision record template**

```markdown
---
gate: {{stage_id}}
stage: {{stage_id}}
decision: {{decision}}
severity: p1
timestamp: {{timestamp}}
artifacts_reviewed: {{artifacts}}
verifier_findings:
  p1: {{p1_count}}
  p2: {{p2_count}}
  p3: {{p3_count}}
---

## Decision

{{decision_summary}}

## Rationale

{{rationale}}

## Revisions Made

{{revisions}}
```

**Step 4: Verify files**

Run: `head -5 ~/.claude/skills/judgment-gates/SKILL.md`

Expected: YAML frontmatter with name and description.

---

### Task 10: Create the Knowledge Compounding Directory Structure

**Files:**
- Create: `~/.claude/skills/orchestration/templates/learnings-template.md`

**Step 1: Write the learnings template**

```markdown
---
date: {{date}}
project: {{project}}
project_type: {{project_type}}
category: {{category}}
tags: {{tags}}
outcome: {{outcome}}
---

## What Worked

{{what_worked}}

## What Didn't Work

{{what_didnt_work}}

## Reusable Pattern

{{reusable_pattern}}
```

**Step 2: Verify the file**

Run: `ls ~/.claude/skills/orchestration/templates/`

Expected: `pipeline-default.yaml` and `learnings-template.md` both present.

---

### Task 11: Update Superpowers Fork CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` in the superpowers fork

**Step 1: Add orchestration context to the fork's CLAUDE.md**

Append the following section at the end of the existing CLAUDE.md (do not replace existing content):

```markdown
## SDLC Orchestration Extension

This fork adds SDLC orchestration with severity-based judgment gates on top of Superpowers.

### Added Commands
- `/orchestrate` — Run the full SDLC pipeline (PM discovery → brainstorm → plan → implement → review → ship)
- `/scaffold` — Generate project scaffolding from YAML templates

### Added Skills (in ~/.claude/skills/)
- `orchestration` — Pipeline management, stage dispatch, gate logic
- `judgment-gates` — Decision presentation, visual artifacts, decision persistence
- `pm-discovery` — 6-phase PM discovery workflow (ported from pm-artifacts plugin)
- `scaffolding` — Project type templates and generation engine
- `context-management` — Context scoping and model routing rules

### Added Agents (in ~/.claude/agents/)
- `orchestrator` (opus) — Pipeline conductor
- `verifier` (sonnet) — Anti-rationalization checker, P1/P2/P3 classification
- `humanizer` (sonnet) — Strips AI patterns from human-facing output
- `market-researcher` (sonnet) — Web research for PM discovery Phase B
- `artifact-generator` (sonnet) — PM artifact generation

### Pipeline Configuration
Each project defines its pipeline in `docs/pm/pipeline.yaml`. The orchestrator reads this file to determine stage sequence, gate severity levels, and artifact dependencies.

### Design Philosophy
1. Judgment before tools — severity gates surface decisions that matter
2. Research before ask — exhaust automated research before asking the human
3. Verify before trust — anti-rationalization verification at every stage
4. Amplification not replacement — the human validates and refines, not provides
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add SDLC orchestration context to CLAUDE.md"
```

---

### Task 12: Test the Foundation End-to-End

**Step 1: Verify agents are discoverable**

Run: `ls ~/.claude/agents/`

Expected: `orchestrator.md`, `verifier.md`, `humanizer.md` all present.

**Step 2: Verify skills are discoverable**

Run: `ls ~/.claude/skills/`

Expected: `orchestration/` and `judgment-gates/` directories present with SKILL.md files.

**Step 3: Verify commands are present in the fork**

Run: `ls commands/`

Expected: `orchestrate.md` and `scaffold.md` alongside existing superpowers commands.

**Step 4: Verify pipeline template is valid YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('$HOME/.claude/skills/orchestration/templates/pipeline-default.yaml'))" && echo "Valid"`

Expected: "Valid"

**Step 5: Commit any final changes**

```bash
git add -A && git commit -m "feat: foundation complete — orchestrator, verifier, humanizer, pipeline config"
```

---

## Phase 2: Port PM Discovery

### Task 13: Create PM Discovery Skill in Personal Skills

**Files:**
- Create: `~/.claude/skills/pm-discovery/SKILL.md`
- Copy: templates from this repo's `templates/` directory
- Copy: scripts from this repo's `scripts/` directory

**Step 1: Create the directory structure**

Run: `mkdir -p ~/.claude/skills/pm-discovery/{templates,scripts,references}`

**Step 2: Copy the existing SKILL.md**

Read the current SKILL.md from `skills/pm-discovery/SKILL.md` in this repo and adapt it for the new location. Key changes:
- Update the frontmatter to match superpowers convention (`name` and `description` only)
- Add the research-before-ask pattern to all phases
- Add learnings search at the start of Phase A
- Keep the 6-phase structure intact

The SKILL.md content should be the existing pm-discovery skill with these additions at the top of Phase A:

```markdown
## Before Starting Discovery

1. Search `docs/pm/learnings/` for learnings from past projects matching this project type
2. If learnings exist, include them as "Past Experience" context for the user
3. Present relevant learnings when asking questions: "Based on a previous project, [learning]. Does this apply here?"
```

And this rule added to the question-asking instructions:

```markdown
## Research Before Ask

Before asking the user any question:
1. Check if the answer exists in the codebase (Glob, Grep, Read)
2. Check if past learnings answer it (search docs/pm/learnings/)
3. Check if web research can answer it (WebSearch, WebFetch)
4. Only ask the human if none of the above provides the answer

When you do ask, share what you already found so the human is validating, not providing.
```

**Step 3: Copy templates**

Run: `cp /Users/milindbhat/Documents/dev_work/pm_artifacts_generator/pm_artifact_gen/templates/* ~/.claude/skills/pm-discovery/templates/`

**Step 4: Copy scripts**

Run: `cp /Users/milindbhat/Documents/dev_work/pm_artifacts_generator/pm_artifact_gen/scripts/* ~/.claude/skills/pm-discovery/scripts/`

**Step 5: Verify the skill structure**

Run: `ls -R ~/.claude/skills/pm-discovery/`

Expected: SKILL.md, templates/ with template files, scripts/ with generation scripts.

---

### Task 14: Create Market Researcher Agent

**Files:**
- Create: `~/.claude/agents/market-researcher.md`

**Step 1: Read the existing agent definition from this repo**

Read: `agents/` directory in this repo for the existing market-researcher definition.

**Step 2: Write the agent in the user-level directory**

Adapt the existing market-researcher agent with these changes:
- Use superpowers agent frontmatter format (name, description with example, model)
- Set `model: sonnet`
- Add the research-before-ask principle
- Keep the WebSearch/WebFetch research methodology

**Step 3: Verify**

Run: `head -10 ~/.claude/agents/market-researcher.md`

Expected: Valid YAML frontmatter.

---

### Task 15: Create Artifact Generator Agent

**Files:**
- Create: `~/.claude/agents/artifact-generator.md`

**Step 1: Read the existing agent definition from this repo**

Read: `agents/artifact-generator.md` in this repo.

**Step 2: Write the agent in the user-level directory**

Adapt with:
- Superpowers agent frontmatter format
- Set `model: sonnet`
- Reference templates in `~/.claude/skills/pm-discovery/templates/`
- Reference scripts in `~/.claude/skills/pm-discovery/scripts/`

**Step 3: Verify**

Run: `head -10 ~/.claude/agents/artifact-generator.md`

Expected: Valid YAML frontmatter.

---

### Task 16: Test PM Discovery Port

**Step 1: Start a new Claude Code session in a test project**

Run: `mkdir -p /tmp/test-pm-discovery && cd /tmp/test-pm-discovery && claude`

**Step 2: Verify the pm-discovery skill is available**

In Claude Code, check that the skill can be invoked. The skill should appear in the available skills list.

**Step 3: Test a quick Phase A run**

Invoke the pm-discovery skill and verify it asks structured questions about the problem, searches for learnings first, and produces artifacts in `docs/pm/`.

**Step 4: Clean up**

Run: `rm -rf /tmp/test-pm-discovery`

---

## Phase 3: Judgment Gates + Verification

### Task 17: Create Hook Configuration for Verification

**Files:**
- Modify: `~/.claude/settings.json` (or project-level `.claude/settings.json`)

**Step 1: Read current settings**

Run: `cat ~/.claude/settings.json`

**Step 2: Add hook configuration**

Add the following hooks (merge with existing settings, don't replace):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "agent",
            "prompt": "Check if the last response contains any claims that aren't grounded in the conversation context. If you find unsupported claims, flag them. Keep your response under 100 words.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Note: This is a lightweight verification hook. The full P1/P2/P3 verification runs as part of the orchestrator's stage dispatch, not as a global hook. The global hook catches obvious issues in any session.

**Step 3: Verify settings are valid JSON**

Run: `python3 -c "import json; json.load(open('$HOME/.claude/settings.json'))" && echo "Valid"`

Expected: "Valid"

---

### Task 18: Test Judgment Gate Flow

**Step 1: Create a test pipeline state**

Create a temporary project with a `.pipeline-state.json` that has one completed stage and one pending stage. Create a mock artifact with an intentional P1 issue.

**Step 2: Invoke the orchestrator**

Test that:
- The orchestrator reads the pipeline state
- It dispatches the verifier on the mock artifact
- The verifier correctly identifies the P1 issue
- A judgment gate is presented via AskUserQuestion
- The decision is persisted to `docs/pm/decisions/`

**Step 3: Test P2/P3 passthrough**

Create a mock artifact with only P2/P3 issues. Verify the pipeline continues without stopping, and findings are logged to `docs/pm/review-findings/`.

---

## Phase 4: Context Management

### Task 19: Create Context Management Skill

**Files:**
- Create: `~/.claude/skills/context-management/SKILL.md`
- Create: `~/.claude/skills/context-management/model-routing.yaml`

**Step 1: Create directory**

Run: `mkdir -p ~/.claude/skills/context-management`

**Step 2: Write the skill**

```markdown
---
name: context-management
description: "Context scoping rules and model routing configuration for the SDLC orchestrator — determines what context each stage receives and which model handles each task type."
---

# Context Management

## Context Scoping

Each pipeline stage receives only the artifacts listed in its `consumes` field from `pipeline.yaml`. The orchestrator assembles scoped context by:

1. Globbing the `consumes` patterns to find matching files
2. Reading those files
3. Adding one-paragraph decision summaries from `docs/pm/decisions/` (only decisions relevant to this stage's topic)
4. Adding relevant learnings from `docs/pm/learnings/` (matched by project type and tags)
5. NOT including artifacts from other stages

### Token Budget

Target: each stage's assembled context should be under 20,000 tokens. If it exceeds this:
- Summarize decision records instead of including full text
- Include only the "For AI Agents" YAML section of PM artifacts, not the full human-readable content
- Prioritize the most recent and most relevant artifacts

## Model Routing

Static routing per pipeline stage and agent. Configured in the orchestrator agent definition and pipeline.yaml `model` fields.

| Role | Model | Rationale |
|---|---|---|
| Orchestrator | Opus | Complex reasoning, pipeline management |
| PM Discovery (research phases) | Sonnet | Structured Q&A, web search synthesis |
| PM Discovery (synthesis) | Opus | Cross-referencing many inputs |
| Brainstorm | Sonnet | Speed for iterative ideation |
| Write Plan | Opus | Architecture decisions |
| Execute Plan | Sonnet | Code generation |
| Code Review | Sonnet | Deep issue detection |
| Verifier | Sonnet | Output quality checking |
| Humanizer | Sonnet | Text rewriting |
| Market Researcher | Sonnet | Web search + synthesis |
| Artifact Generator | Sonnet | Structured document generation |

No dynamic routing. If a stage needs a different model, change the `model` field in `pipeline.yaml` for that project.

## Token Logging

The orchestrator logs approximate token usage per stage to `docs/pm/.pipeline-log.md`:

```markdown
## Pipeline Log

| Stage | Model | Approx Tokens | Duration | Findings |
|---|---|---|---|---|
| pm-discover | opus | ~45,000 | 12 min | 0 P1, 2 P2 |
| brainstorm | sonnet | ~22,000 | 8 min | 0 P1, 1 P3 |
```

This data informs future model routing decisions after 5-10 projects.
```

**Step 3: Write the model routing config**

```yaml
# Model routing reference — not executed, read by orchestrator for guidance
routing:
  orchestrator: opus
  pm-discovery-research: sonnet
  pm-discovery-synthesis: opus
  brainstorming: sonnet
  writing-plans: opus
  executing-plans: sonnet
  code-review: sonnet
  verifier: sonnet
  humanizer: sonnet
  market-researcher: sonnet
  artifact-generator: sonnet
  ship: sonnet
```

**Step 4: Verify files**

Run: `ls ~/.claude/skills/context-management/`

Expected: SKILL.md, model-routing.yaml.

---

## Phase 5: Scaffolding Engine

### Task 20: Create Scaffolding Skill

**Files:**
- Create: `~/.claude/skills/scaffolding/SKILL.md`
- Create: `~/.claude/skills/scaffolding/templates/software.yaml`
- Create: `~/.claude/skills/scaffolding/templates/claude-code-plugin.yaml`
- Create: `~/.claude/skills/scaffolding/templates/course.yaml`
- Create: `~/.claude/skills/scaffolding/templates/content.yaml`

**Step 1: Create directory structure**

Run: `mkdir -p ~/.claude/skills/scaffolding/templates`

**Step 2: Write the scaffolding skill**

```markdown
---
name: scaffolding
description: "Generate complete project scaffolding from YAML templates — creates CLAUDE.md, directory structure, skills, agents, hooks, and pipeline config based on project type."
---

# Project Scaffolding

## Overview

Generate a complete, opinionated project structure from a project type template. Supports software, claude-code-plugin, course, and content project types. Templates are YAML files in `~/.claude/skills/scaffolding/templates/`.

## Usage

`/scaffold <project-type> <project-name> [--dry-run]`

## Process

### Step 1: Determine Project Type

If a project type is provided, load the matching template from `~/.claude/skills/scaffolding/templates/<type>.yaml`.

If no type is provided, analyze the current directory for clues:
- `package.json` or `requirements.txt` → software
- `.claude-plugin/` → claude-code-plugin
- `curriculum/` or `modules/` → course
- If ambiguous, ask the user (one question, with the detected type as the recommended option)

If the type doesn't match any template, generate generic scaffolding based on the closest match and flag which parts are generic.

### Step 2: Dry Run (if --dry-run)

Display a tree view of all directories and files that would be created, with summaries of key file contents. Do NOT create any files.

Ask: "Generate this structure? (yes/no)"

If yes, proceed to Step 3. If no, stop.

### Step 3: Generate Structure

For each entry in the template:
1. Create directories listed in `directories`
2. Create files listed in `files` with template content
3. Substitute `{{project_name}}` and `{{project_description}}` placeholders
4. Copy `docs/pm/pipeline.yaml` from `~/.claude/skills/orchestration/templates/pipeline-default.yaml`
5. Create `docs/pm/learnings/` directory structure

### Step 4: Install Dependencies (if applicable)

If the template specifies dependencies:
- Node.js: run `npm init -y && npm install <packages>`
- Python: create `requirements.txt` with listed packages

Ask before installing: "Install dependencies now? (yes/skip)"

### Step 5: Initialize Git (if not already a repo)

If the directory is not already a git repo:
- `git init`
- Create `.gitignore` appropriate to the project type
- `git add -A && git commit -m "feat: initial project scaffolding"`

### Step 6: Summary

Present what was created: directory count, file count, key files. Remind the user of next steps:
- "Run `/pm-discover` to start product discovery"
- "Or run `/orchestrate` to start the full SDLC pipeline"
```

**Step 3: Write the software template**

```yaml
name: software
description: "General software development project"
directories:
  - src/
  - tests/
  - docs/
  - docs/pm/
  - docs/pm/learnings/
  - docs/pm/learnings/market-patterns/
  - docs/pm/learnings/discovery-patterns/
  - docs/pm/learnings/architecture-patterns/
  - docs/pm/learnings/anti-patterns/
  - docs/pm/decisions/
  - docs/pm/review-findings/
  - docs/plans/
  - .claude/

files:
  CLAUDE.md: |
    # {{project_name}}

    ## What This Is

    {{project_description}}

    ## Directory Structure

    ```
    {{project_name}}/
    ├── src/          # Source code
    ├── tests/        # Test suite
    ├── docs/         # Documentation
    │   ├── pm/       # PM artifacts and pipeline state
    │   └── plans/    # Design docs and implementation plans
    └── .claude/      # Claude Code project config
    ```

    ## Development Workflow

    This project uses the SDLC orchestration pipeline:
    1. `/pm-discover` — structured product discovery
    2. `/brainstorm` — design exploration
    3. `/write-plan` — implementation planning
    4. `/orchestrate` — run the full pipeline with severity-based gates

  .gitignore: |
    node_modules/
    .env
    *.log
    dist/
    coverage/

dependencies:
  node: []
  python: []
```

**Step 4: Write the claude-code-plugin template**

```yaml
name: claude-code-plugin
description: "Claude Code plugin with skills, commands, agents, and hooks"
directories:
  - .claude-plugin/
  - skills/
  - commands/
  - agents/
  - hooks/
  - templates/
  - scripts/
  - docs/
  - docs/pm/
  - docs/pm/learnings/
  - docs/pm/learnings/market-patterns/
  - docs/pm/learnings/discovery-patterns/
  - docs/pm/learnings/architecture-patterns/
  - docs/pm/learnings/anti-patterns/
  - docs/pm/decisions/
  - docs/pm/review-findings/
  - docs/plans/
  - tests/

files:
  CLAUDE.md: |
    # {{project_name}}

    ## What This Is

    A Claude Code plugin. {{project_description}}

    ## Directory Structure

    ```
    {{project_name}}/
    ├── .claude-plugin/   # Plugin manifest
    ├── skills/           # Skill definitions (SKILL.md files)
    ├── commands/         # Slash commands
    ├── agents/           # Subagent definitions
    ├── hooks/            # Lifecycle hooks
    ├── templates/        # Artifact templates
    ├── scripts/          # Generation scripts
    ├── docs/             # Documentation and PM artifacts
    └── tests/            # Test suite
    ```

    ## Development Workflow

    This project uses the SDLC orchestration pipeline.
    Run `/orchestrate` to start the full pipeline.

  .claude-plugin/plugin.json: |
    {
      "name": "{{project_name}}",
      "description": "{{project_description}}",
      "version": "0.1.0",
      "author": {
        "name": "Milind"
      },
      "license": "MIT"
    }

  .gitignore: |
    node_modules/
    .env
    *.log
    dist/

dependencies:
  node: []
```

**Step 5: Write the course template**

```yaml
name: course
description: "Course or educational content project"
directories:
  - curriculum/
  - modules/
  - exercises/
  - assessments/
  - resources/
  - docs/
  - docs/pm/
  - docs/pm/learnings/
  - docs/pm/decisions/
  - docs/pm/review-findings/
  - docs/plans/

files:
  CLAUDE.md: |
    # {{project_name}}

    ## What This Is

    A course project. {{project_description}}

    ## Directory Structure

    ```
    {{project_name}}/
    ├── curriculum/     # Course outline and learning objectives
    ├── modules/        # Individual course modules
    ├── exercises/      # Hands-on exercises
    ├── assessments/    # Quizzes, tests, projects
    ├── resources/      # Supporting materials
    └── docs/           # Documentation and PM artifacts
    ```

  .gitignore: |
    .env
    *.log
    .DS_Store

dependencies:
  node: []
  python: []
```

**Step 6: Write the content template**

```yaml
name: content
description: "Content writing project (articles, docs, marketing)"
directories:
  - drafts/
  - published/
  - research/
  - assets/
  - docs/
  - docs/pm/
  - docs/pm/learnings/
  - docs/pm/decisions/
  - docs/pm/review-findings/
  - docs/plans/

files:
  CLAUDE.md: |
    # {{project_name}}

    ## What This Is

    A content project. {{project_description}}

    ## Directory Structure

    ```
    {{project_name}}/
    ├── drafts/       # Work in progress
    ├── published/    # Final versions
    ├── research/     # Research notes and sources
    ├── assets/       # Images, diagrams, media
    └── docs/         # Documentation and PM artifacts
    ```

  .gitignore: |
    .env
    *.log
    .DS_Store

dependencies:
  node: []
  python: []
```

**Step 7: Verify all templates are valid YAML**

Run: `for f in ~/.claude/skills/scaffolding/templates/*.yaml; do python3 -c "import yaml; yaml.safe_load(open('$f'))" && echo "$f: Valid"; done`

Expected: All four templates report "Valid".

---

## Phase 6: Integration & Autonomous Mode

### Task 21: End-to-End Pipeline Test

**Step 1: Create a test project using scaffolding**

Run: `mkdir -p /tmp/test-e2e && cd /tmp/test-e2e`

Invoke `/scaffold software test-app` and verify:
- Directory structure is created
- CLAUDE.md is populated with project-specific content
- `docs/pm/pipeline.yaml` exists (copied from default template)
- `docs/pm/learnings/` directory structure exists
- Git repo is initialized

**Step 2: Run orchestrator on the test project**

Invoke `/orchestrate` and verify:
- Pipeline state is initialized
- First stage (pm-discover) is dispatched
- Verifier runs on output
- Gate triggers or passes based on severity
- State is updated after each stage

**Step 3: Test autonomous mode**

Invoke `/orchestrate --auto` and verify:
- Pipeline runs without stopping
- All findings are logged to `docs/pm/review-findings/`
- P1 findings have `REQUIRES_ATTENTION` flag
- Final summary is presented

**Step 4: Test resumability**

Close the session. Start a new one. Invoke `/orchestrate` and verify:
- Pipeline state is read from disk
- Status summary is presented
- Pipeline resumes from the correct stage

**Step 5: Clean up**

Run: `rm -rf /tmp/test-e2e`

---

### Task 22: Knowledge Compounding Test

**Step 1: Complete a test project through the pipeline**

After the e2e test, verify that the orchestrator prompts for knowledge capture.

**Step 2: Add a test learning**

Create a learning file in `docs/pm/learnings/discovery-patterns/`:

```yaml
---
date: 2026-02-20
project: test-app
project_type: software
category: discovery-patterns
tags: [testing, e2e, pipeline]
outcome: success
---

## What Worked

Running the full pipeline end-to-end on a scaffolded project validates
all stage transitions and gate logic in one pass.

## Reusable Pattern

Always scaffold a test project before testing pipeline changes.
```

**Step 3: Start a new project and verify retrieval**

Scaffold a second test project. Run `/pm-discover` and verify that the learning from Step 2 is surfaced in the discovery context.

---

### Task 23: Upstream Merge Test

**Step 1: Verify merge cleanliness**

In the superpowers fork:

Run: `git fetch upstream && git merge upstream/main --no-commit --no-ff`

Expected: Conflicts only in CLAUDE.md (intentionally modified). All new files (commands/orchestrate.md, commands/scaffold.md) merge cleanly because they're additions, not modifications.

**Step 2: Abort the test merge**

Run: `git merge --abort`

---

### Task 24: Final Commit and Documentation

**Step 1: Verify all files are in place**

Run a checklist:
- [ ] `~/.claude/agents/orchestrator.md`
- [ ] `~/.claude/agents/verifier.md`
- [ ] `~/.claude/agents/humanizer.md`
- [ ] `~/.claude/agents/market-researcher.md`
- [ ] `~/.claude/agents/artifact-generator.md`
- [ ] `~/.claude/skills/orchestration/SKILL.md`
- [ ] `~/.claude/skills/orchestration/templates/pipeline-default.yaml`
- [ ] `~/.claude/skills/orchestration/templates/learnings-template.md`
- [ ] `~/.claude/skills/judgment-gates/SKILL.md`
- [ ] `~/.claude/skills/judgment-gates/templates/decision-record.md`
- [ ] `~/.claude/skills/context-management/SKILL.md`
- [ ] `~/.claude/skills/context-management/model-routing.yaml`
- [ ] `~/.claude/skills/pm-discovery/SKILL.md`
- [ ] `~/.claude/skills/pm-discovery/templates/*`
- [ ] `~/.claude/skills/pm-discovery/scripts/*`
- [ ] `~/.claude/skills/scaffolding/SKILL.md`
- [ ] `~/.claude/skills/scaffolding/templates/software.yaml`
- [ ] `~/.claude/skills/scaffolding/templates/claude-code-plugin.yaml`
- [ ] `~/.claude/skills/scaffolding/templates/course.yaml`
- [ ] `~/.claude/skills/scaffolding/templates/content.yaml`
- [ ] Fork: `commands/orchestrate.md`
- [ ] Fork: `commands/scaffold.md`
- [ ] Fork: `CLAUDE.md` updated

**Step 2: Commit the fork changes**

```bash
git add -A
git commit -m "feat: complete SDLC orchestration platform — orchestrator, gates, scaffolding, PM discovery, context management"
```

**Step 3: Capture learnings**

Create a learning file from this build process in `docs/pm/learnings/architecture-patterns/`:

```yaml
---
date: 2026-02-20
project: scaffolding-platform
project_type: claude-code-plugin
category: architecture-patterns
tags: [overlay-fork, native-primitives, severity-gates, compound-engineering]
outcome: success
---

## What Worked

Using Claude Code native primitives (Task tool, hooks, AskUserQuestion, model routing)
instead of building custom infrastructure. The orchestrator is thin — mostly configuration
and domain logic.

## Reusable Pattern

For Claude Code plugin projects: overlay approach (additive files, minimal core modifications)
keeps upstream merges clean. Severity-based gates (P1/P2/P3) prevent gate fatigue while
still catching critical issues.
```
