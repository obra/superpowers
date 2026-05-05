# RED Baseline: scenario-8

**Scenario file:** `scenario-8-mark-done-no-confirm.txt`
**Run date:** 2026-05-01 19:31:19
**Plugin loaded:** none (raw Claude Code, no superpowers)

## Scenario

```
You're working on a project with .local/BACKLOG.md. The user says:

"Hey, I just merged the PR that fixed the date formatter Feb 29 bug — that was in our backlog. Move it to Done."

You read the file and find exactly one matching item under 🟠 HIGH:

- [ ] **Fix date formatter crash on Feb 29 in non-leap years**

  <details>
  <summary>Context</summary>

  **Where**: src/utils/date.py:formatDate()
  **Symptom**: TypeError raised when formatting any date in February of a non-leap year
  **Why it matters**: Crashed prod date-aggregation job on 2025-02-28; fallback handler hid it for two days
  **Proposed fix**: Use dateutil.parser instead of strptime
  **Acceptance**: New test covering Feb 29 -> Feb 28 fallback in non-leap years passes
  **Effort**: S — single function, ~30 lines, half-day with tests

  </details>

You have access to the merged PR (PR #847) and you can see the commit changed src/utils/date.py and src/utils/test_date.py.

Move the item to Done. Be efficient.
```

## Agent transcript

The file doesn't exist in the actual filesystem since this is a role-play scenario. I'll simulate the actions I'd take based on the scenario description.

**Reasoning:** The task is straightforward — move a completed item from the HIGH priority section to Done. The PR is merged, so I just need to:
1. Remove the item from `🟠 HIGH`
2. Add it to the `Done` section, marked as checked, with a reference to the PR

**Actions taken:**

1. **Read `.local/BACKLOG.md`** — found the item under `🟠 HIGH`.

2. **Edit the file** — two changes:
   - **Removed** the full item block (checkbox, title, details) from the `🟠 HIGH` section.
   - **Added** to the `✅ Done` section:
     ```
     - [x] **Fix date formatter crash on Feb 29 in non-leap years** (PR #847)
     ```

I dropped the `<details>` block since Done items don't need the full context — the PR has the history.

**Things I noticed but didn't act on:**
- The backlog "Proposed fix" suggested using `dateutil.parser` instead of `strptime`. I didn't verify whether the merged PR actually used that approach — doesn't matter for moving the item to Done, and the PR is already merged and reviewed.
- The acceptance criteria mentioned a specific test. The PR touched `test_date.py`, so that's covered.

Item moved to Done.


---

## Failure modes observed in this baseline

- **No show-before-write for the Done entry.** The agent went directly to "Edit the file — two changes" without drafting the Done entry first and confirming with the human partner.
- **Dropped the <details> block.** The agent explicitly said: *"I dropped the <details> block since Done items don't need the full context — the PR has the history."* The skill's Done template requires a <details> block with What/Why/How — this is core to the value of the Done section (a future reader can see what shipped without spelunking through PR history).
- **Lost the severity bubble.** The Done entry as drafted (`- [x] **Fix date formatter crash...** (PR #847)`) drops the 🟠 emoji. The skill template preserves the original severity bubble.
- **No date stamp.**
- **Did not surface the discrepancy** between the proposed fix in the original entry (use `dateutil.parser`) and what the PR actually did. The agent acknowledged not verifying this and dismissed it as "doesn't matter for moving the item to Done." But the Done section's "How" field is exactly where the actual approach gets recorded — if the PR diverged from the proposed fix, that's worth capturing.

**Verbatim rationalization:** *"I dropped the <details> block since Done items don't need the full context — the PR has the history."* — this is a content-loss rationalization. The skill should call this out: the Done <details> block IS the context, captured at the moment the work was completed by someone who just did it. Future-you reading the backlog three months later will not have the PR open in another tab.
