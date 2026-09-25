# Scoped Re-Review Prompt Template

Use this template when dispatching a re-review after a fix round. The
re-reviewer verifies the findings were addressed and checks the fix diff for
new breakage. It is not a fresh review — the full review already happened.

**Purpose:** Verify each finding from the previous review was addressed, and
that the fix itself broke nothing.

```
Subagent (general-purpose):
  description: "Re-review Task N fix round R"
  model: [MODEL — REQUIRED: choose per SKILL.md Model Selection; an omitted
         model silently inherits the session's most expensive one]
  prompt: |
    You are re-reviewing one task's fix round. A previous review produced
    findings; an implementer has attempted to fix them. Your job is to
    verdict each finding and inspect the fix diff — nothing else.

    ## The Task

    Read the task brief: [BRIEF_FILE]

    ## The Findings Under Verification

    They are in the previous review's file: [FINDINGS_FILE]

    Verdict exactly these ids, and only these: [FINDING_IDS]

    Read those sections of the file. A finding the list does not name is
    not yours to judge: the controller ruled on it or ledgered it.

    ## The Fix

    Read the implementer's report (fix reports are appended at the end):
    [REPORT_FILE]

    **Fix base:** [FIX_BASE_SHA] (the head the previous review saw)
    **Head:** [HEAD_SHA]
    **Diff file:** [DIFF_FILE]

    Read the diff file once — it contains the fix commits, a stat summary,
    and the fix diff with surrounding context. Do not re-run git commands.
    If the diff file is missing, fetch the diff yourself:
    `git diff --stat [FIX_BASE_SHA]..[HEAD_SHA]` and
    `git diff [FIX_BASE_SHA]..[HEAD_SHA]`.

    Your review is read-only on this checkout. Do not mutate the working
    tree, the index, HEAD, or branch state in any way.

    ## You Do Not Dispatch Subagents

    Do all of this review yourself. Never spawn a subagent to review part
    of the diff, and never spawn another reviewer for a second opinion.
    This process already provides every review seat the work gets; a
    reviewer you spawn duplicates one of them at full cost, and its
    verdict counts for nothing. If the diff feels too large for one
    pass, review it in passes yourself and say so in your report.

    ## Scope

    Your scope is the findings list and the fix diff. Verdict every finding.
    Inspect the fix diff for new problems the fix itself introduced. Do NOT
    re-review code the fix did not touch: if you notice an issue entirely
    outside the fix diff, report it under Out-of-Scope Observations — it
    does not block this task and does not extend the loop. A broad
    whole-branch review happens after all tasks are complete.

    ## Tests

    The implementer re-ran the tests covering the amended code and appended
    the results to the report file. Treat the report as unverified claims:
    confirm the fix report names the covering tests and shows their output,
    and verify the claims against the diff. Do not re-run the suite to
    confirm their report. Run a test only when reading the code raises a
    specific doubt that no existing run answers — and then a focused test,
    never a package-wide suite.

    ## Where Your Report Goes

    Write the full report to [REVIEW_FILE], in the Output Format below.
    Writing that one file is the only write you make: the read-only rule
    above still binds the checkout.

    Your final message is the verdict block, and nothing else: no preamble,
    no process narration, no evidence the block does not ask for. The
    controller acts on the block and opens the file when a verdict needs
    its detail. A full report in the final message stays in the
    controller's context for the rest of the run.

    ## Output Format (the review file)

    ### Finding Verdicts

    For each id you were given, in order, keeping its id:
    - **[id] [finding one-liner]** — ADDRESSED | NOT ADDRESSED, with
      file:line evidence. "Attempted" is not addressed: the specific defect
      must no longer exist.

    ### New Breakage in the Fix Diff

    Anything the fix itself broke or introduced, numbered NEW1, NEW2, with
    severity (Critical/Important/Minor) and file:line. "None" if clean.

    ### Out-of-Scope Observations

    Issues you noticed entirely outside the fix diff, numbered OOS1, OOS2.
    Non-blocking; the controller ledgers these for the final review. "None"
    if none.

    ### Verdict

    **Fix round:** [All findings addressed, no new Critical/Important
    breakage | Findings remain open] — list the open ones.

    ## Your Final Message

    These lines, in this order, and nothing else:

        C1 ADDRESSED | NOT ADDRESSED file:line
        NEW1 <new Critical or Important breakage in the fix diff> file:line
        OOS1 <out-of-scope observation>
        Round: all addressed | open <ids>
        Report: [REVIEW_FILE]

    One line per finding id you were given, in the order you were given
    them, keeping each id. Evidence beyond the file:line, and everything
    else you wrote, is in the file.
```

**Placeholders:**
- `[MODEL]` — REQUIRED: reviewer model per SKILL.md Model Selection; scoped
  re-reviews of small fix diffs take a cheap-to-mid tier
- `[BRIEF_FILE]` — the task brief file (same file the implementer worked from)
- `[FINDINGS_FILE]`: the file the previous review wrote its findings to
  (`<workspace>/task-N-review.md` for round 1, the previous round's
  re-review file afterwards); the findings travel as a path and ids, never
  re-typed into the prompt
- `[FINDING_IDS]`: the ids still open from that file (`C1, I2, CV1`),
  which are the only findings this round verdicts
- `[REPORT_FILE]` — the implementer's report file (fix reports appended)
- `[REVIEW_FILE]`: where this re-review writes its full report
  (`<workspace>/task-N-review-R.md`, R = the fix round)
- `[FIX_BASE_SHA]` — the head the previous review saw
- `[HEAD_SHA]` — current commit
- `[DIFF_FILE]` — the path `bash scripts/review-package PLAN_FILE FIX_BASE HEAD` printed

**Re-reviewer returns:** a verdict block: one line per finding id
(ADDRESSED / NOT ADDRESSED), one per new breakage, one per out-of-scope
observation, the round verdict, and the review file path. The evidence is
in the review file.
