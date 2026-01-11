---
name: feedback
description: Use when user provides feedback on a design, research, or plan document, or invokes /hyperpowers:feedback
allowed-tools: Read, Grep, Glob, Edit, Write, AskUserQuestion, WebSearch, WebFetch, Task
---

# Feedback Skill

## Overview

Enable iterative refinement of design, research, and plan documents through natural language feedback. Each change is shown as a diff with individual approval before application.

**Announce at start:** "I'm using the feedback skill to refine [document path]."

**Core principle:** User maintains full control - every change requires explicit approval.

## When to Use

**Use this skill when:**
- User explicitly invokes `/hyperpowers:feedback <path>`
- User provides feedback-like input after a document was just created in the same session
- User says "actually", "change", "instead", "add", "remove", "update", "modify" in reference to a document

**Don't use when:**
- Feedback is about code files (this skill is for design artifacts only)
- User wants to start fresh with a new design (use brainstorming instead)
- Document doesn't exist in `docs/designs/`, `docs/research/`, or `docs/plans/`

## Implicit Trigger Detection

The feedback skill can activate implicitly when:

1. **Keywords detected:** "actually", "change", "instead", "add", "remove", "update", "modify"
2. **Proximity:** Feedback follows document creation in same conversation session
3. **Context:** User is referencing a recently-created design, research, or plan document

**Implicit activation announcement:**
"I notice you're providing feedback on the [document type] we just created. I'll use the feedback skill to incorporate your changes."

**Confidence threshold:** Only activate implicitly if confidence > 85%. Otherwise, ask:
"Are you providing feedback on [document path]? If so, I can use the feedback skill to incorporate your changes."

## The Process

### Phase 1: Parse Feedback

Read the target document and parse the user's natural language feedback.

**Identify:**
1. Which section(s) the feedback applies to
2. Whether the request is clear or needs clarification
3. Whether research is needed to fulfill the request

**Document Detection:**
- `docs/designs/` → design document → next stage is `/hyperpowers:research`
- `docs/research/` → research document → next stage is `/hyperpowers:writing-plans`
- `docs/plans/` → plan document → next stage is `/hyperpowers:subagent-driven-development`

**If document not found:** Stop and inform user: "Document not found at [path]. Please provide a valid path to a design, research, or plan document."

**If unsupported location:** Stop and inform user: "Feedback skill only supports documents in docs/designs/, docs/research/, or docs/plans/."

### Phase 2: Clarify (if needed)

**Skip this phase if:** Feedback is unambiguous (clear section, clear change, no interpretation needed).

**Ask clarifying questions when:**
- Feedback uses vague terms ("more robust", "better", "improve")
- Multiple valid interpretations exist
- Section target is unclear
- Scope of change is undefined

**Clarification Rules:**
- 1-2 targeted questions maximum
- Multiple choice preferred over open-ended
- One question per message
- Reference specific document content when asking

**Example clarification:**
```
You mentioned "more robust error handling" - which do you mean?

1. **Retry logic** - Automatically retry failed operations
2. **Better error messages** - More descriptive user-facing errors
3. **Graceful degradation** - Fallback behavior when components fail
4. **Other** - Describe what you're looking for
```

**If confidence < 85% in interpreting feedback:** Ask, don't guess.

### Phase 3: Research (if needed)

**Skip this phase if:** Feedback can be addressed from document context alone.

**Three-Tier Escalation Model:**

**Tier 1: Codebase Lookup** (most common)
- **Trigger:** Feedback requires finding existing patterns or implementations
- **Method:** Grep/Glob the codebase synchronously
- **Example:** "Add retry logic" → search for existing retry implementations
- **Execution:** Orchestrator-level, no subagent dispatch

**Tier 2: Web Search**
- **Trigger:** Feedback asks about APIs, libraries, or best practices not in codebase
- **Method:** WebSearch + WebFetch for documentation
- **Example:** "Use Redis instead of in-memory cache" → search Redis best practices
- **Execution:** Orchestrator-level, synchronous

