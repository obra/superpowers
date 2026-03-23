# Branch Strategy: Promotion Flow Best Practices

Guide for implementing branch promotion workflows with GitHub Project integration.

## Overview

A promotion flow moves code through increasingly stable environments before reaching production:

```
feature/123-add-login  →  dev  →  staging  →  main
    (work branch)      (int)  (pre-prod)  (prod)
```

**Key principles:**
- Never commit directly to protected branches
- Each promotion is a validation gate
- Failed gates block promotion
- Every environment is testable

## Standard Promotion Flow

### Branch Hierarchy

```
main (production)
  ↑
staging (pre-production)
  ↑
dev (integration)
  ↑
feature/bug branches (work)
```

### Branch Protection Rules

**main:**
- Require pull request reviews (2+ approvals)
- Require status checks (all tests pass)
- Require branches to be up to date
- No direct commits
- No force push
- Require linear history

**staging:**
- Require pull request reviews (1+ approval)
- Require status checks
- Require branches to be up to date
- No direct commits
- No force push

**dev:**
- Require status checks
- Allow fast-forward merge only
- No direct commits (except for merges from feature branches)

**feature/bug branches:**
- No restrictions
- Must pass tests before merging to dev

## Workflow Integration

### Configuration in project-flows.json

```json
{
  "version": 1,
  "repo": "owner/repo-name",
  "default_base_branch": "dev",
  "branch_naming": "<type>/<issue#>-<short-description>",
  "promotion_flow": {
    "enabled": true,
    "stages": ["dev", "staging", "main"],
    "auto_promote": false,
    "require_tests_pass": true
  },
  "flows": {
    "bug": {
      "stages": [
        {"name": "Triage", "skill": "bug-triage"},
        {"name": "Fix", "skill": "bug-fix"},
        {"name": "Test", "skill": "testing-gates"},
        {"name": "UserTest", "skill": "user-acceptance-testing"},
        {"name": "Done", "skill": "committing"}
      ]
    }
  }
}
```

### Stage Behaviors

#### Triage Stage

Work branch created from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b fix/123-login-timeout
```

#### Fix Stage

Commit to work branch:

```bash
git add src/auth/login.py test/auth/test_login.py
git commit -m "fix: resolve login timeout issue

Increased connection timeout from 5s to 30s.
Added retry logic for transient failures.

Closes #123"
```

#### Test Stage

Run tests on work branch:

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Unit tests
npm test

# Integration tests
npm run test:integration
```

All must pass before proceeding.

#### UserTest Stage

Deploy to dev environment:

```bash
# Create PR to dev
gh pr create --base dev --title "fix: #123 resolve login timeout" --body "..."

# After approval, merge to dev
gh pr merge --auto --squash
```

UAT happens on dev environment:
- User tests the fix
- Validates behavior
- Approves or requests changes

#### Done Stage

Promote through environments:

**To staging:**
```bash
git checkout staging
git pull origin staging
git merge dev --no-ff
git push origin staging

# CI runs full test suite on staging
# Manual validation on staging environment
```

**To main:**
```bash
git checkout main
git pull origin main
git merge staging --no-ff
git push origin main

# CI deploys to production
```

## Protection Levels

### Level 1: Development (dev)

**Purpose:** Integration testing
**Protection:** CI tests must pass
**Access:** All developers can merge feature branches via PR
**Deployment:** Auto-deploy to dev environment

**Merge process:**
```bash
# Feature branch PR to dev
gh pr create --base dev --title "..." --body "..."
# After CI passes and approval
gh pr merge --auto --squash
```

### Level 2: Staging (staging)

**Purpose:** Pre-production validation
**Protection:** All dev tests + staging tests, 1+ approval
**Access:** Team leads can merge from dev
**Deployment:** Auto-deploy to staging environment

**Merge process:**
```bash
# After dev is stable and tested
git checkout staging
git merge dev --no-ff -m "chore: promote dev to staging"
# CI runs staging-specific tests
# Manual smoke testing on staging
git push origin staging
```

### Level 3: Production (main)

**Purpose:** Live production code
**Protection:** All tests + 2+ approvals + manual sign-off
**Access:** Maintainers only
**Deployment:** Manual or auto-deploy to production

**Merge process:**
```bash
# After staging validation complete
git checkout main
git merge staging --no-ff -m "release: promote staging to main"
# Create release tag
git tag -a v1.2.3 -m "Release v1.2.3: Fix login timeout"
# Push with tags
git push origin main --follow-tags
```

## GitHub Project Integration

### Issue Lifecycle with Promotion

**Example bug fix:**

