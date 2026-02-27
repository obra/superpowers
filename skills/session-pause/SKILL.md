---
name: session-pause
description: Use when context window is filling up and you need to hand off work to a fresh session mid-phase, or when the user says they want to pause, hand off, or save session state
---

# Session Pause

## Overview

Generate a phase-aware handoff document so a fresh session can continue exactly where this one left off. Unlike plan mode (which only produces implementation plans), this captures mid-phase state for any workflow phase.

**Announce at start:** "I'm using the session-pause skill to save session state for handoff."

## When to Use

- User says "pause", "hand off", "save state", "I need to pick this up later"
- Context window approaching limits (~50%) and work isn't at a clean phase boundary
- Mid-brainstorm, mid-execution, mid-debugging — any point where plan mode can't help

## When NOT to Use

- At a clean phase boundary (design done, ready to execute) — use native plan mode with "clear and proceed" instead
- Work is complete — use superpowers:finishing-a-development-branch instead

## The Process

### Step 1: Detect Current Phase

Determine which phase is active based on conversation context:

| Phase | Indicators |
|-------|-----------|
| `brainstorming` | Design questions being asked, approaches being explored, no plan file yet |
| `writing-plans` | Plan document being drafted, tasks being structured |
| `executing-plans` | Plan file exists, tasks being implemented in batches |
| `debugging` | Bug investigation, hypothesis testing, stack trace analysis |
| `code-review` | Review feedback being given or received |
| `general` | None of the above (exploratory work, refactoring, etc.) |

### Step 2: Generate Phase-Specific Handoff

Write a handoff file to `.superpowers/handoff/` with the detected phase schema.

**File location:** `.superpowers/handoff/{phase}-{feature-slug}-{YYYY-MM-DD}.md`

**All handoffs include this common header:**

```markdown
# Session Handoff: {Feature Name}

**Phase:** {detected phase}
**Date:** {YYYY-MM-DD}
**Branch:** {current git branch}
**Worktree:** {worktree path if applicable}

## Resume Instructions

Use superpowers:session-resume to load this handoff and continue.
```

**Phase-specific sections:**

#### Brainstorming Handoff
```markdown
## Design Progress

### Questions Resolved
- {question}: {decision made and why}

### Questions Open
- {question still being explored}

### Approaches Explored
- **{name}:** {status: promising/rejected/needs-analysis} — {one-line summary}

### Design Sections
- {section}: {approved/pending/needs-revision}

### Design Doc
Path: {path to design doc if started, or "not yet created"}

## Next Steps
{What the next session should do first — continue asking questions, finalize approach, present remaining design sections, etc.}
```

#### Executing-Plans Handoff
```markdown
## Execution Progress

**Plan file:** {path to plan document}

### Tasks Completed
{list with task numbers and one-line summaries}

### Current Task
**Task {N}:** {name}
**Progress:** {what's done, what remains}

### Tasks Remaining
{list with task numbers}

### Verification Status
{which tasks have passing tests, any known issues}

### Last Commit
{short SHA and message}

## Next Steps
{Continue from task N, or fix issue X first, etc.}
```

#### Debugging Handoff
```markdown
## Debug Progress

**Symptom:** {what's broken}
**Reproduction:** {how to trigger it}

### Hypotheses Tested
- {hypothesis}: {result — confirmed/rejected/inconclusive}

### Key Findings
{what we've learned so far}

### Files Examined
{list of relevant files with line numbers}

### Stack Traces / Logs
{relevant error output, truncated if long}

## Next Steps
{Which hypothesis to test next, what to examine, etc.}
```

#### General Handoff
```markdown
## Work Progress

### What Was Done
{summary of actions taken}

### What Remains
{summary of remaining work}

### Key Decisions
{decisions made and rationale}

### Relevant Files
{files touched or examined}

## Next Steps
{What the next session should do first}
```

### Step 3: Save and Confirm

1. Create `.superpowers/handoff/` directory if it doesn't exist
2. Write the handoff file
3. Add `.superpowers/` to `.gitignore` if not already there (handoff files are ephemeral, not committed)
4. Report to user:

```
Session state saved to: .superpowers/handoff/{filename}

To resume: Start a new session and say "resume" or invoke superpowers:session-resume.
```

## Remember

- Be thorough but concise — the handoff is consumed by a fresh session with zero context
- Include file paths, branch names, and commit SHAs — these survive across sessions
- Capture decisions AND their rationale — the "why" is what gets lost
- Don't include full file contents — just paths and line references
- The handoff file is ephemeral — session-resume deletes it after loading
