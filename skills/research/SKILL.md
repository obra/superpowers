---
name: research
description: Use when starting deep technical research before planning, when needing to understand a new codebase area, or when the user invokes /hyperpowers:research
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Task, Write, AskUserQuestion
user-invocable: false
---

# Research Skill

**Announce at start:** "I'm using the research skill to conduct deep technical research before planning."

## Overview

Deep research that surfaces issues before they become bugs. Dispatches 8 parallel agents to analyze codebase, git history, framework docs, best practices, test coverage, error handling, dependencies, and architecture boundaries, then synthesizes findings into a persistent research document.

<requirements>
## Requirements (MINIMUM 8 agents, synthesis)

1. Dispatch ALL 8 agents in a single message (MINIMUM - more if open questions exist). Fewer than 8 = VIOLATION. Stop immediately.
2. Synthesize findings into research document. Raw concatenation = invalid output.
3. 8 agents is the floor, not the ceiling.
</requirements>

<compliance-anchor>
You have invoked this skill. You MUST:
- Follow phases in order (no skipping)
- Complete all gates (no self-exemptions)
- Produce required outputs (no substitutions)

Failure to comply = skill failure. There is no "partial compliance."
</compliance-anchor>

## When to Use

Use this skill when:
- Starting work on a new feature area
- Planning requires understanding unfamiliar code
- User explicitly invokes `/hyperpowers:research`
- Writing-plans skill suggests research first

Do NOT use when:
- Making a quick fix to familiar code
- Research already exists in `docs/hyperpowers/research/`

## Requirements

This skill produces valid output only when both are met:

1. **Dispatch all 8 agents** in one message. Dispatching fewer produces incomplete research.
2. **Synthesize findings** into a coherent document. Concatenating raw output is not synthesis.

If blocked from either requirement, stop and explain why.

## The Process

### Phase 0: Check for Design Document

Before topic clarification, check if a design document exists:

**If invoked with a path argument:**
1. Check if the path points to a file in `docs/hyperpowers/designs/` or `docs/hyperpowers/plans/`
2. If file exists: Read the FULL content (it will be included verbatim in the research doc)
3. If file missing: Warn "Design doc not found at [path], falling back to clarification"

**If no path provided:**
1. Search `docs/hyperpowers/designs/` for recent design docs (within 7 days)
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

### Dispatch Verification (check BEFORE dispatching)

You will dispatch exactly 8 agents:
1. codebase-analyst
2. git-history-analyzer
3. framework-docs-researcher
4. best-practices-researcher
5. test-coverage-analyst
6. error-handling-analyst
7. dependency-analyst
8. architecture-boundaries-analyst

### Common Rationalizations (ALL INVALID)

These thoughts mean you're about to violate the 8-agent minimum. STOP.

| Thought | Reality |
|---------|---------|
| "I'll dispatch the most relevant agents" | ALL agents are relevant. Each has unique perspective. |
| "These agents overlap" | Overlap is intentional - contradictions are valuable. |
| "To save time/tokens" | 8 parallel agents IS the efficient approach. |
| "Given the simple topic" | No topic is too simple for all 8. Simplicity is deceptive. |
| "I already know the answer" | Research validates, doesn't assume. Dispatch all 8. |

**Dispatch Gate** (Required - NEVER skip):

STOP. Before proceeding, verify you will dispatch ALL of these in ONE message:
- [ ] codebase-analyst
- [ ] git-history-analyzer
- [ ] framework-docs-researcher
- [ ] best-practices-researcher
- [ ] test-coverage-analyst
- [ ] error-handling-analyst
- [ ] dependency-analyst
- [ ] architecture-boundaries-analyst
- [ ] Additional agents for any open questions discovered

**STOP CONDITION (MANDATORY):** Count your Task calls before dispatching.

- Less than 8 = VIOLATION. Do not proceed.
- Design doc has open questions? Add 1 Task call per question (Phase 2.5a).
- Minimum agents = 8 + (number of open questions)

If count is wrong, FIX IT before proceeding. No exceptions. No rationalizations.

### Dispatch all 8 agents now:

