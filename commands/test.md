# Test: Run Testing Gates

Run CI test gates to validate code changes before committing or creating a PR.

## Usage

```
/test
/test --mode <mode>
/test --gates <gate1,gate2>
```

**Arguments:**
- `--mode` (optional) — Test mode: `smart` (default), `full`, or `targeted`
- `--gates` (optional) — Specific gates to run (comma-separated)

## Behavior

Detects what changed, runs relevant test gates, and reports structured pass/fail results.

**Core principle:** Smart detection, complete execution, structured reporting.

**Non-blocking:** In loop mode, posts `[TEST_PASS]` or `[TEST_FAIL]` marker and moves to next item.

## Modes

### Smart Mode (default)
Detect what changed and run only relevant gates:
```
/test
```

Compares current branch to base branch, categorizes changed files, runs gates for affected areas.

### Full Mode
Run all gates regardless of changes:
```
/test --mode full
```

Use before PR/merge, after rebase, or when uncertain what's affected.

### Targeted Mode
Run specific gates only:
```
/test --gates linting,unit-tests
```

Use when iterating on a specific area or re-running a failed gate.

## Process

1. **Detect changes** — Compare branch to base, categorize files
2. **Select gates** — Based on mode and file categories
3. **Execute gates** — Run all selected gates, don't stop on first failure
4. **Report results** — Summary table with pass/fail for each gate
5. **Verdict** — PASS (all passed) or FAIL (list which failed)

## Output

**Terminal:**
```
Testing gates for fix/123-login-timeout:

| Gate              | Result |
|-------------------|--------|
| Linting           | PASS   |
| Type checking     | PASS   |
| Unit tests        | PASS   |
| Integration tests | PASS   |

Verdict: PASS
All gates passed.

Next command: /commit
```

**GitHub Issue:**
Posts `[TEST_PASS]` marker with summary table.

If failures:
```
Testing gates for fix/123-login-timeout:

| Gate              | Result |
|-------------------|--------|
| Linting           | PASS   |
| Type checking     | FAIL   |
| Unit tests        | PASS   |

Verdict: FAIL

Type checking errors:
src/auth/login.py:45:12 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

Next: Fix type errors and re-run /test
```

Posts `[TEST_FAIL]` marker with error details.

## Gate Structure

Gates are defined in `.claude/shared/test-project.md` or `project-flows.json`.

Typical gate set:
- **Linting** — Code style and formatting
- **Type checking** — Static type analysis
- **Unit tests** — Component-level tests
- **Integration tests** — Cross-component tests
- **Regression tests** — Known issue verification

## Prerequisites

- On a feature branch with changes committed
- Project-specific test commands defined
- Test infrastructure set up (test runner, linters, etc.)

## Integration

**Invokes:**
- **superpowers:testing-gates** skill — runs the tests

**Preceded by:**
- `/fix <issue#>` — fix implemented, ready for validation
- Any code changes

**Followed by:**
- `/commit` — if all gates pass
- Fix code and re-run `/test` — if gates fail

## Examples

**Run smart tests after fix:**
```
/fix 123
/test
```

**Run full suite before PR:**
```
/test --mode full
```

**Re-run only failed gate:**
```
/test --gates type-checking
```

**In loop mode:**
Loop orchestrator automatically calls test for items in the Test stage.

## Error Handling

**Configuration errors:**
- No test commands defined → Stop, report which config is missing
- Test infrastructure not set up → Stop, suggest setup steps

**Processing errors:**
- Gate command fails to run → Report error, continue with other gates
- Gate timeout → Report timeout, mark as FAIL
- Resource limits exceeded → Report which gates completed

**Regression handling:**
- Regression tests fail due to intentional changes → Flag for review
- Don't auto-update golden files — requires manual approval

## Tips

**Use smart mode during development:**
- Faster feedback loop
- Only run tests affected by your changes

**Use full mode before PR:**
- Catch unexpected side effects
- Verify nothing broke elsewhere

**Don't skip failing gates:**
- Fix the issue, don't bypass the gate
- Slow gates still catch bugs

**Re-run after fixes:**
```
# Fix code
/test --gates unit-tests
# All pass now
/commit
```

## Regression Tests

When regression tests fail:
1. **Determine if expected** — Did the fix intentionally change output?
2. **Real regression** — Test caught a bug, fix it
3. **Expected change** — Update golden files after approval
4. **Never auto-update** — Always get approval first

## Next Steps After Testing

**If PASS:**
1. Run `/commit` to create PR
2. Consider user acceptance testing if user-facing changes

**If FAIL:**
1. Review error output
2. Fix the issues
3. Re-run `/test` (smart mode will re-run failed gates)
4. Repeat until all pass