1. **Issue created**, added to Bug Fixes project, status → Triage
2. **Triage complete**, status → Fix
3. **Fix committed to feature branch**, status → Test
4. **Tests pass on feature branch**, status → UserTest
5. **PR to dev created**, merged after approval
6. **UAT on dev environment**, validated
7. **Promotion to staging**, staging validation
8. **Promotion to main**, status → Done

### Markers and Promotions

Loop orchestrator posts markers at each stage:

```markdown
<!-- Issue #123 comments -->

[TRIAGE_READY]
Root cause identified: connection timeout too short.
Hypothesis: Increase timeout + add retry logic.

[FIX_COMPLETE]
Implemented in feature branch fix/123-login-timeout.
Changed timeout from 5s to 30s, added exponential backoff retry.

[TEST_PASS]
All gates passed:
- Linting: PASS
- Type checking: PASS
- Unit tests: PASS (12/12)
- Integration tests: PASS (5/5)

[UAT_ACCEPTED]
Tested on dev environment. Login now works reliably.
Ready for promotion to staging.

[PR_CREATED]
PR #456 merged to dev: fix/123-login-timeout
Promoted to staging: commit abc123
Promoted to main: commit def456
Released: v1.2.3
```

## Hotfix Process

For production emergencies, bypass normal flow:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-security-fix

# Make minimal fix
# ... edit files ...
git commit -m "hotfix: patch critical security vulnerability"

# PR directly to main (emergency approval process)
gh pr create --base main --title "HOTFIX: ..." --body "..."

# After merge to main, backport to staging and dev
git checkout staging
git cherry-pick <hotfix-commit>
git push origin staging

git checkout dev
git cherry-pick <hotfix-commit>
git push origin dev
```

**Hotfix guidelines:**
- Only for critical production issues
- Keep changes minimal
- Document thoroughly
- Backport to all branches
- Post-mortem after resolution

## Merge Strategies

### Feature Branches → Dev

**Squash merge** (recommended):
```bash
gh pr merge --squash
```

Benefits:
- Clean history on dev
- Single commit per feature
- Easy to revert

### Dev → Staging, Staging → Main

**Merge commit** (no fast-forward):
```bash
git merge --no-ff
```

Benefits:
- Preserves branch structure
- Clear promotion points
- Easy to track what was promoted when

## Automated Promotion

### CI-Driven Promotion

For teams with high confidence in automation:

```yaml
# .github/workflows/promote-to-staging.yml
name: Promote to Staging
on:
  push:
    branches: [dev]

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Run staging tests
        run: npm run test:staging

      - name: Promote to staging
        if: success()
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git checkout staging
          git merge dev --no-ff -m "chore: auto-promote dev to staging"
          git push origin staging
```

**Use with caution:**
- Requires high test coverage
- Good rollback strategy needed
- Monitor failures closely

### Manual Promotion (Recommended)

Keep promotion manual for:
- Critical systems
- Regulatory environments
- Low test coverage
- New teams

Human validation at each stage provides safety.

## Rollback Strategy

### Revert a Promotion

If staging or main has issues:

```bash
# On staging
git revert <merge-commit> -m 1
git push origin staging

# On main
git revert <merge-commit> -m 1
git push origin main
```

### Rollback to Previous Version

```bash
# Find last good commit
git log --oneline

# Reset branch (destructive - use carefully)
git reset --hard <last-good-commit>
git push origin <branch> --force

# Or create revert PR (safer)
git checkout -b revert-bad-changes
git revert <bad-commit>
gh pr create --base main
```

## Environment Configuration

### Environment-Specific Config

Don't use branches for config - use environment variables:

```bash
# .env.dev
DATABASE_URL=postgres://dev-db:5432/myapp
API_URL=https://dev-api.example.com

# .env.staging
DATABASE_URL=postgres://staging-db:5432/myapp
API_URL=https://staging-api.example.com

# .env.production
DATABASE_URL=postgres://prod-db:5432/myapp
API_URL=https://api.example.com
```

Loaded based on environment, not branch.

### Feature Flags

For gradual rollouts:

```javascript
// Feature flag service
if (featureFlags.isEnabled('new-login-flow', userId)) {
  // New flow
} else {
  // Old flow
}
```

Deploy code to main, enable feature progressively.

## Best Practices

### 1. Never Commit to Protected Branches

Always use PRs, even for small changes:

```bash
# ❌ Don't do this
git checkout main
git commit -m "quick fix"
git push