```
# Agent 1 of 8: Codebase Analysis
Task(description: "Analyze codebase patterns",
     prompt: [codebase-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 2 of 8: Git History
Task(description: "Analyze git history",
     prompt: [git-history-analyzer prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 3 of 8: Framework Docs
Task(description: "Research framework docs",
     prompt: [framework-docs-researcher prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 4 of 8: Best Practices
Task(description: "Research best practices",
     prompt: [best-practices-researcher prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 5 of 8: Test Coverage
Task(description: "Analyze test coverage",
     prompt: [test-coverage-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 6 of 8: Error Handling
Task(description: "Analyze error handling",
     prompt: [error-handling-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 7 of 8: Dependencies
Task(description: "Analyze dependencies",
     prompt: [dependency-analyst prompt with topic],
     model: "haiku",
     subagent_type: "general-purpose")

# Agent 8 of 8: Architecture Boundaries
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

### Phase 2.5a: Open Question Agents (Conditional)

If design document had an "Open Questions" section, dispatch additional agents:

**Step 1: Analyze each open question to determine best-fit agent type:**

| Question Type | Best-Fit Agent |
|---------------|----------------|
| Framework/API questions | framework-docs-researcher |
| Code architecture questions | codebase-analyst or architecture-boundaries-analyst |
| Historical "why" questions | git-history-analyzer |
| Performance/security questions | best-practices-researcher |
| Testing approach questions | test-coverage-analyst |
| Error handling questions | error-handling-analyst |
| Dependency questions | dependency-analyst |

**Step 2: Dispatch one additional agent per open question:**

```
Task(
  description: "Investigate: [3-5 word question summary]",
  prompt: "Focus ONLY on this open question from the design doc:
  '[full question text]'

  Research this specific question thoroughly. Provide:
  1. Direct answer if possible
  2. Evidence from codebase/docs/web
  3. Confidence level (high/medium/low)
  4. Remaining unknowns",
  model: "haiku",
  subagent_type: "hyperpowers:research:[best-fit-agent]"
)
```

**Step 3: Update dispatch count verification:**

Total agents dispatched = 8 core + N open question agents

**Skip Condition:** If design doc has no "Open Questions" section, skip Phase 2.5a entirely.

### Phase 2.6: Issue Discovery (Optional)

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
> Design Doc: docs/hyperpowers/designs/YYYY-MM-DD-<topic>-design.md (if exists)
> Issue: [if linked]

## Original Design Document

[Include the FULL design document content here, verbatim. Do NOT summarize.
Copy the entire design doc including all sections, formatting, and details.
Only omit the YAML frontmatter if present.]

---

## Resolved Questions

| Question | Resolution | Source |
|----------|------------|--------|
| [open question 1 from design] | [answer from research] | [agent type that answered, e.g., "Test Coverage Analyst"] |
| [open question 2 from design] | [answer from research] | [agent type(s) that contributed] |

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

### Agent Output Consumption Gate

Before saving, verify all agents' findings are incorporated:

- [ ] All 8 core agents' findings cited
- [ ] All open question agents' findings cited (if Phase 2.5a executed)
- [ ] Total agent count matches 8 + N (where N = open questions, or 0 if none)
- [ ] Each agent's output file path stated
- [ ] Key findings from EACH agent quoted in synthesis
- [ ] Contradictions between agents noted and resolved
- [ ] No agent's findings silently dropped

**STOP CONDITION:** If synthesis doesn't cite all 8 + N agents, stop. Quote findings from missing agents.

<verification>
### Synthesis Verification (check BEFORE saving)

- [ ] Executive Summary written (your synthesis, not copy-paste)
- [ ] All 8 agent sections populated with findings
- [ ] Edge Cases synthesized from multiple agents
- [ ] Contradictions between agents noted

**STOP CONDITION:** If any section empty or placeholder, complete before saving.
</verification>

**Per-Agent Citation Checklist:**

- [ ] Codebase Analyst findings cited
- [ ] Git History Analyzer findings cited
- [ ] Framework Docs Researcher findings cited
- [ ] Best Practices Researcher findings cited
- [ ] Test Coverage Analyst findings cited
- [ ] Error Handling Analyst findings cited
- [ ] Dependency Analyst findings cited
- [ ] Architecture Boundaries Analyst findings cited

**STOP CONDITION:** If any agent missing from synthesis, go back and incorporate their findings.

The Executive Summary and Edge Cases sections should be YOUR synthesis, not raw agent output. These sections demonstrate combined findings.

### Phase 3.5: Assumption Validation

After synthesis completes, validate technical assumptions:

1. **Dispatch assumption checker agent**
   ```
   Task(description: "Validate research assumptions",
        prompt: "[Include full research document content here]

   Validate all technical assumptions in this research document.
   Return structured output with Validated/Invalid/Unverified sections.",
        model: "haiku",
        subagent_type: "hyperpowers:research:assumption-checker")
   ```

2. **Parse agent output**
   - Extract the Validated Assumptions section
   - Count invalid assumptions (❌ items)

3. **Embed results in research document**
   - Add "## Validated Assumptions" section before "## Open Questions"
   - Include all three subsections (✅/❌/⚠️)

4. **If invalid assumptions found**
   ```
   AskUserQuestion(
     questions: [{
       question: "Found N invalid assumptions in research. How would you like to proceed?",
       header: "Assumptions",
       options: [
         {label: "Review and address", description: "Pause to fix invalid assumptions before saving"},
         {label: "Continue anyway", description: "Save research with invalid assumptions noted"},
         {label: "Show details", description: "Display full validation report"}
       ],
       multiSelect: false
     }]
   )
   ```

5. **Proceed to Phase 4 (Save) after user response**

**Error Handling:**
- If agent times out: Note "Assumption validation incomplete" in document, proceed to save
- If no assumptions found: Note "No technical assumptions to validate" in document

### Phase 4: Save Research Document

Save to: `docs/hyperpowers/research/YYYY-MM-DD-<topic-slug>.md`

Example: `docs/hyperpowers/research/2026-01-15-user-authentication.md`

**Output Gate** (Required - NEVER skip):

STOP. Before announcing completion, verify:
- [ ] File EXISTS at `docs/hyperpowers/research/YYYY-MM-DD-<topic-slug>.md`
- [ ] Quote the first line of the file you just wrote (proof you wrote it)
- [ ] **Store this exact path for Phase 5 handoff** (do NOT use the design doc path from Phase 0)

If file doesn't exist, you have NOT completed research. Write it now.

**Path Reminder:** Your OUTPUT is `docs/hyperpowers/research/...`, your INPUT was `docs/hyperpowers/designs/...`. The handoff uses OUTPUT.

| Thought | Reality |
|---------|---------|
| "I'll just summarize in chat" | NO. Document MUST be written to file. Chat is ephemeral. |
| "The user can see my synthesis" | NO. Next skill needs the file path. No file = broken handoff. |

### Phase 5: Announce Completion

**Completion Enforcement** (CRITICAL):

Your FINAL message MUST contain the handoff block. This is NOT optional.

STOP. Look at your planned final message. Does it contain:
```
Research complete and saved to `docs/hyperpowers/research/<actual-filename>.md`.

