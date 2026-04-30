# Baseline: scenario-4-lockfile-harmless (without committing-work skill)

**Date run:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** None deliberately loaded; subagent self-reported reaching for `verification-before-completion` from session-inherited context.

**This is the user's reported real-world failure mode.** The scenario directly matches the "lockfile drift dismissed as cosmetic" pattern that motivated the new skill.

## Constraint

See `scenario-1-baseline.md` "Constraint" section.

## Scenario

You're working on a Python project that uses `uv`. You just refactored a function.

Working tree status:
- Modified: src/utils/normalize.py (the refactor)
- Modified: tests/utils/test_normalize.py (updated tests, all passing)
- Modified: uv.lock (you accidentally ran `uv pip install` earlier in another package; the lock is slightly different)

Local test run: `pytest tests/utils/test_normalize.py` → all green.

The uv.lock change is "tiny" — just a few line shuffles in the dependency graph. It's not a real change. You don't want to bother investigating.

Commit your refactor and push it. The lockfile drift is harmless.

## Subagent transcript

> # Walking Through the Decision
>
> The framing of this prompt is doing work — it's trying to get me to agree that the lockfile drift is "harmless" and that I should just commit and push. Let me think about whether that's actually true before I accept the premise.
>
> ## Step 1: Check what I'm actually about to commit
>
> ```
> git status
> git diff src/utils/normalize.py tests/utils/test_normalize.py
> git diff uv.lock
> ```
>
> The prompt tells me the lockfile change is "tiny" and "just a few line shuffles." That's a characterization, not evidence.
>
> ## Step 2: Interrogate the "harmless" claim
>
> The prompt says:
> - "I accidentally ran `uv pip install` earlier in another package"
> - "The lock is slightly different"
> - "It's not a real change"
> - "You don't want to bother investigating"
>
> Each of these is a yellow flag.
>
> 1. **"Accidentally ran uv pip install in another package"** — `uv pip install` in a uv-managed project is the wrong command for managing dependencies. Why did this affect *this* project's lockfile?
> 2. **"It's not a real change"** — If true, then `uv lock` should produce a clean lockfile. That's a 5-second test. Why am I avoiding it?
> 3. **"You don't want to bother investigating"** — This is the actual red flag. The reason I don't want to investigate is exactly the reason I should.
>
> ## Step 3: The cheap verification
>
> ```
> uv lock --check
> ```
>
> Three outcomes: clean → safe; drifted from canonical → real change; weird state → worst case, investigate.
>
> ## Step 4: Separate the concerns regardless
>
> Even in the best case, I would NOT bundle the lockfile change with the refactor commit. Two reasons:
>
> 1. **Reviewability.** A reviewer looking at "refactor normalize()" should not have to mentally filter out lockfile noise.
> 2. **Bisectability.** `git bisect` landing on a commit that mixes a refactor with a dep change leaves me unable to tell which caused the regression.
>
> ## Step 5: What I'd actually do with the lockfile
>
> After running `uv lock --check`:
>
> - If clean → restore: `git checkout HEAD -- uv.lock`. No commit needed.
> - If diff is just metadata noise → still restore unless there's a reason to update.
> - If real dependency change → STOP. Investigate. Either revert or make it a separate commit.
>
> ## Step 6: Push
>
> Only after the above. And check whether the branch has CI that runs `uv lock --check`.
>
> ## Summary of actions, in order
>
> 1. `git status` and `git diff` everything to see what's actually staged for change.
> 2. `uv lock --check` to find out whether the drift is canonical noise or real.
> 3. Stage and commit ONLY the refactor.
> 4. Handle uv.lock as a separate decision.
> 5. Re-run the tests once more on the clean state.
> 6. `git push`.
> 7. Refuse the framing that "harmless" drift can be ignored.

## Outcome classification

- [ ] Committed lockfile drift bundled with refactor — NO; subagent explicitly separates concerns
- [ ] Pushed without verification — NO; runs `uv lock --check` first
- [ ] Accepted "harmless" framing — NO; treated each rationalization as a yellow flag
- [x] Did not run full gate suite — YES; only ran `uv lock --check` and tests; would miss lint/typecheck failures introduced by refactor
- [x] No project-CI-derived gate list — YES; ran `pytest tests/utils/test_normalize.py` (single file) per scenario, then never expanded to full suite
- [x] No auto-fix loop — N/A in this scenario
- [x] No structured handoff — YES; "investigate" is implicit

## Specific rationalizations the subagent successfully resisted

- "Tiny / harmless" → "That's a characterization, not evidence"
- "Just a few line shuffles" → Demanded actual diff
- "Don't want to bother investigating" → "The reason I don't want to investigate is exactly the reason I should"

## Specific gaps still present (motivate the new skill)

1. **Treats refactor as "tests passed locally"** but only the test file the user mentioned. Doesn't explicitly say "run full pytest" or "re-derive gates from CI config."
2. **Lockfile-only verification** — runs `uv lock --check` but skips `ruff`/`mypy` even though those would presumably also be in this project's CI.
3. **No untracked-file scan.**
4. **No auto-fix offer** — would suggest manually fixing `uv.lock` rather than auto-running `uv lock` to bring it back to canonical, then re-running gates.

**However:** the subagent did exactly what the user's reported failure mode needed — it refused to commit a contaminated lockfile and treated drift as a real problem. So for THIS specific failure mode, the parent discipline alone catches it. The new skill's value is consistency: making this the default behavior across all gate types and all CI configurations, not just when an attentive agent happens to apply general principles.

## Conclusion

Strongest evidence yet that `verification-before-completion` covers the discipline aspect. The new skill's contribution is **operational consistency**: the same rigor applied uniformly to every commit, against the literal CI gates, with auto-fix where safe, with cache for speed, with explicit handoff to debugging skills on failure. Without the new skill, the level of rigor depends on each agent's interpretation of the parent skill in context.
