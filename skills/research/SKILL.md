---
name: research
description: Use when starting deep technical research before planning, when needing to understand a new codebase area, or when the user invokes /hyperpowers:research
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Task, Write
---

# Research Skill

**Announce at start:** "I'm using the research skill to conduct deep technical research before planning."

## Overview

Deep research that surfaces issues before they become bugs. Dispatches 4 parallel agents to analyze codebase, git history, framework docs, and best practices, then synthesizes findings into a persistent research document.

## When to Use

Use this skill when:
- Starting work on a new feature area
- Planning requires understanding unfamiliar code
- User explicitly invokes `/hyperpowers:research`
- Writing-plans skill suggests research first

Do NOT use when:
- Making a quick fix to familiar code
- Research already exists in `docs/research/`

## The Process

### Phase 0: Check for Design Document

Before topic clarification, check if a design document exists:

**If invoked with a path argument:**
1. Check if the path points to a file in `docs/designs/` or `docs/plans/`
2. If file exists: Read it, extract Problem Statement, Success Criteria, Constraints, Approach, Open Questions
3. If file missing: Warn "Design doc not found at [path], falling back to clarification"

**If no path provided:**
1. Search `docs/designs/` for recent design docs (within 7 days)
2. If found: Ask "Found design doc [filename]. Use this for research?" (Yes/No)
3. If not found or declined: Proceed to Phase 1 clarification

**When design doc found:**
- Extract "Open Questions" section
- Add to each agent prompt in Phase 2:
  ```
  Additionally, investigate these open questions from the design:
  - [question 1]
  - [question 2]
  ```
- Skip Phase 1 clarification (design already clarifies the topic)

### Phase 1: Clarify the Topic (if no design doc)

If the research topic is ambiguous, ask 2-3 targeted questions using AskUserQuestion:
- What specific aspect needs investigation?
- What decisions will the research inform?
- Are there known constraints or concerns?

If clear, proceed directly to Phase 2.

### Phase 2: Dispatch Parallel Research Agents

Dispatch all 4 agents simultaneously using the Task tool:

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
```

Each agent prompt should include:
- The specific research topic
- The agent's methodology from their definition file
- The output format expected

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
> Issue: [if linked]

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
- Things research couldn't resolve
- Decisions needed before planning
```

### Phase 4: Save Research Document

Save to: `docs/research/YYYY-MM-DD-<topic-slug>.md`

Example: `docs/research/2026-01-15-user-authentication.md`

### Phase 5: Announce Completion

"Research complete and saved to `docs/research/[filename].md`. Ready to proceed with planning."

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| 0 | Check design doc | Design context or proceed |
| 1 | Clarify topic (if no design) | Clear research question |
| 2 | Dispatch 4 agents | Parallel research |
| 2.5 | Discover issues | Related issues list |
| 3 | Synthesize | Combined findings |
| 4 | Save | `docs/research/YYYY-MM-DD-topic.md` |
| 5 | Announce | Ready for planning |

## Red Flags - STOP

- Dispatching agents without clear topic
- Writing research doc before agents complete
- Skipping synthesis (just concatenating agent outputs)
- Not saving to `docs/research/`

## Integration

After research, the user should run:
- `/hyperpowers:write-plan` to create implementation plan
- The planning skill will automatically find and use the research