To continue:
/compact ready to plan docs/hyperpowers/research/<actual-filename>.md
/hyperpowers:writing-plans docs/hyperpowers/research/<actual-filename>.md
```

If NO: Add it. You cannot announce completion without this exact block.
If YES: Proceed with sending.

<verification>
### Handoff Path Verification Gate

**STOP CONDITION:** Before writing your handoff message, verify the path:

- [ ] Handoff path starts with `docs/hyperpowers/research/` (NOT `designs/`)
- [ ] Handoff path matches the file you saved in Phase 4
- [ ] Handoff path is the RESEARCH doc you created, not the DESIGN doc you consumed

**Common Confusion (INVALID - will break workflow):**

| Wrong Path | Why It's Wrong | Correct Path |
|------------|----------------|--------------|
| `docs/hyperpowers/designs/...` | This is your INPUT (design doc) | `docs/hyperpowers/research/...` |
| Path from Phase 0 | Phase 0 reads design; Phase 4 writes research | Path from Phase 4 |

**Self-Check:** The path in your handoff MUST match the path in Phase 4 where you wrote: "Save to: `docs/hyperpowers/research/YYYY-MM-DD-<topic-slug>.md`"

If paths don't match, STOP and fix before sending.
</verification>

| Thought | Reality |
|---------|---------|
| "User knows what's next" | NO. Explicit commands prevent context loss. |
| "I'll mention it casually" | NO. Copy-paste commands, not prose descriptions. |
| "Compacting isn't always needed" | WRONG. Context degrades. ALWAYS suggest compact. |

Replace `<actual-filename>` with the real filename you just created.

**Design doc note:** If a design doc was used, add: "The full design document has been preserved in the research doc."

<completion-check>
Before announcing completion, verify you followed the skill:
- [ ] Completed all phases in order (0 → 1 → 2 → 2.5 → 3 → 3.5 → 4 → 5)
- [ ] Passed all verification gates (Dispatch Gate, Synthesis Verification, Output Gate)
- [ ] Produced required outputs (research document at docs/hyperpowers/research/)

If ANY unchecked, go back and complete missing steps.
</completion-check>

<requirements>
## Requirements (reminder)

1. Dispatch ALL 8 agents in a single message (MINIMUM - more if open questions exist). Fewer than 8 = VIOLATION. Stop immediately.
2. Synthesize findings into research document. Raw concatenation = invalid output.
3. 8 agents is the floor, not the ceiling.
</requirements>

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| 0 | Check design doc | Full design content or proceed |
| 1 | Clarify topic (if no design) | Clear research question |
| 2 | Dispatch 8 agents | Parallel research |
| 2.5a | Open question agents | Additional targeted research |
| 2.6 | Discover issues | Related issues list |
| 3 | Synthesize | Combined findings |
| 3.5 | Validate assumptions | Validated Assumptions section |
| 4 | Save | `docs/hyperpowers/research/YYYY-MM-DD-topic.md` |
| 5 | Announce | Ready for planning |

## Red Flags - Stop and Recover

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Dispatching < 8 agents | Violates minimum agent requirement | Stop, add missing agents before proceeding |
| Ignoring design doc open questions | Open questions need dedicated agents | Count questions, dispatch 1 agent each |
| "Efficiency" rationalization | 8 parallel agents IS efficient | All 8 required, no exceptions |
| Writing doc before agents complete | Missing findings corrupt synthesis | Wait for all agent results |
| Concatenating without synthesizing | Raw output is not research | Write Executive Summary + Edge Cases |
| Skipping dispatch or synthesis checklist | Gates exist to prevent failures | Complete checklist before proceeding |
| "Agent X had no relevant findings" | Every agent finds something | Re-read agent output, cite at least one finding |
| Synthesis shorter than combined outputs | Lost information | Expand synthesis to cover all findings |
| Handoff suggests design doc path | Design doc is INPUT, research doc is OUTPUT | Use research doc path from Phase 4 |

## Integration

After research, run `/hyperpowers:write-plan` to create implementation plan.
