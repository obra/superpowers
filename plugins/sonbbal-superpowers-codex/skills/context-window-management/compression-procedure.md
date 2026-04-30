# Context Preservation Procedure

## Step 1: Finish The Atomic Unit

Finish the smallest coherent unit already in progress:

- Complete the current file edit or patch.
- Finish reading the current file or command output.
- Finish the current verification command and record its result.
- Finish documenting the current review finding or blocker.

Do not start a new task before preservation is complete.

## Step 2: Preserve Operational State

Record the state needed to continue safely:

- Current objective and where it came from.
- Owned paths, forbidden paths, and coordination constraints.
- Files changed, files inspected, and files still intended for edits.
- Current `update_plan` status when a plan exists.
- Commands run with exact pass/fail status.
- Verification still required before completion claims.
- Blockers, risks, deferred requests, and next action.

If the workflow allows writing notes to an owned file, do so only inside the allowed path. Otherwise keep the summary in the conversation.

## Step 3: Discard Verbose Context

Do not carry forward unnecessary bulk:

- Full file contents that remain available on disk.
- Full logs after the relevant error or result is captured.
- Completed exploration details once the conclusion is known.
- Duplicate restatements of the same decision.

Keep conclusions and evidence, not transcripts.

## Step 4: Create A Compact Summary

Use this shape when context pressure is high or after automatic compaction:

```markdown
## Compact Task State

### Objective
- <one-line user objective>

### Constraints
- Owned paths: <paths>
- Forbidden actions or paths: <items>
- Coordination notes: <other workers, dirty worktree, branch rules>

### Current State
- Progress: <what is complete and what is in progress>
- Changed files: <paths or "none">
- Important decisions: <decision + reason>
- Blockers: <none or details>

### Verification
- Run: `<command>` -> <pass/fail and key output>
- Still required: <commands or inspections before completion>

### Next Actions
1. <immediate next step>
2. <following step if known>

### Deferred Requests
- <request summary or "none">
```

## Step 5: Resume Carefully

After compaction or summary creation:

1. Re-read the compact state.
2. Re-check any critical user constraints before editing.
3. Confirm verification obligations before claiming completion.
4. Continue with the recorded next action.

If the summary is incomplete, stop and reconstruct missing state from files, command output, or user instructions before proceeding.
