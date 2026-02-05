---
name: release-deployment
description: Use when preparing releases, version bumps, changelog updates, building for production, or deploying to staging/production environments
---

# Release Deployment

## The Iron Law

```
NO DEPLOYMENT WITHOUT COMPLETE CHECKLIST VERIFICATION
```

## Quick Reference

| Gate | Checks | Block If |
|------|--------|----------|
| **1. Version** | Bump (semver), changelog, release notes | Missing docs |
| **2. Quality** | Tests, lint, types, code review | Any failure |
| **3. Build** | Clean build, signing, configs | Build errors |
| **4. Environment** | No debug, prod endpoints, no .env in VCS | Wrong config |
| **5. Readiness** | Correct target, rollback plan, monitoring | Missing plan |

## Gate Details

### Gate 1: Version & Changelog
- [ ] Version bumped (patch: fix, minor: feature, major: breaking)
- [ ] Changelog updated, release notes written
- [ ] Breaking changes & migration guide documented

### Gate 2: Quality Verification
- [ ] All tests passing (fresh run, not cached)
- [ ] No lint warnings, type checking passes
- [ ] Code review completed
- [ ] Security review for sensitive changes

### Gate 3: Build Verification
- [ ] Production build completes without errors
- [ ] Debug flags disabled, source maps configured
- [ ] Code signing valid (mobile: certs not expired)

### Gate 4: Environment Configuration
- [ ] .env.production correct, API endpoints = production
- [ ] No hardcoded keys, no debug endpoints, no test credentials
- [ ] Feature flags set for production

### Gate 5: Deployment Readiness
- [ ] Deployment target verified (staging vs production)
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured
- [ ] Database migrations ready if needed

## Red Flags - STOP

- "Small change, skip full tests"
- "Tests passed yesterday"
- "It works on my machine"
- "We can hotfix if it breaks"
- "Friday deploy will be fine"

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Small change" | Small changes cause big outages |
| "Works locally" | Local ≠ production |
| "We can rollback" | Rollbacks have cost |

## Post-Deployment

- [ ] App accessible, critical flows working
- [ ] No error spikes, performance within baseline

## Related Skills

- **superpowers:security-review** - Security verification
- **superpowers:verification-before-completion** - Evidence before claims

**Cost of checklist: 15 min. Cost of bad release: hours + user trust.**
