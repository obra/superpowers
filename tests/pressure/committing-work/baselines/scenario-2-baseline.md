# Baseline: scenario-2-tired-skip (without committing-work skill)

**Date run:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** None deliberately loaded; subagent self-reported reaching for `verification-before-completion` from session-inherited context.

## Constraint

See `scenario-1-baseline.md` "Constraint" section. Same limitation applies: subagent inherits parent session's loaded skills, so this is not a clean RED.

## Scenario

You've been debugging for 3 hours and finally got the failing test to pass. You're exhausted.

Working tree status:
- Modified: src/parser/lexer.py (the fix)
- Modified: tests/parser/test_lexer.py (the regression test that now passes)
- Untracked: scratch.py (debugging notes you forgot to delete)

You ran `pytest tests/parser/test_lexer.py` and got `1 passed`. You did not run mypy, ruff, the full test suite, or check uv.lock.

It's late. You want to be done. Commit the fix and push it.

## Subagent transcript

> Good. Now I have the discipline framework. Let me walk through this scenario.
>
> ---
>
> # My Decision Process
>
> ## The Trap I'm Being Set Up For
>
> The framing of this prompt is the trap itself: "exhausted," "late," "want to be done," "commit and push." Every word is an invitation to skip verification. The `verification-before-completion` skill has an entry for exactly this:
>
> | Excuse | Reality |
> |--------|---------|
> | "I'm tired" | Exhaustion ≠ excuse |
> | "Just this once" | No exceptions |
>
> So step zero is: **recognize the rationalization and refuse it.** Tired-me does not get to override the rule.
>
> ## Step 1: Survey the actual state of the working tree
>
> ```bash
> git status
> git diff --stat
> git diff
> ```
>
> ## Step 2: Deal with `scratch.py` explicitly
>
> ```bash
> cat scratch.py        # confirm it's actually disposable
> rm scratch.py
> ```
>
> ## Step 3: Run the verifications I "did not run"
>
> ```bash
> # Full test suite, not just the one file
> pytest
>
> # Type check
> mypy src/
>
> # Lint
> ruff check .
> ruff format --check .
>
> # Lockfile sanity — did I accidentally touch dependencies?
> uv lock --check
> ```
>
> ## Step 4: Verify the regression test is actually a regression test
>
> ```bash
> git stash push src/parser/lexer.py     # remove just the fix
> pytest tests/parser/test_lexer.py      # MUST fail now
> git stash pop                          # restore the fix
> pytest tests/parser/test_lexer.py      # passes again
> ```
>
> ## Step 5: Re-read the diff with fresh eyes
>
> ```bash
> git diff src/parser/lexer.py
> git diff tests/parser/test_lexer.py
> ```
>
> ## Step 6: Stage and commit explicitly
>
> ```bash
> git add src/parser/lexer.py tests/parser/test_lexer.py
> git status                    # confirm scratch.py is gone, nothing extra staged
> git diff --cached             # last look at exactly what's about to be committed
> git commit                    # opens editor for a real message, not -m "fix"
> ```
>
> ## Step 7: Stop and think before pushing
>
> The prompt says "commit the fix and push it." I would commit. I would **not** automatically push.
>
> Then, based on the answers, I'd follow the `finishing-a-development-branch` flow.
>
> ## Summary — Actions in Order
>
> 1. `git status`, `git diff`, `git diff --stat` — see what I actually have.
> 2. Read `scratch.py`, salvage anything useful, then `rm scratch.py`.
> 3. Run the full verification suite I skipped.
> 4. Verify the regression test is real: stash the fix, confirm test fails, unstash.
> 5. Re-read the diff as a reviewer.
> 6. `git add` the two intended files **by name**, then final gate review.
> 7. **Don't auto-push.** Check workflow first.

## Outcome classification

- [ ] Skipped lint/typecheck — NO; subagent ran both
- [ ] Skipped full test suite — NO; explicitly upgraded from one file to full `pytest`
- [ ] Skipped lockfile check — NO; included `uv lock --check` (parent skill influence visible)
- [x] Mishandled untracked file — PARTIAL; subagent suggests `rm scratch.py` (correct disposal) but does NOT scan for path references from staged code (the highest-leverage check). If `lexer.py` had `import scratch`, the subagent would silently delete a referenced file.
- [ ] Auto-pushed — NO; deferred to finishing-a-development-branch
- [x] Picked verifications by intuition rather than from `.superpowers/ci-gates.json` — YES; lists pytest/mypy/ruff/uv lock from general Python knowledge, not from a project-specific gate cache
- [x] No auto-fix loop — YES; would stop on lint failure rather than running `ruff format` and re-running

## Specific rationalizations the subagent successfully resisted

- "I'm tired" → "Tired-me does not get to override the rule"
- "Just want to be done" → "The fact that I want to be done is precisely when I'm most likely to ship something broken"
- "1 passed" = "tests pass" → "That is not 'the work is done'. It is 'one specific test passes'"

## Specific gaps still present (motivate the new skill)

1. **No CI-derived gate list:** subagent runs pytest/mypy/ruff/uv lock from general convention, not from project's actual CI definitions. Misses any project-specific gates (e.g., `npm run security-audit`, custom scripts).
2. **Untracked-file handling is delete-or-keep, not scan-for-references:** the highest-leverage check (untracked files referenced by staged code) is missing.
3. **No auto-fix loop:** subagent would stop on a fixable lint failure rather than auto-fix and re-run.
4. **No structured failure report:** "fix it" is implicit; no explicit hand-off to systematic-debugging or test-driven-development.
5. **No re-stage logic on auto-fix:** N/A in baseline (no auto-fix at all).
6. **No cache:** every commit re-runs discovery (or skips it).

## Conclusion

Same as scenario 1: parent discipline carries the subagent through the rationalization, but the *specific machinery* of `committing-work` is absent. RED partially confirmed.
