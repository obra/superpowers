---
name: session-resume
description: Use when starting a new session and the user says resume, continue, or pick up where we left off — loads handoff state from a previous session-pause
---

# Session Resume

## Overview

Load a handoff document from a previous session-pause and continue the work in the correct phase. After loading, delete the handoff file to prevent accumulation.

**Announce at start:** "I'm using the session-resume skill to restore session state."

## The Process

### Step 1: Find Handoff File

1. Check `.superpowers/handoff/` for handoff files
2. If multiple files exist, list them and ask the user which to resume
3. If no files exist, tell the user: "No handoff files found in `.superpowers/handoff/`. If you used plan mode instead, your plan should already be loaded."

### Step 2: Load and Present

1. Read the handoff file
2. Present a summary to the user:
   - Phase being resumed
   - Key progress points
   - Proposed next steps
3. Ask: "Ready to continue from here?"

### Step 3: Route to Correct Phase

Based on the `Phase` field in the handoff:

| Phase | Action |
|-------|--------|
| `brainstorming` | Continue the brainstorming process — pick up open questions, resume design exploration. Do NOT restart from scratch. |
| `writing-plans` | Continue writing the plan — reference any partial plan file noted in handoff. |
| `executing-plans` | Invoke superpowers:executing-plans — communicate completed tasks so they aren't re-executed. |
| `debugging` | Continue debugging — start from the next hypothesis or finding noted in handoff. |
| `code-review` | Continue review from where it left off. |
| `general` | Follow the "Next Steps" section from the handoff. |

### Step 4: Cleanup

After successfully loading the handoff:

1. Delete the handoff file
2. If `.superpowers/handoff/` is now empty, remove the directory
3. This prevents file accumulation across sessions

## Remember

- The handoff file is the ONLY context from the previous session — treat it as authoritative
- Navigate to the worktree/branch noted in the handoff before starting work
- For executing-plans resumption: cross-reference the handoff's "Tasks Completed" with git log to verify accuracy
- Don't re-ask questions marked as resolved in the handoff
- Don't re-explore approaches marked as rejected in the handoff
