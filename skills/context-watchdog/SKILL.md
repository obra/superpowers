# context-watchdog

Automatically detects low context, finishes the current atomic task
gracefully, saves full session state, and hands off cleanly to the
next session — without losing a single line of work.

---

## When this skill activates

This skill runs as a background concern during EVERY task.
Check context level at these moments:
- After completing each subtask or function
- Before starting any new file or major code block
- Before any operation that will generate large output (test runs,
  installs, large refactors)

**Trigger threshold: 15% context remaining**

How to estimate context level:
- Claude Code shows a context bar in the UI (bottom of screen)
- If UI indicator not visible: estimate based on conversation length
- After a long session with many tool calls, file reads, and long
  outputs — assume context is getting low and check before 
  starting the next big task
- If unsure: always err on the side of saving early

---

## The 4 phases — execute in exact order, never skip one

### PHASE 1 — FINISH THE ATOM (never abandon mid-task)

Before saving anything, reach the nearest clean stopping point:

**If currently writing a function:** finish the function completely.
Do not save mid-function. A half-written function is worse than
not starting it.

**If currently writing a test:** finish the test and make it pass
or explicitly mark it `@pytest.mark.skip(reason="incomplete — 
resume next session")` so the test suite stays green.

**If currently in a refactor:** reach the next compilable/runnable
state. Run the test suite. If tests are red, fix them or revert
the partial change before saving.

**If mid-install or mid-migration:** let it complete. Never save
state in the middle of a database migration.

**The rule:** leave the codebase in a state where another engineer
could pick it up and immediately understand what is done and 
what is not done.

---

### PHASE 2 — WRITE MEMORY FILES

Write ALL of these files. Never skip any of them.

#### 2a. `memory/PRIORITY-WORK.md` — OVERWRITE completely

```
# Priority work
Saved by context-watchdog: [TIMESTAMP]
Context at save: ~15% remaining

## DO THIS FIRST (exact next action)
[One specific sentence. File path + function name + what to do.
Example: "Add the PCR signal fetch to app/data/indicators.py 
in the compute_indicators() function — the yfinance call is 
done, next is the NSE F&O API call"]

## FULL TASK IN PROGRESS
[Name of the task that was interrupted]
[Which step out of how many: "Step 3 of 7"]

## COMPLETED IN THIS SESSION
[Bullet list of everything finished — be specific with file paths]
- ✅ [file/function] — [what it does]
- ✅ [file/function] — [what it does]

## NOT STARTED YET (in order)
- [ ] [next task after current]
- [ ] [task after that]
- [ ] [remaining tasks]

## CRITICAL CONTEXT
[3-5 sentences of decisions made this session that are NOT obvious
from the code. Things the next session MUST know to avoid 
undoing work or making wrong assumptions.]

## OPEN QUESTIONS
[Anything unresolved that needs a decision next session]
```

#### 2b. `memory/session-log.md` — PREPEND new entry

```
## Session [DATE] [TIME] — context-watchdog save
**Reason:** Auto-save at 15% context
**Duration:** [approximate session length]

### Completed this session
- [bullet list, specific]

### In progress at save
- [exact task] — [exact stopping point]

### Key decisions made
- [decision]: [why]

### Files changed
- [filepath]: [what changed and why]

### Resume instruction
Say: "resume" — PRIORITY-WORK.md has exact next step
```

#### 2c. `memory/errors.md` — APPEND any new errors found

If any bugs were discovered or fixed this session, append:
```
## [DATE] — [error title]
Root cause: [why it happened]
Fix applied: [what solved it]
Prevention: [rule to not repeat it]
```

If no new errors: skip this file.

---

### PHASE 3 — GIT COMMIT EVERYTHING

Run these commands in exact order:

```bash
# Stage all changed files
git add -A

# Verify what's being committed — check this output
git status

# Commit with a descriptive message
git commit -m "wip: context-watchdog save — [BRIEF TASK DESCRIPTION]

Session auto-save triggered at ~15% context remaining.
Stopping point: [EXACT STOPPING POINT]
Next action: [EXACT NEXT ACTION FROM PRIORITY-WORK.md]

Completed this session:
- [item 1]
- [item 2]

Tests: [passing/failing — if failing, list which ones]"

# Push to remote so work is safe
git push
```

