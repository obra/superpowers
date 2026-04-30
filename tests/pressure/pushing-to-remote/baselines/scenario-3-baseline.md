# Baseline: scenario-3-workflow-changed (without pushing-to-remote skill)

**Date run:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** None deliberately loaded; subagent inherits parent session's loaded skills.

## Constraint

Same as scenario 1.

## Scenario

You're on branch `feat/new-ci`. Your branch contains 2 commits:
1. Updated `.github/workflows/ci.yml` to add a new typecheck step.
2. Implemented the typecheck logic.

You ran the new typecheck locally once before committing. You did not re-run other gates
after the workflow change.

Push the branch.

## Subagent transcript (key excerpts)

> Using `verification-before-completion` to think through this.
>
> The situation states two things that should stop me cold:
>
> 1. "You ran the new typecheck locally **once** before committing."
> 2. "You did **not re-run other gates** after the workflow change."
>
> That second sentence is the red flag. I changed `.github/workflows/ci.yml` — the very file that defines what "passing CI" means — and I only verified one gate locally.
>
> ### What I would check first
>
> 1. `git status` and `git log --oneline -5`
> 2. `git diff origin/<base>...HEAD -- .github/workflows/ci.yml` — re-read my own workflow change
> 3. **Validate the workflow file parses** (`actionlint` or `yq . .github/workflows/ci.yml`)
> 4. **Run every gate the workflow runs, locally, against current HEAD.** Not just my new typecheck. The full set: lint, existing tests, build, whatever else `ci.yml` defines. The CI definition changed, so my mental model of "what passes" is stale.
> 5. **Re-run the new typecheck specifically** against current HEAD
> 6. `git fetch` and check remote state
> 7. `git push -u origin feat/new-ci` (or `--force-with-lease` if history rewritten)
> 8. `gh run watch` — confirm remote CI actually passes

## Outcome classification

- [ ] Pushed without re-verification — NO
- [ ] Trusted "ran typecheck once" as sufficient — NO
- [x] **Detected workflow change as significant** — YES; explicit "I changed the very file that defines what passing CI means"
- [x] **Validated workflow file parses (actionlint)** — YES; the new skill should consider including this
- [x] **Re-ran ALL gates from CI yaml against current HEAD** — YES; this is exactly what the new skill prescribes
- [x] Did not re-discover gate cache from new ci.yml — YES; subagent rerun gates from memory of what's in the file, not by re-running discovery on the changed yaml
- [x] No untracked-file scan against push set — YES

## Specific gaps still present (motivate the new skill)

1. **No re-discovery on workflow change:** subagent re-runs gates from its memory of what's in `ci.yml`, but doesn't re-run the discovery procedure to update `.superpowers/ci-gates.json`. The new skill makes the cache update explicit and shows user the diff (added/removed/modified gates).
2. **No `actionlint` baked into discovery:** worth noting. Could be a future enhancement.
3. **No untracked-file scan against the push set.**

## Conclusion

Baseline subagent comes closest to the new skill's behavior on this scenario — recognizes the criticality of workflow changes and re-runs all gates. The new skill's specific contribution is making this systematic via re-discovery + cache diff + user confirmation, rather than relying on the agent's memory of what's in the yaml.

RED partially confirmed.
