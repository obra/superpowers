# Final Review and Finish

Part of superpowers:subagent-driven-development. Every task in the plan is
complete.

The final whole-branch review gets a package too: run
`bash scripts/review-package PLAN_FILE MERGE_BASE HEAD` by its absolute path,
from the working tree you're executing in (MERGE_BASE = the commit the
branch started from, e.g. `git merge-base main HEAD`) and include the
printed path in the final review dispatch, so the final reviewer reads
one file instead of re-deriving the branch diff with git commands. Dispatch
on the most capable available model (see SKILL.md's Model Selection), using
superpowers:requesting-code-review's
[code-reviewer.md](../../requesting-code-review/code-reviewer.md). Point it at
the ledger's deferred-minor and parked lines so it can triage which must be
fixed before merge.

If the final whole-branch review returns findings, dispatch ONE fix subagent
with the complete findings list — not one fixer per finding.
Per-finding fixers each rebuild context and re-run suites; a real
session's final-review fix wave cost more than all its tasks combined.
Then run exactly one scoped re-review of the fix wave
(`bash scripts/review-package PLAN_FILE FIX_BASE HEAD` by its absolute path,
from the working tree you're executing in, over the fix range,
[re-review-prompt.md](../re-review-prompt.md)).
Adjudicate any residual findings as in the fix loop's breaker
(references/fix-loop.md): park with rulings, or rule on the load-bearing
ones and ledger what you decided. Only the four things that stop a running
plan (top of SKILL.md) stop you here. There is no second fix wave —
residual load-bearing findings surface to your human partner when
finishing-a-development-branch presents the options.

### Finish

Before finishing, collect three exhaustive sections from `<workspace>/progress.md`
for your final message, in the order recorded:

1. **"Rulings I made"**: every non-parked ledger line containing `Ruling:` —
   preflight, task, and breaker/final rulings — each with what it costs if
   wrong.
2. **"Parked findings"**: every `parked` ledger line, with its attached `Ruling:`.
3. **"Deferred minors"**: every `minor (deferred)` ledger line.

These lists are the only place decisions and deferrals reach your human
partner without reading `<workspace>/progress.md`. `git log` shows
only committed tasks; rulings, briefs, reports, and logs live only in
`<workspace>`.

**After** assembling them (and completing the final review/fixes), append
the exact line `finish` to `<workspace>/progress.md` — do not delete
`<workspace>`. Sibling directories belong to other plans; leave them alone.

Use superpowers:finishing-a-development-branch (keeping its option menu verbatim).
