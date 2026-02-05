---
name: release-deployment
description: Use when preparing releases, version bumps, changelog updates, building for production, or deploying to staging/production environments
---

# Release Deployment

## Overview

Shipping broken releases destroys user trust. Skipped checks cause rollbacks and hotfixes.

**Core principle:** ALWAYS complete the release checklist before deploying to any environment.

**Violating the letter of this process is violating the spirit of releases.**

## The Iron Law

```
NO DEPLOYMENT WITHOUT COMPLETE CHECKLIST VERIFICATION
```

If you haven't verified each gate, you cannot deploy.

## When to Use

Use for ANY release activity:
- Version bumps
- Changelog updates
- Production builds
- App store submissions
- Staging deployments
- Hotfix releases

**Use this ESPECIALLY when:**
- Under time pressure (rush releases break things)
- "Small change, no need to test everything"
- Friday afternoon deployments
- Post-incident hotfixes

**Don't skip when:**
- Change seems trivial (trivial changes break builds)
- Only configuration change (config errors cause outages)
- "Just updating dependencies" (dependency updates break things)

## The Five Gates

You MUST pass each gate before deploying.

### Gate 1: Version & Changelog

**Before ANY release:**

```
[ ] Version bumped appropriately (semver: major.minor.patch)
[ ] Changelog updated with all changes
[ ] Release notes written for users
[ ] Breaking changes documented
[ ] Migration guide if needed
```

**Version bump rules:**
- **Patch**: Bug fixes, no new features
- **Minor**: New features, backward compatible
- **Major**: Breaking changes

### Gate 2: Quality Verification

**ALL must pass:**

```
[ ] All tests passing (unit, integration, e2e)
[ ] No lint warnings or errors
[ ] Type checking passes (if applicable)
[ ] Code review completed
[ ] Security review for sensitive changes (use security-review skill)
```

**Verification commands (run fresh, not cached):**
```bash
# Example verification sequence
npm test           # or flutter test, pytest, etc.
npm run lint       # or flutter analyze
npm run typecheck  # or dart analyze
npm run build      # full production build
```

### Gate 3: Build Verification

**Production build MUST:**

```
[ ] Build completes without errors
[ ] Build artifacts exist and are valid
[ ] Environment-specific configs are correct
[ ] Debug flags disabled
[ ] Source maps configured appropriately
```

**Platform-specific checks:**

**Mobile (iOS/Android):**
```
[ ] Bundle ID/Application ID correct for environment
[ ] Code signing configured and valid
[ ] Provisioning profiles not expired
[ ] Keystore/certificates in CI secrets (not repo)
```

**Web:**
```
[ ] Build output optimized (minified, tree-shaken)
[ ] Assets correctly referenced
[ ] Environment variables injected
```

### Gate 4: Environment Configuration

**NEVER in production builds:**
- Hardcoded API keys
- Debug endpoints
- Test credentials
- Verbose logging
- Development feature flags

**Verification:**
```
[ ] .env.production exists and is correct
[ ] API endpoints point to production
[ ] Feature flags set for production
[ ] Analytics/crash reporting enabled
[ ] No .env files in version control
```

### Gate 5: Deployment Readiness

**Final checks before deploy:**

```
[ ] Deployment target correct (staging vs production)
[ ] Rollback plan documented
[ ] Monitoring/alerting configured
[ ] Database migrations ready (if any)
[ ] Dependencies deployed first (if any)
```

## Release Workflow

```
1. Create release branch (release/vX.Y.Z)
2. Complete Gates 1-4
3. Tag release (vX.Y.Z)
4. Build production artifacts
5. Deploy to staging
6. Smoke test staging
7. Deploy to production
8. Verify production
9. Merge release branch
```

## Red Flags - STOP and Review

If you catch yourself thinking:
- "Small change, skip the full test suite"
- "Just bump version and ship"
- "Tests passed yesterday"
- "It works on my machine"
- "We can hotfix if something breaks"
- "Friday deploy will be fine"

**ALL of these mean: STOP. Complete full checklist.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Small change" | Small changes cause big outages. Full verification. |
| "Tests passed earlier" | Run them again. Fresh verification only. |
| "Works locally" | Local ≠ production. Verify in target environment. |
| "We can rollback" | Rollbacks have cost. Prevent, don't react. |
| "It's just staging" | Staging problems become production problems. |
| "Urgent hotfix" | Urgency ≠ skip quality. Fast AND correct. |

## Quick Reference

| Gate | Key Checks | Failure = Block |
|------|-----------|-----------------|
| **1. Version** | Bump, changelog, notes | Missing documentation |
| **2. Quality** | Tests, lint, types, review | Any failure |
| **3. Build** | Clean build, signing, configs | Build errors |
| **4. Environment** | No debug, correct endpoints | Wrong config |
| **5. Readiness** | Target, rollback, monitoring | Missing plan |

## Platform-Specific Checklists

### Mobile App Stores

**iOS App Store:**
```
[ ] Provisioning profile valid
[ ] App Store Connect metadata updated
[ ] Screenshots current
[ ] Privacy policy URL valid
[ ] Export compliance answered
```

**Google Play:**
```
[ ] Signing key correct
[ ] Play Console listing updated
[ ] Content rating current
[ ] Target SDK meets requirements
[ ] Privacy policy linked
```

### Web Deployment

```
[ ] CDN cache invalidation planned
[ ] DNS/routing changes ready
[ ] SSL certificates valid
[ ] Health checks configured
[ ] Load balancer updated
```

## Post-Deployment Verification

**After EVERY deployment:**

```
[ ] Application accessible
[ ] Critical user flows working
[ ] No error spikes in monitoring
[ ] Performance within baseline
[ ] Logs show healthy startup
```

## Related Skills

- **superpowers:security-review** - Security verification for releases
- **superpowers:verification-before-completion** - Evidence before claims

## Real-World Impact

Release failures are visible:
- Broken builds = blocked releases
- Missing configs = production outages
- Skipped tests = user-facing bugs
- Wrong environment = data corruption

**The cost of the checklist: 15 minutes. The cost of a bad release: hours of firefighting + user trust.**