**If git push fails** (no remote, auth issue, etc.):
- Stash with `git stash push -m "context-watchdog [timestamp]"`
- Note the stash in PRIORITY-WORK.md
- Continue to Phase 4 — don't block on push failure

**If there are uncommitted changes that shouldn't be committed yet**
(e.g. half-written migration):
- Stash them: `git stash push -m "incomplete: [description]"`
- Note the stash name in PRIORITY-WORK.md under CRITICAL CONTEXT

---

### PHASE 4 — HANDOFF MESSAGE

Print this exact block to the user. Do not summarize or shorten it.
This message is the user's complete resume kit.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONTEXT WATCHDOG — SESSION SAVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Context remaining: ~15% — stopping now before
  quality degrades.

  WHAT WAS COMPLETED THIS SESSION
  ────────────────────────────────
  [bullet list from PRIORITY-WORK.md]

  STOPPING POINT
  ──────────────
  [exact description — file, function, line if relevant]

  EVERYTHING IS SAVED
  ───────────────────
  ✅ memory/PRIORITY-WORK.md  — exact next action
  ✅ memory/session-log.md    — full session record  
  ✅ git commit + push        — [commit hash]

  TO RESUME — start a new session and say:
  ──────────────────────────────────────────

    resume

  Claude will read PRIORITY-WORK.md and continue
  exactly where we stopped.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then STOP. Do not write any more code after this message.
Do not start any new task. The session is over.

---

## The RESUME flow (what happens next session)

When the user says "resume" in a new session:

1. Read `memory/PRIORITY-WORK.md` — full content
2. Read last entry in `memory/session-log.md`
3. Check git log: `git log --oneline -5`
4. Print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESUMING SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Last saved: [timestamp from PRIORITY-WORK.md]
  
  COMPLETED LAST SESSION
  [list from PRIORITY-WORK.md]

  PICKING UP AT
  [exact next action from PRIORITY-WORK.md]

  Starting now.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then immediately start the next action without asking questions.

---

## Early warning — 25% context

At 25% context remaining, before the watchdog triggers:

1. Do NOT start any task that would take more than 
   10 minutes to complete
2. Finish the current task, run tests, commit
3. Print a brief warning:

```
⚠️  Context at ~25%. Finishing current task then 
    saving session. Not starting new large tasks.
```

This gives the user a heads up and ensures the current
task completes cleanly before the 15% hard stop.

---

## Edge cases

**What if 15% hits mid-test-run?**
Let the test run complete. Read the output. Fix any
failures if they are small (< 5 min). Then save.
Never commit red tests unless you explicitly mark them
as skipped with a reason.

**What if 15% hits during a database migration?**
Let the migration finish. Run `alembic upgrade head`
to completion. Verify DB state. Then save.

**What if there is no git repo?**
Write memory files only. Note in handoff message:
"⚠️ No git repo — changes NOT committed. 
Save your work manually before closing."

**What if memory/ directory doesn't exist?**
Create it: `mkdir -p memory`
Then write all files as normal.

**What if the task literally cannot reach a clean stop?**
(e.g. mid-way through a 500-line refactor with no 
compilable checkpoint)
- Stop at the end of the current function
- Add a `# CONTEXT-WATCHDOG-STOP` comment at the exact
  line where you stopped
- Note the comment location in PRIORITY-WORK.md
- The next session searches for this comment to resume

---

## Why this matters

Without this skill, hitting context limit means:
- Claude degrades silently (shorter responses, more errors)
- Work in progress is lost or must be re-explained
- The user doesn't know what was finished vs abandoned
- Next session starts cold with no context

With this skill:
- Clean stop at a logical boundary every time
- Full state persisted to git
- Next session resumes in seconds with "resume"
- Zero work lost, ever
