# Fix: Implement a Bug Fix

Implement a bug fix based on confirmed triage findings with minimal change.

## Usage

```
/fix <issue#>
```

**Arguments:**
- `<issue#>` (required) — GitHub issue number with completed triage

## Behavior

Reads triage findings (root cause + reproduction test + test acceptance criteria), promotes the test, implements minimal fix, and verifies with evidence.

**Core principle:** Minimal fix for root cause. Promote the test. Verify with evidence.

**Non-blocking:** In loop mode, posts `[FIX_COMPLETE]` marker and moves to next item.

## Process

1. **Review triage findings** — Root cause, file/line locations, reproduction test, test criteria
2. **Promote reproduction test** — Move from scratch to permanent test location
3. **Confirm test still fails (RED)** — Baseline proof the bug exists
4. **Implement minimal fix (GREEN)** — Smallest change to resolve root cause
5. **Confirm test passes + no regressions** — Run reproduction test and full suite
6. **Change summary** — Present files changed and test results

## Output

**Terminal:**
```
Fix complete for issue #123:

Files changed:
- src/auth/login.py: Increased timeout from 5s to 30s
- tests/auth/test_login.py: Promoted reproduction test

Test results:
✓ Reproduction test: PASS
✓ Unit tests: PASS (12/12)
✓ Integration tests: PASS (5/5)

Next command: /test (for full gate run) or /commit
```

**GitHub Issue:**
Posts `[FIX_COMPLETE]` marker with change summary and test results.

## Prerequisites

- Triage completed with `[TRIAGE_READY]` marker
- Root cause confirmed with reproduction test
- On a feature branch (e.g., `fix/<issue#>-...`)
- Project-specific fix context (`.claude/shared/fix-project.md`) if it exists

## Integration

**Invokes:**
- **superpowers:bug-fix** skill — implements the fix

**Preceded by:**
- `/triage <issue#>` — must complete first

**Followed by:**
- `/test` — for full CI gate validation
- `/commit` — when ready to create PR

## Examples

**Fix a confirmed bug:**
```
/fix 123
```

**In loop mode:**
Loop orchestrator automatically calls fix for items in the Fix stage.

## Scope Rules

- Only fix what triage identified — don't expand scope
- If additional bugs discovered: note them for separate issue
- If fix more complex than expected: stop and discuss
- No "while I'm here" improvements
- No bundled refactoring

## Error Handling

**Configuration errors:**
- Triage not complete → Stop, suggest `/triage <issue#>` first
- No reproduction test → Stop, return to triage
- Not on feature branch → Stop, suggest creating branch

**Processing errors:**
- Test passes before fix → Investigate what changed, don't proceed
- Test still fails after fix → Iterate on code, not test
- Regressions introduced → Fix side effects before proceeding
- Fix requires >3 attempts → Root cause may be wrong, return to triage

**Scope expansion:**
- Fix touches files not in triage → Flag and stop
- Fix requires architecture changes → Stop, suggest `/write-plan <issue#>`

## Tips

**Keep fixes minimal:**
- Only change what's needed to fix the root cause
- Follow existing code patterns
- Don't refactor while fixing

**Test-first workflow:**
- Reproduce the failure (RED)
- Fix the code (GREEN)
- Verify no regressions (STILL GREEN)

**If stuck:**
- After 3 failed attempts, reassess
- May need to return to triage with new evidence
- Discuss with handler before continuing

## Next Steps After Fix

1. Review change summary and test results
2. Run `/test` for full CI gate validation
3. If gates pass, run `/commit` to create PR
4. If user-facing changes, consider user acceptance testing first
