---
name: research
description: Use when starting deep technical research before planning, when needing to understand a new codebase area, or when the user invokes /hyperpowers:research
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Task, Write
---

# Research Skill

**Announce at start:** "I'm using the research skill to conduct deep technical research before planning."

## Overview

Deep research that surfaces issues before they become bugs. Dispatches 8 parallel agents to analyze codebase, git history, framework docs, best practices, test coverage, error handling, dependencies, and architecture boundaries, then synthesizes findings into a persistent research document.

## When to Use

Use this skill when:
- Starting work on a new feature area
- Planning requires understanding unfamiliar code
- User explicitly invokes `/hyperpowers:research`
- Writing-plans skill suggests research first

Do NOT use when:
- Making a quick fix to familiar code
- Research already exists in `docs/research/`

## CRITICAL REQUIREMENTS

This skill has two non-negotiable requirements. Violation = skill failure.

1. **ALL 8 AGENTS MUST BE DISPATCHED** - No exceptions. Partial dispatch is failure.
2. **SYNTHESIS IS COMPULSORY** - Raw agent outputs are not valid research.

If you cannot complete both requirements, STOP and report why.

## The Process

### Phase 0: Check for Design Document

Before topic clarification, check if a design document exists:

**If invoked with a path argument:**
1. Check if the path points to a file in `docs/designs/` or `docs/plans/`
2. If file exists: Read the FULL content (it will be included verbatim in the research doc)
3. If file missing: Warn "Design doc not found at [path], falling back to clarification"

**If no path provided:**
1. Search `docs/designs/` for recent design docs (within 7 days)
2. If found: Ask "Found design doc [filename]. Use this for research?" (Yes/No)
3. If not found or declined: Proceed to Phase 1 clarification

**When design doc found:**
- Store the FULL design document content (will be included verbatim in Phase 3)
- Extract "Open Questions" section for agent prompts
- Add to each agent prompt in Phase 2:
  ```
  Additionally, investigate these open questions from the design:
  - [question 1]
  - [question 2]
  ```
- Skip Phase 1 clarification (design already clarifies the topic)

### Issue Context Handling in Phase 0

**If design doc found with Original Issue block:**
- Extract the "## Original Issue" section verbatim
- Store for inclusion in research output (Phase 3)
- Do NOT re-fetch from issue tracker (use captured version)

**If no design doc AND issue ID provided as argument:**
1. Dispatch issue-tracking agent:
   ```
   Task(description: "Fetch issue body",
        prompt: "Operation: get-issue-body
   Issue: [issue ID from argument]",
        model: "haiku",
        subagent_type: "hyperpowers:issue-tracking:issue-tracking")
   ```

2. Assess and confirm classification (same as brainstorming Phase 0)

3. Store for inclusion in research output

**If neither design doc nor issue ID:** Proceed without Original Issue block.

### Phase 1: Clarify the Topic (if no design doc)

If the research topic is ambiguous, ask 2-3 targeted questions using AskUserQuestion:
- What specific aspect needs investigation?
- What decisions will the research inform?
- Are there known constraints or concerns?

If clear, proceed directly to Phase 2.

### Phase 2: Dispatch Parallel Research Agents

Dispatch all 8 agents simultaneously using the Task tool:

```
Task(description: "Analyze codebase patterns",
     prompt: [codebase-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Analyze git history",
     prompt: [git-history-analyzer prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Research framework docs",
     prompt: [framework-docs-researcher prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Research best practices",
     prompt: [best-practices-researcher prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Analyze test coverage",
     prompt: [test-coverage-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Analyze error handling",
     prompt: [error-handling-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Analyze dependencies",
     prompt: [dependency-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Analyze architecture boundaries",
     prompt: [architecture-boundaries-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")
```

Each agent prompt should include:
- The specific research topic
- Any open questions from the design document
- The agent's methodology from their definition file
- The output format expected

### COMPULSORY: Agent Dispatch Verification

Before proceeding to Phase 2.5 or Phase 3, you MUST verify all 8 agents were dispatched.

