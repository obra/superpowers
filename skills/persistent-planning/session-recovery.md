# Session Recovery Protocol

Instructions for recovering an active plan after `/clear` or a new session.

## Detection (via session-start hook)

The session-start hook scans for active plans:

1. Check if `docs/plans/` directory exists
2. Look for `*-progress.md` files containing unchecked items (`- [ ]`)
3. If found, signal the active plan to the session context

## Recovery Steps

When an active plan is detected:

### Step 1: Read State Files

Read all three companion files:
- `docs/plans/<plan>-progress.md` — What's done, what's next
- `docs/plans/<plan>-findings.md` — Accumulated discoveries and errors
- `docs/plans/<plan>.md` — The original plan

### Step 2: Fill Reboot Check

Update the Reboot Check section in `*-progress.md`:

```markdown
## Reboot Check
1. Current phase: [derived from Task Status — which tasks are checked]
2. Last completed task: [last `- [x]` entry]
3. Active blockers: [any tasks marked blocked in Session Log]
4. Error patterns: (see findings.md) [summarize Error Log patterns]
5. Next task: [first `- [ ]` entry]
```

### Step 3: Present Recovery Summary

Show the user a concise recovery summary:

```
Active plan detected: <plan-name>

- Phase: [e.g., "Implementation — 3 of 8 tasks complete"]
- Last completed: Task 3 — [task name]
- Blockers: [none / list]
- Error patterns: [none / brief summary]
- Next up: Task 4 — [task name]
```

### Step 4: Confirm with User

Ask: **"Ready to continue from Task N, or review the plan first?"**

- If **continue**: Resume execution using the appropriate skill (subagent-driven-development or executing-plans)
- If **review**: Show the full plan with progress overlay (checked/unchecked tasks)

## Important Notes

- Always re-read findings before resuming — context from earlier tasks may have changed
- Check the Error Log for patterns that affect the next task
- If the Decisions Log has entries, the plan may have deviated — review decisions before assuming the plan text is current
