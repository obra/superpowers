# Commit: Finalize and Create PR

Finalize work on a feature branch: rebase, commit, push, create PR, clean up, and capture lessons learned.

## Usage

```
/commit
```

No arguments needed — operates on current branch.

## Behavior

Handles the full git workflow from staging to PR creation:
- Verifies branch safety
- Runs project-specific sync (if configured)
- Stages and commits changes
- Rebases to base branch
- Resolves conflicts (if any)
- Pushes to origin
- Creates or updates PR
- Cleans up temporary artifacts
- Captures lessons learned

**Core principle:** Clean history, verified state, captured learnings.

**Non-blocking:** In loop mode, posts `[PR_CREATED]` marker and moves to next item.

## Process

1. **Verify branch safety** — Confirm not on protected branch (main, dev, staging)
2. **Run project-specific sync** — Code generation, library promotion (if configured)
3. **Stage and commit** — Review changes, generate commit message, commit
4. **Rebase to base branch** — Fetch and rebase, resolve conflicts if needed
5. **Push** — Push to origin (with `--force-with-lease` if history changed)
6. **Create/update PR** — Check for existing PR, create or update with summary
7. **Cleanup** — Remove temporary artifacts (triage scratch tests, debug files)
8. **Lessons learned** — Review session, generate recommendations, implement selected ones

## Output

**Terminal:**
```
Committing fix/123-login-timeout:

✓ Branch safety verified (not on protected branch)
✓ Changes staged: 2 files
✓ Commit created: fix: resolve login timeout issue
✓ Rebased to origin/dev
✓ Pushed to origin/fix/123-login-timeout
✓ PR created: #456

PR URL: https://github.com/owner/repo/pull/456

Lessons learned:
1. Triage skill could better document parallel hypothesis testing
2. Project lacks timeout configuration guidance

Implement? (by number, "all", or "none"):
```

**GitHub Issue:**
Posts `[PR_CREATED]` marker with PR URL and change summary.

## Prerequisites

- All tests pass (verified by `/test`)
- Work complete on feature branch
- Not on protected branch (main, dev, staging)
- Project-specific commit context (`.claude/shared/commit-project.md`) if it exists

## Integration

**Invokes:**
- **superpowers:committing** skill — handles the workflow

**Preceded by:**
- `/test` — must pass before committing
- `/fix <issue#>` or feature implementation

**Final step** in the workflow before merge.

## Branch Naming

Convention: `<type>/<issue#>-<short-description>`

Types:
- `fix/` — Bug fixes
- `feat/` — New features
- `chore/` — Maintenance, documentation, tooling
- `agent/` — Agent/automation improvements

Examples:
- `fix/123-login-timeout`
- `feat/456-add-oauth-support`
- `chore/789-update-testing-docs`

## Commit Message Format

```
<type>: <scope> — one line description

<optional longer description>

Closes #<issue#>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`

Example:
```
fix: auth — resolve login timeout issue

Increased connection timeout from 5s to 30s and added
retry logic with exponential backoff for transient failures.

Closes #123
```

## PR Template

PR body includes:
- **What changed:** Files/components updated
- **Why:** Reasoning for the change
- **Verification:** Test evidence (which gates passed)
- **Closes #<issue#>** — Links PR to issue

Example:
```markdown
## What Changed
- Increased login timeout in `src/auth/login.py`
- Added retry logic with exponential backoff
- Promoted reproduction test to `tests/auth/test_login.py`

## Why
Login was timing out on slow connections. Root cause identified
via `/triage 123`: timeout was too short (5s).

## Verification
All gates passed:
- Linting: PASS
- Type checking: PASS
- Unit tests: PASS (12/12)
- Integration tests: PASS (5/5)

Closes #123
```

## Rebase and Conflicts

If conflicts during rebase:
1. Present conflict files to user/handler
2. Resolve conflicts
3. Continue rebase
4. Re-run tests to verify nothing broke
5. Push with `--force-with-lease`

For complex conflicts: stop and ask for guidance.

## Cleanup

Before PR creation, remove:
- Triage scratch tests (in `tests/scratch/` or similar)
- Temporary debug files
- Commented-out code
- Console.log / print statements

Commit cleanup separately:
```
chore: #123 clean up triage artifacts
```

## Lessons Learned

After PR created, review the session:

**What to review:**
- Methodology gaps — steps missing/unclear in skills or docs
- Skill improvements — better guidance needed
- Project config updates — new conventions discovered
- New issues — bigger ideas or unrelated bugs found

**Process:**
1. Present numbered list of concrete recommendations
2. Ask which to implement (by number, "all", or "none")
3. Implement selected changes
4. Commit: `chore: #<issue#> lessons learned from <brief-description>`
5. Push (lands in existing PR)

**Guidelines:**
- Keep recommendations concrete and actionable
- Zero recommendations is fine if cycle was smooth
- If too big to implement inline, suggest GitHub issue

## Examples

**After fix is complete:**
```
/test
# All pass
/commit
```

**In loop mode:**
Loop orchestrator automatically calls commit for items in the Done stage.

## Error Handling

**Safety checks:**
- On protected branch → STOP, switch to feature branch
- Tests haven't run → STOP, run `/test` first
- Staging secrets/credentials → STOP, remove from staging

**Push errors:**
- Large files (>100MB) → Remove from history, add to `.gitignore`
- Protected branch rejection → Wrong branch, verify branch name
- Pre-receive hook failure → Read error message, fix issue

**Merge conflicts:**
- Conflicts in test behavior → Re-run tests after resolving
- Complex conflicts → Present to user/handler for guidance

## Anti-Patterns

❌ Committing without tests passing
❌ `git add -A` or `git add .` (catches unrelated files/secrets)
❌ Rebasing before committing (dirty working tree blocks rebase)
❌ Force-pushing without `--force-with-lease` (can overwrite others' work)
❌ Skipping lessons learned (misses improvement opportunities)
❌ Amending commits after push (rewrites shared history)

## Tips

**Stage specific files:**
```bash
# Good
git add src/auth/login.py tests/auth/test_login.py

# Avoid
git add -A  # Might catch unrelated files
```

**Review staged changes:**
```bash
git diff --staged
```

**Keep commits focused:**
- One logical change per commit
- Don't mix unrelated changes
- Separate cleanup commits from fix commits

**Rebase regularly:**
- Keep feature branch up to date with base
- Prevents large conflicts at PR time
- `git fetch && git rebase origin/dev`

## Next Steps After Commit

1. **PR is created** — Review the PR in GitHub
2. **Wait for CI** — GitHub Actions or other CI runs tests
3. **Address review comments** — If reviewers request changes
4. **Merge when approved** — Handler or maintainer merges to base branch
5. **Monitor deployment** — Watch for issues after merge

In promotion flow repos (dev → staging → main):
- PR merges to dev
- Promote dev → staging after validation
- Promote staging → main for production