**Dispatch Checklist** (all COMPULSORY):
- [ ] codebase-analyst
- [ ] git-history-analyzer
- [ ] framework-docs-researcher
- [ ] best-practices-researcher
- [ ] test-coverage-analyst
- [ ] error-handling-analyst
- [ ] dependency-analyst
- [ ] architecture-boundaries-analyst

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT proceed. Dispatch the missing agent(s) first.

**Self-Check:** Count your Task tool calls. You MUST have exactly 8 (plus 1 optional for issue discovery). If fewer than 8, you have failed this gate.

### Phase 2.5: Issue Discovery (Optional)

If an issue tracker is detected, dispatch issue-tracking agent for discovery:

```
Task(description: "Discover related issues",
     prompt: "Operation: discover
Context: [user's research topic]
Branch: [current branch name if relevant]

Find issues related to this research topic.",
     model: "haiku",
     subagent_type: "general-purpose")
```

If no tracker detected, skip this phase (will note in output).

### Phase 3: Synthesize Findings

After all agents complete, synthesize their findings into a research document.

**Research Document Format:**

```markdown
# Research: [Topic]

> Generated: [YYYY-MM-DD]
> Design Doc: docs/designs/YYYY-MM-DD-<topic>-design.md (if exists)
> Issue: [if linked]

## Original Design Document

[Include the FULL design document content here, verbatim. Do NOT summarize.
Copy the entire design doc including all sections, formatting, and details.
Only omit the YAML frontmatter if present.]

---

## Resolved Questions

| Question | Resolution |
|----------|------------|
| [open question 1 from design] | [answer from agent research] |
| [open question 2 from design] | [answer from agent research] |

## Original Issue

> **ID:** [issue-id]
> **Title:** [title]
> **Status:** Authoritative | Reference Only
> **Reason:** [classification reason]

[Full issue body verbatim - copied from design doc or captured directly]

---

## Executive Summary
- [5-7 key findings as bullets]
- Critical constraints discovered
- Recommended approach

## Codebase Analysis
[From codebase-analyst agent]
- Architecture patterns found
- Similar implementations (with file paths)
- Conventions to follow

## Git History Insights
[From git-history-analyzer agent]
- How similar features evolved
- Key decisions and why
- Contributors with relevant expertise

## Framework & Documentation
[From framework-docs-researcher agent]
- API details discovered
- Version-specific considerations
- Configuration requirements

## Best Practices
[From best-practices-researcher agent]
- Current community patterns
- Security considerations
- Performance implications

## Test Coverage Analysis
[From test-coverage-analyst agent]
- Existing test patterns
- Coverage gaps identified
- Test utilities available
- Testing recommendations

## Error Handling Analysis
[From error-handling-analyst agent]
- Error patterns in codebase
- Failure modes to handle
- Logging/monitoring approaches
- Recovery strategies

## Dependency Analysis
[From dependency-analyst agent]
- Relevant dependencies and versions
- Version constraints affecting implementation
- Upgrade considerations
- Transitive dependency notes

## Architecture Boundaries Analysis
[From architecture-boundaries-analyst agent]
- Module boundaries relevant to task
- Public interfaces to implement
- Coupling patterns to follow
- Where new code should live

## Related Issues

| ID | Title | Status | Source |
|----|-------|--------|--------|
| [id] | [title] | [status] | [user-mentioned / branch name / keyword match] |

**Note:** [If no tracker detected: "No issue tracker detected. Consider configuring one in CLAUDE.md."]

## Edge Cases & Gotchas
[Synthesized from all agents]
- Testing blind spots identified
- Error paths to handle
- Integration points to consider

## Open Questions
- Things research couldn't resolve (not from design - those go in Resolved Questions)
- Decisions needed before planning
```

### COMPULSORY: Handoff Consumption Verification

**Agent Output Consumption Gate** (COMPULSORY - for each of 8 agents):

- [ ] Each agent's output file path stated
- [ ] Key findings from EACH agent quoted in synthesis
- [ ] Contradictions between agents noted and resolved
- [ ] No agent's findings silently dropped

**STOP CONDITION:** If synthesis doesn't cite all 8 agents, STOP. Quote findings from missing agents.

