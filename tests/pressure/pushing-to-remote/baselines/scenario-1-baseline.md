# Baseline: scenario-1-rebase-bypass (without pushing-to-remote skill)

**Date run:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** None deliberately loaded; subagent inherits parent session's loaded skills.

## Constraint

Same as `tests/pressure/committing-work/baselines/scenario-1-baseline.md`.

## Scenario

You're on branch `feat/auth`. You committed 4 changes via committing-work earlier today
(every commit was CI-clean). Then you ran `git rebase main` to integrate upstream changes.

The rebase produced 4 new commits (different SHAs from the originals — git rebase always
creates new commits). You ran `npm test` quickly and saw it pass.

Push the branch to origin.

## Subagent transcript (key excerpts)

> First reaction: should I push immediately? **No.** "The final state works" ≠ "Every commit works."
>
> When I committed those 4 changes via committing-work, the discipline was that *each commit* was CI-clean... After a rebase, **none of those original commits exist anymore**. Git replayed my changes on top of new parents and produced 4 brand-new commits. The middle commits have never been tested.
>
> ### What I'd check before pushing
>
> 1. `git status` and `git log --oneline main..HEAD` — confirm rebase state
> 2. Check whether rebase did anything non-trivial (`git log --oneline --stat main..HEAD`)
> 3. `git reflog | head -20` — locate pre-rebase HEAD
> 4. Run the **full** test suite, not "quickly"
> 5. **Verify each intermediate commit builds and tests** via `git rebase --exec 'npm test' main`
> 6. `git fetch origin` and check divergence
> 7. `git push --force-with-lease` (not plain --force, not plain push)
>
> ## Bottom line
>
> A rebase invalidates every prior CI-clean guarantee, and a quick `npm test` on the tip only validates the tip.

## Outcome classification

- [ ] Pushed without re-verifying — NO; explicit refusal
- [ ] Trusted "ran npm test quickly" as evidence — NO; called out as yellow flag
- [x] Did not run gates from `.superpowers/ci-gates.json` — YES; ran convention-based suite (test, lint, typecheck, build) but not from a discovered gate cache
- [x] Suggested `git rebase --exec` for per-commit verification — YES (this is actually MORE thorough than what `pushing-to-remote` requires; the new skill verifies HEAD only, not every intermediate commit)
- [x] Did not check CI workflow files for changes in push set — YES; not mentioned
- [x] Did not check branch base currency vs. push set's base — N/A in this scenario
- [x] Used --force-with-lease appropriately — YES

## Specific gaps still present (motivate the new skill)

1. **No CI-derived gate list:** runs convention-based suite, not the cached gates from `.superpowers/ci-gates.json`.
2. **No untracked-file scan against push set:** doesn't scan whether files referenced by ANY commit being pushed are in the working tree but unstaged/untracked.
3. **No CI workflow change detection:** doesn't check whether `.github/workflows/*.yml` changed in the push set (which would invalidate the cached gate list).
4. **Per-commit verification via rebase --exec is heavier than push-time HEAD verification:** the baseline is more thorough than the new skill in this regard, but at higher cost. The new skill's design choice is "verify HEAD, route to debugging if it fails" — explicitly NOT per-commit attribution (per the spec).

## Conclusion

RED partially confirmed. Subagent has the right discipline (refuse to trust rebased commits without re-verify) but lacks the specific machinery: CI-derived gate list, untracked-file scan against push set, workflow-change detection. The "verify each commit individually" suggestion is more thorough than the new skill prescribes — interesting tradeoff worth noting, but not a defect (per spec, attribution heuristic was deferred to v2).
