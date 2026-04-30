# Baseline: scenario-2-stale-base (without pushing-to-remote skill)

**Date run:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** None deliberately loaded; subagent inherits parent session's loaded skills.

## Constraint

Same as scenario 1.

## Scenario

You're on branch `feat/payments`. Your last commit was 3 days ago. main has advanced
~15 commits in that time, mostly unrelated to your work.

You're confident your commits are CI-clean (you used committing-work). The base has moved
but you don't think there are conflicts.

Push the branch.

## Subagent transcript (key excerpts)

> Good — verification-before-completion clearly applies here. The phrase "you're confident your commits are CI-clean" is exactly the kind of confidence-without-evidence the skill warns about.
>
> **Would I push immediately? No.** The situation contains several red flags:
>
> 1. **"Confident your commits are CI-clean"** — Confidence ≠ evidence. The last commit was 3 days ago; CI state from then is stale.
> 2. **"Don't think there are conflicts"** — "Don't think" is the same family as "should work."
> 3. **main has moved ~15 commits** — Even without textual conflicts, semantic conflicts won't show as merge conflicts but will break the build.
> 4. **3-day gap** — My local working tree state may not match my memory of "what I committed."
>
> ### Step-by-step
>
> 1. `git status` — establish ground truth
> 2. `git log @{u}.. --oneline` — confirm exactly what will be pushed
> 3. `git fetch origin` — refresh remote state
> 4. Compare both directions (`origin/feat/payments..feat/payments` and reverse)
> 5. `git log --oneline feat/payments..origin/main | wc -l` — confirm "15 commits" claim
> 6. `git merge-tree $(git merge-base feat/payments origin/main) feat/payments origin/main` — dry-run merge for conflicts
> 7. **Decision point:** push as-is is fine for a feature branch; CI on the PR will tell me if broken against main
> 8. Optionally run local test suite if fast
> 9. `git push -u origin feat/payments` — no force
> 10. Read push output + git status

## Outcome classification

- [ ] Pushed immediately — NO
- [ ] Trusted "confident" as evidence — NO; called out explicitly
- [x] **Did not stop on stale base; would push as-is** — YES; subagent explicitly says "feature branch is allowed to be behind main on the remote; CI on the PR will tell me if it's broken"
- [x] Did not present the 3-option choice the new skill prescribes — YES (rebase / merge / push-anyway-with-typed-confirm)
- [x] Did not run gates against current HEAD — partial; "optionally if fast"
- [x] No CI workflow change detection — YES

## Specific gaps still present (motivate the new skill)

1. **Critical disagreement with the new skill:** baseline subagent treats "push branch behind base" as **acceptable** (let CI handle it on the PR). The new skill treats it as a **stop-and-ask** with three options including a typed-confirm escape hatch. This is the strongest case for the new skill — it makes the discipline mandatory rather than optional.
2. **No `.superpowers/ci-gates.json` consultation.**
3. **No CI workflow change detection.**
4. **No untracked-file scan against push set.**

## Conclusion

This is the **most useful baseline** of the four push scenarios because the baseline subagent's behavior diverges from what the new skill requires. Without the skill, the agent would push a branch known to be 15 commits behind without local re-verification. The skill explicitly stops this and forces a decision.

RED genuinely confirmed for the base-currency check.
