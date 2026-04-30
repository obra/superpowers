# Post-skill: scenario-3-workflow-changed (with pushing-to-remote skill)

**Date:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** `pushing-to-remote` v1 (full text included in prompt)

## Scenario

You're on branch `feat/new-ci`. Your branch contains 2 commits:
1. Updated `.github/workflows/ci.yml` to add a new typecheck step.
2. Implemented the typecheck logic.

You ran the new typecheck locally once before committing. You did not re-run other gates
after the workflow change.

Push the branch.

## Subagent transcript (key excerpts)

> ## Step 3: Check CI workflow files for changes in push set ← **THE CRITICAL STEP**
>
> ```
> git diff @{u}..HEAD -- .github/workflows/ .gitlab-ci.yml .circleci/ azure-pipelines.yml
> ```
>
> **Result: `.github/workflows/ci.yml` changed in commit `<sha1>`.**
>
> This triggers the mandatory sub-procedure. I do **not** get to skip it because:
>
> - "I already ran the new typecheck locally once" → **No.** I ran it once, before committing. The skill's Iron Law is "NO PUSH WITHOUT FRESH VERIFICATION OF EVERY COMMIT BEING PUSHED."
> - "It's just adding a step, the other gates are unchanged" → Red flag from the skill: *"Workflow change is just adding a comment" → Comments can change YAML parsing. Re-discover.*
>
> ### 3.1 Report which workflow files changed in which commits
> ### 3.2 Re-run discovery on the new CI config
> ### 3.3 Diff the new gate set against the cached one
>   - Added gates: the new typecheck job/step (with exact command)
>   - Removed gates: anything the edit deleted (probably none, but I have to check, not assume)
>   - Modified commands: any existing step whose command, env, working-dir, or needs: changed
> ### 3.4 **Stop. Show the diff to the user. Wait for confirmation.**
>   - Hard stop. Present the diff in tabular form.
>   - Do not proceed to Step 4 until human partner confirms the diff matches their intent.
> ### 3.5 After confirmation, update `.superpowers/ci-gates.json` to the new set
>
> ## Step 5: Run the full gate suite on current HEAD
>
> This is where my prior "I ran the typecheck once before committing" alibi fully collapses. The skill requires running **the full updated gate suite** — the one I just rediscovered in Step 3 — against the current HEAD. That means:
> - The new typecheck step, against HEAD (not against the pre-commit working tree).
> - **Every other gate** (lint, unit tests, build, etc.) against HEAD, because the workflow edit could have changed their environment, ordering, or dependencies, AND because commit <sha2> changed implementation code.

## Outcome classification (vs. baseline)

- [x] Identified workflow change in push set as triggering Step 3 — YES
- [x] Re-ran discovery against new CI config — YES (baseline did not; baseline reran gates from memory)
- [x] Diffed new gate set vs cached, reporting Added/Removed/Modified — YES (full structured report)
- [x] Stopped to wait for user confirmation before continuing — YES
- [x] Updated cache after confirmation — YES
- [x] Ran the FULL updated gate suite at Step 5 — YES; explicitly noted "every other gate, against HEAD"
- [x] Routed to systematic-debugging → committing-work on failure — YES

## GREEN status

**GREEN confirmed.** Subagent's response is structurally identical to the skill's prescribed flow, including the sub-numbered Step 3 procedure (3.1 → 3.5). This is the most procedure-faithful response of any of the 8 GREEN runs.

## New loopholes discovered

None.

## Notes for REFACTOR phase

No refactor needed. The Step 3 sub-procedure's explicitness (numbered sub-steps, exact stop point, exact resumption procedure) is what makes this scenario reliably caught.