### COMPULSORY: Synthesis Verification

Before saving the research document, you MUST verify synthesis is complete.

**Synthesis Checklist** (all COMPULSORY - document MUST contain each section):
- [ ] Original Design Document (full verbatim content, if design doc exists)
- [ ] Resolved Questions (answers to design's open questions, if design doc exists)
- [ ] Original Issue (if captured in Phase 0 or extracted from design doc)
- [ ] Executive Summary (your synthesis, not copy-paste)
- [ ] Codebase Analysis (from codebase-analyst)
- [ ] Git History Insights (from git-history-analyzer)
- [ ] Framework & Documentation (from framework-docs-researcher)
- [ ] Best Practices (from best-practices-researcher)
- [ ] Test Coverage Analysis (from test-coverage-analyst)
- [ ] Error Handling Analysis (from error-handling-analyst)
- [ ] Dependency Analysis (from dependency-analyst)
- [ ] Architecture Boundaries Analysis (from architecture-boundaries-analyst)
- [ ] Edge Cases & Gotchas (synthesized from ALL agents)

**STOP CONDITION:** If ANY section is missing or contains only "N/A" or placeholder text, do NOT save. Complete the missing section(s) first.

**Per-Agent Citation Checklist** (COMPULSORY):

- [ ] Codebase Analyst findings cited
- [ ] Git History Analyzer findings cited
- [ ] Framework Docs Researcher findings cited
- [ ] Best Practices Researcher findings cited
- [ ] Test Coverage Analyst findings cited
- [ ] Error Handling Analyst findings cited
- [ ] Dependency Analyst findings cited
- [ ] Architecture Boundaries Analyst findings cited

**STOP CONDITION:** If any agent missing from synthesis, go back and incorporate their findings.

**CRITICAL:** The Executive Summary and Edge Cases sections MUST be YOUR synthesis, not raw agent output. These sections prove you combined the findings.

### Phase 4: Save Research Document

Save to: `docs/research/YYYY-MM-DD-<topic-slug>.md`

Example: `docs/research/2026-01-15-user-authentication.md`

### Phase 5: Announce Completion

After saving the research document, announce with copy-paste commands:

```
Research complete and saved to `docs/research/<actual-filename>.md`.

To continue:
/compact ready to plan docs/research/<actual-filename>.md
/hyperpowers:writing-plans docs/research/<actual-filename>.md
```

Replace `<actual-filename>` with the real filename you just created.

**Design doc note:** If a design doc was used, add: "The full design document has been preserved in the research doc."

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| 0 | Check design doc | Full design content or proceed |
| 1 | Clarify topic (if no design) | Clear research question |
| 2 | Dispatch 8 agents | Parallel research |
| 2.5 | Discover issues | Related issues list |
| 3 | Synthesize | Combined findings |
| 4 | Save | `docs/research/YYYY-MM-DD-topic.md` |
| 5 | Announce | Ready for planning |

## Red Flags - IMMEDIATE STOP

These are CRITICAL violations. If you catch yourself doing any of these, STOP immediately:

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Dispatching fewer than 8 agents | Incomplete research = flawed plans | Go back, dispatch ALL agents |
| Writing doc before agents complete | Premature synthesis misses findings | Wait for all agent results |
| Concatenating without synthesizing | Raw dumps aren't research | Write Executive Summary + Edge Cases |
| Skipping the dispatch checklist | Gate exists for a reason | Complete checklist before proceeding |
| Skipping the synthesis checklist | Gate exists for a reason | Complete checklist before saving |
| "Agent X had no relevant findings" | Every agent finds SOMETHING | Re-read agent output, cite at least one finding |
| Synthesis shorter than combined agent outputs | Information being lost | Expand synthesis to cover all findings |
| No contradictions noted | Unlikely 8 agents fully agree | Look harder for nuance/disagreement |

**If in doubt:** Re-read the CRITICAL REQUIREMENTS section at the top.

## Integration

After research, the user should run:
- `/hyperpowers:write-plan` to create implementation plan
- The planning skill will automatically find and use the research