# ✅ Do this
git checkout -b fix/small-issue
git commit -m "fix: small issue"
gh pr create --base dev
```

### 2. Keep Feature Branches Short-Lived

Merge within days, not weeks:
- Smaller changes = easier review
- Less merge conflict pain
- Faster feedback

### 3. Test Before Promoting

Each promotion should increase confidence:
- dev: integration tests pass
- staging: full regression + manual validation
- main: staging validation complete

### 4. Document Promotions

Keep promotion log:

```markdown
# PROMOTIONS.md

## 2026-03-23

**dev → staging**
- Commits: abc123, def456, ghi789
- Features: Login timeout fix, Dashboard improvements
- Tests: All passing
- Deployed at: 14:30 UTC

**staging → main**
- Release: v1.2.3
- Validated by: @jane, @bob
- Deployed at: 16:45 UTC
```

### 5. Coordinate Promotions

Don't promote during:
- Peak traffic hours
- End of day Friday
- Before major holidays
- When key people unavailable

### 6. Monitor After Promotion

Watch metrics after promotion:
- Error rates
- Performance
- User feedback
- Logs

Rollback quickly if issues detected.

## Common Pitfalls

### ❌ Skipping Environments

Don't promote directly from dev to main:
```bash
# Bad
git checkout main
git merge dev
```

Always go through staging for validation.

### ❌ Diverging Branches

Avoid commits on staging/main outside of promotions:

```bash
# This causes divergence
git checkout staging
git commit -m "fix config"  # Now staging ≠ dev + changes
```

If fixes needed on staging, backport to dev:

```bash
git checkout dev
git cherry-pick <staging-fix>
```

### ❌ Forgetting to Update

Keep work branch updated with base:

```bash
# Regularly rebase on dev
git checkout feature/123
git fetch origin
git rebase origin/dev
```

Prevents merge conflicts at PR time.

### ❌ Large Bang Promotions

Promoting weeks of changes at once:
- Hard to validate
- Risky to deploy
- Difficult to rollback

Promote smaller batches more frequently.

## Integration with /loop

The loop orchestrator works with promotion flows:

```json
{
  "flows": {
    "bug": {
      "stages": [
        {"name": "Triage", "base_branch": "dev"},
        {"name": "Fix", "base_branch": "dev"},
        {"name": "Test", "base_branch": "dev"},
        {"name": "UserTest", "deploy_to": "dev"},
        {"name": "Done", "promote_through": ["staging", "main"]}
      ]
    }
  }
}
```

Loop orchestrator:
1. Creates work branch from dev
2. Runs tests on work branch
3. Merges to dev after approval
4. Deploys to dev for UAT
5. Promotes to staging → main after validation

## Team Workflow

### Developer Workflow

```bash
# Start work
git checkout dev
git pull
git checkout -b feature/123-new-feature

# Make changes, commit, test
# ...

# Push and create PR to dev
git push origin feature/123-new-feature
gh pr create --base dev

# After approval and CI passes
# PR merges to dev

# Monitor dev deployment
# If issues, fix in feature branch and push again
```

### Team Lead Workflow

```bash
# Daily: Review dev, consider staging promotion
git checkout dev
git pull
# Review changes since last promotion
git log staging..dev

# If stable, promote to staging
git checkout staging
git pull
git merge dev --no-ff -m "chore: promote dev to staging $(date +%Y-%m-%d)"
git push origin staging

# Monitor staging deployment
# Run manual validation
```

### Release Manager Workflow

```bash
# Weekly or as needed: Promote staging to main
git checkout staging
git pull
# Verify all validation complete

git checkout main
git pull
git merge staging --no-ff -m "release: v1.2.3"

# Tag release
git tag -a v1.2.3 -m "Release v1.2.3

Features:
- Login timeout fix
- Dashboard improvements

Bug fixes:
- Memory leak in cache
"

git push origin main --follow-tags

# Monitor production deployment
# Update release notes
```

## Summary

**Key Takeaways:**
- Use promotion flow: work → dev → staging → main
- Protect branches with increasing restrictions
- Test at each level before promoting
- Never commit directly to protected branches
- Keep promotions small and frequent
- Document and monitor all promotions
- Have rollback plan ready

**Start Simple:**
1. Protect main (require PR + approval)
2. Add dev branch (fast integration)
3. Add staging when team grows
4. Automate cautiously

**Grow with Team:**
- Small team: dev → main may be enough
- Medium team: dev → staging → main
- Large team: Add more environments as needed

## Related Documentation

- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Setup with GitHub Projects
- [commands/setup.md](../commands/setup.md) - Configuration options
- [skills/committing/SKILL.md](../skills/committing/SKILL.md) - Git workflow
- [skills/loop-orchestrator/SKILL.md](../skills/loop-orchestrator/SKILL.md) - Automation
