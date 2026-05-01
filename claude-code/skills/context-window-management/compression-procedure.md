# Context Compression Procedure

## Deferring Incoming Requests at 160k+

When tokens exceed 160k AND another agent sends you a message:

```
SendMessage to requesting-agent:
  "CONTEXT COMPRESSION IN PROGRESS — Your request is queued.
   I'm completing my current work unit and compressing context.
   Estimated resume: <after compression>.
   Your request will be processed immediately after.
   DO NOT resend — I have it queued."
```

**Priority override:** The ONLY exception is a broadcast with "CRITICAL" or "BLOCK" — these get processed immediately even at 160k+.

## Step 1: Interim Cleanup

Before compressing, ensure nothing is lost:
- `git add` and `git commit` any pending work
- Update task status in TaskUpdate
- Write any pending findings to files

## Step 2: Identify Essential Context

Keep only:
- Current task spec (condensed)
- API contracts relevant to current work
- Key decisions and their reasons
- Test results and current state
- File paths being modified

## Step 3: Discard Verbose Context

Remove:
- Full file contents already committed
- Completed task details (summarize to one line each)
- Lengthy discussion threads (keep conclusions only)
- Exploration results that led to dead ends
- Duplicate information

## Step 4: Create Compressed Summary

```markdown
## Compressed Context — <agent-name>

### Current State
- Working on: Task N — <one-line description>
- Progress: Steps 1-3 complete, starting Step 4
- Branch: feature/<name>
- Tests: 12 passing, 0 failing

### Key Context
- API: Using POST /api/users (documented in docs/api/users.md)
- Decision: Chose approach B because <reason>
- Blocker: None

### Deferred Messages
- <agent-name>: <one-line summary of their request>

### Next Actions
1. <immediate next step>
2. <following step>

### Team Lead State (if applicable)
- Active File Lock Table:
  - <worker-name>: [<file1>, <file2>]
- DEFER_STREAK: <N>
- After compression: re-verify lock table via TaskGet on all in_progress tasks
```