**Tier 3: Full Research Dispatch** (rare)
- **Trigger:** Feedback introduces significant new scope or complex unknowns
- **Method:** Dispatch 4 parallel research agents (haiku model)
- **Example:** "Change authentication from session-based to JWT"
- **Execution:** Only when feedback introduces major architectural changes

**Escalation Decision Algorithm:**
```
1. Answerable from document context alone?
   YES → Incorporate feedback directly
   NO → proceed to step 2

2. Codebase-specific question (existing patterns, code)?
   YES → Tier 1 (Grep/Glob), escalate to web if insufficient
   NO → proceed to step 3

3. Requires current external information?
   YES → Tier 2 (WebSearch)
   NO → proceed to step 4

4. Requires synthesis across multiple complex sources?
   YES → Tier 3 (Full dispatch)
   NO → Ask user for clarification (feedback too vague)
```

**Anti-Pattern:** Over-escalation. Reserve full dispatch for genuinely complex tradeoffs. Most feedback needs Tier 1 or Tier 2 only.

### Phase 4: Present Changes as Diffs

For each section being modified, show the change with individual approval:

**Diff Format:**
```
### Change 1 of 3: [Section Name]

**Old:**
> [Exact text being replaced, quoted]

**New:**
> [Proposed replacement text, quoted]

Apply this change? (yes/no/modify)
```

**Approval Options:**
- **yes** - Apply this change and move to next
- **no** - Skip this change and move to next
- **modify** - User provides additional feedback on this specific change

**Rules:**
- Present one change at a time
- Wait for user response before proceeding to next change
- Show context (3-5 surrounding lines) when helpful
- Never batch changes as all-or-nothing
- User maintains full control over each modification

**If user selects "modify":**
Return to Phase 2 (Clarify) for this specific change with the user's additional feedback.

### Phase 5: Update Document & Changelog

After user approves changes:

**Step 1: Apply approved changes**
Use Edit tool to apply each approved change to the document.

**Step 2: Append changelog entry**
Add or update the `## Changelog` section at the end of the document:

~~~markdown
## Changelog

### YYYY-MM-DD - Feedback Round N
- **[Section]:** [Brief description of change]
- **[Section]:** [Brief description of change]
- **Research:** [If research was performed, note what was looked up]
~~~

**Changelog Rules:**
- Create `## Changelog` section on first feedback round
- Append new dated entries on subsequent rounds
- Use Keep a Changelog categories when appropriate: Added, Changed, Fixed
- Include research performed (with tier used)
- Persist across sessions (changelog is permanent)

**Example:**
~~~markdown
## Changelog

### 2026-01-11 - Feedback Round 1
- **Architecture:** Changed from in-memory cache to Redis with 15-min TTL
- **Error Handling:** Added retry logic with exponential backoff
- **Research:** Tier 2 - Looked up Redis best practices for cache invalidation

### 2026-01-12 - Feedback Round 2
- **Success Criteria:** Added latency requirement (<100ms p95)
~~~

### Phase 6: Completion Check

After all approved changes are applied, ask explicitly:

```
Document updated at `[document path]`.

Would you like to:
1. **Continue refining** - Give more feedback on this document
2. **Move to next stage** - [Context-aware based on document type]
3. **Done for now** - Stay here, invoke next skill manually later
```

**Next stage options (context-aware):**
- Design doc (`docs/designs/`) → "Move to research (`/hyperpowers:research`)"
- Research doc (`docs/research/`) → "Move to planning (`/hyperpowers:writing-plans`)"
- Plan doc (`docs/plans/`) → "Move to implementation (`/hyperpowers:subagent-driven-development`)"

**If user chooses option 1:** Return to Phase 1 with new feedback.

**If user chooses option 2:** Provide standard handoff:

```
Document finalized at `[document path]`.

To continue:
/compact ready to [research|plan|implement] [document path]
/hyperpowers:[next-skill] [document path]
```

**If user chooses option 3:** End skill execution.

## Red Flags - STOP

- Applying changes without user approval
- Modifying code files (design artifacts only)
- Skipping clarification when feedback is ambiguous
- Restructuring document format (add content, don't restructure)
- Dispatching full research for simple feedback
