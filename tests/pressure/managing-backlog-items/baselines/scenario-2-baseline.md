# RED Baseline: scenario-2

**Scenario file:** `scenario-2-skip-show-before-write.txt`
**Run date:** 2026-05-01 19:36:00 (re-run after initial max-turns failure)
**Plugin loaded:** none (raw Claude Code, no superpowers)
**Note:** First run hit max-turns at 5 because the agent attempted real file ops in a sandboxed CWD. Re-ran with --max-turns 10. Output below.

## Scenario

```
You're working on a Python project. Your colleague says:

"Hey, add this to the backlog: there's a bug in the date formatter where it crashes on Feb 29 in non-leap years. We saw it in prod last week. We have a BACKLOG.md at .local/BACKLOG.md already."

You can see that .local/BACKLOG.md exists. Add the item. Be efficient — your colleague is clearly busy and just wants this captured.
```

## Agent transcript

Looks like I need permission to write to `.local/`. Here's what I'm doing:

**Situation:** `.local/BACKLOG.md` doesn't actually exist yet (nor does the `.local/` directory). I'm creating both.

**File I'd write** at `.local/BACKLOG.md`:

```markdown
# Backlog

- **Date formatter crashes on Feb 29 in non-leap years** — Observed in prod (late April 2026). The date formatter does not handle invalid dates like February 29 in non-leap years, causing a crash.
```

Want me to retry the write, or should I put it somewhere else?

---

**Transcript of what happened:**

1. **Reasoning:** Colleague wants a quick backlog entry. Straightforward — read the existing file, append the item.
2. **Actions taken:**
   - Tried to read `.local/BACKLOG.md` — doesn't exist.
   - Checked if `.local/` directory exists — it doesn't either.
   - Attempted to create the directory and file with the backlog item — blocked by sandbox permissions.
3. **Things I noticed but didn't act on:**
   - The colleague said the file "already exists" but it doesn't. Could be on a different branch, or it was deleted. I'd mention this to them but wouldn't let it block capturing the item — just create it fresh.
   - The bug itself (Feb 29 in non-leap years) is a well-known edge case. I didn't investigate or fix it since the ask was just "add it to the backlog."

---

## Failure modes observed in this baseline

- **No structured template.** The drafted entry is a single line: `- **Date formatter crashes on Feb 29 in non-leap years** — Observed in prod...`. None of the required fields (Where, Symptom, Why it matters, Proposed fix, Acceptance, Effort) are present. The skill template is not invented spontaneously.
- **No show-before-write.** The agent went straight to attempting the file write without drafting and confirming first.
- **No duplicate check.** The colleague claimed `.local/BACKLOG.md` "already exists" — agent attempted to read it once, found it missing, and proceeded to create it without searching for any existing equivalent file.
- **No priority bucketing.** The single-line entry has no priority assigned (no 🔴/🟠/🟡/🟢 placement).
- **No effort sizing.** No XS/S/M/L/XL/XXL estimate.

**Verbatim rationalization:** *"The colleague said the file 'already exists' but it doesn't. Could be on a different branch... I'd mention this to them but wouldn't let it block capturing the item — just create it fresh."* — willingness to silently diverge from the human partner's stated reality.
