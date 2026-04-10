---
name: feature-ship
description: Use before deploying to production, merging to a release branch, or shipping any user-facing change — runs a structured release gate checklist and blocks deployment when any gate fails
---

# Feature Ship

## Overview

Most production incidents come from features that were done but not ready. Done means the code works. Ready means the system is prepared for what happens next.

**Core principle:** A feature isn't shipped until every gate passes. Not mostly. Not "close enough." Every gate.

**Announce at start:** "I'm using the feature-ship skill to run the release gate checklist."

## The Iron Law

```
DO NOT DEPLOY UNTIL EVERY GATE PASSES.
FAILING GATES ARE NOT JUDGMENT CALLS.
```

A failing gate means the feature is not ready to ship. If a gate cannot pass, the deployment does not happen. Bring the failing gate to your human partner — don't negotiate with the checklist.

## The Gates

Run each gate in order. A gate must pass before the next is checked.

---

### Gate 1: Tests

**Evidence required:** Run the full test suite. Show the output.

```bash
# Run your project's full test suite
npm test / pytest / cargo test / go test ./... / bundle exec rspec
```

**Pass when:**
- Exit code is 0
- Zero failing tests
- Coverage has not regressed below the project threshold (if tracked)

**Block on:**
- Any failing test
- Tests newly marked as skipped since the last passing build
- Coverage below threshold

Stop here if tests fail. Fix them before checking any other gate.

---

### Gate 2: Acceptance Criteria

**Evidence required:** Verify each AC from the feature spec one by one.

```
AC-1: [name] — PASS / FAIL / N/A
AC-2: [name] — PASS / FAIL / N/A
...
```

If no ACs exist: invoke `superpowers:acceptance-criteria` to write them retroactively, verify them, then continue.

**Pass when:** Every AC is marked PASS or N/A with a documented reason.

**Block on:** Any AC marked FAIL.

---

### Gate 3: Documentation

Verify documentation reflects the shipped feature:

- [ ] CHANGELOG or release notes entry written
- [ ] Public API changes documented (if applicable)
- [ ] README updated if behavior visible to users or developers changed
- [ ] Inline code comments reflect current behavior, not previous behavior
- [ ] Runbooks or operational docs updated (if applicable)

**Pass when:** All applicable items are checked.

**Block on:** Missing CHANGELOG entry. Undocumented public API changes.

---

### Gate 4: Breaking Changes

Identify and explicitly account for any breaking changes:

- [ ] No public APIs removed without a deprecation period (or removal documented)
- [ ] No schema changes that would break existing data (or migration provided and tested)
- [ ] No environment variable renames without backward compatibility (or documented)
- [ ] Downstream consumers notified (if applicable)

**Pass when:** No breaking changes exist, OR all breaking changes are explicitly documented and accepted by your human partner.

**Block on:** Undocumented breaking changes. Breaking changes not explicitly reviewed.

---

### Gate 5: Rollback Plan

Answer these four questions before deploying — with specifics, not intentions:

1. **How do you detect a bad deploy?** (Which metric, error rate, or user signal tells you something is wrong?)
2. **How do you roll back?** (The exact commands or steps — not "revert the PR")
3. **What breaks if you roll back?** (Data mutations, schema changes, emails sent, webhooks fired)
4. **How long does rollback take?** (Is this acceptable given the blast radius?)

**Pass when:** All four questions are answered with specific, actionable answers.

**Block on:** "We'll figure it out if something goes wrong." Vague rollback steps. Unanswered questions.

---

### Gate 6: Observability

Verify the feature's behavior will be visible in production:

- [ ] New code paths have appropriate logging at the right level
- [ ] Key operations emit metrics or traces (if the project uses them)
- [ ] Error conditions are logged — not swallowed silently
- [ ] Alerts cover any new SLO-critical paths (or existing alerts are confirmed to cover them)

**Pass when:** All applicable items are checked. No new errors fail silently.

**Block on:** Critical errors swallowed without logging. New SLO-critical path with no alert coverage.

---

### Gate 7: Security

Verify no security regressions:

- [ ] No new inputs accepted without validation and sanitization
- [ ] No authorization levels changed without explicit review (public ↔ authenticated ↔ admin)
- [ ] No secrets introduced in code, logs, or error messages
- [ ] No new dependencies with known vulnerabilities (`npm audit` / `cargo audit` / equivalent)
- [ ] No new admin or privileged functionality without authorization checks

**Pass when:** All items checked or marked N/A with a documented reason.

**Block on:** Unvalidated input. Incorrect authorization. Exposed secrets.

---

### Gate 8: Human Partner Sign-Off

Present the gate summary and wait for explicit approval:

> "All gates passed. Here's the summary:
>
> - Tests: [N/N passing]
> - ACs: [N/N verified]
> - Docs: [updated / N/A]
> - Breaking changes: [none / documented and accepted]
> - Rollback: [detect via X, roll back with Y, takes Z minutes]
> - Observability: [in place / N/A]
> - Security: [verified / N/A]
>
> Ready to deploy to [environment]?"

Wait for an explicit "yes" or equivalent. Do not deploy on implied consent, silence, or "sounds good."

---

## Gate Summary Report

After running all gates, produce a summary and save it:

```markdown
## Feature Ship Report — [Feature Name]

**Date:** YYYY-MM-DD
**Environment:** [staging / production / etc.]
**Deploying:** [what is being shipped]

| Gate | Status | Notes |
|------|--------|-------|
| 1. Tests | ✅ PASS | 142/142 passing |
| 2. Acceptance Criteria | ✅ PASS | 7/7 verified |
| 3. Documentation | ✅ PASS | CHANGELOG updated |
| 4. Breaking Changes | ✅ PASS | None |
| 5. Rollback Plan | ✅ PASS | Revert deploy + run migration-rollback |
| 6. Observability | ✅ PASS | Metrics added, alert threshold updated |
| 7. Security | ✅ PASS | No new inputs; deps clean |
| 8. Human Sign-Off | ✅ PASS | Approved by [name] at [time] |

**Overall: READY TO DEPLOY**
```

Save to `docs/superpowers/ships/YYYY-MM-DD-[feature-name].md` before deploying. Commit it.

---

## When a Gate Fails

1. **Stop.** Do not check the next gate. Do not deploy.
2. **Report clearly:** "Gate [N] — [gate name] — FAIL: [specific reason]."
3. **Present options to your human partner:** fix the issue, accept the risk explicitly, or postpone deployment.
4. **Do not proceed without explicit direction.** No gate failure is automatically acceptable.

## Red Flags — STOP

- Deploying before all gates pass ("it's close enough")
- Skipping gates because the change is "small" (small changes cause small incidents — or large ones)
- Running gates after deployment instead of before
- Treating a FAIL result as a judgment call rather than a stop
- Producing gate results without actually running the gate ("tests should pass")
- Skipping human sign-off on urgent deploys ("no time")
- Answering rollback questions with intentions instead of specifics
- Counting passing tests as passing all gates

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The tests pass, we're good" | Tests are Gate 1 of 8. |
| "It's a small change, no need for the full checklist" | Small changes cause small incidents. Or large ones. Run the checklist. |
| "We need to ship now, we'll document after" | "Document later" means "document never." |
| "The rollback is obvious" | Obvious rollback plans fail under pressure. Write them down now. |
| "No breaking changes in this PR" | What about the migration? The config key rename? The webhook shape change? Run the gate. |
| "We don't have observability for this" | Add it. Or accept that you're flying blind in production. |
| "Security review is for big features" | Bugs don't check feature size. |
| "My human partner knows we're shipping" | Implied consent is not consent. Wait for "yes." |
| "This gate doesn't apply to us" | Document why explicitly. Don't silently skip it. |

## Quick Reference

| Gate | Evidence Required | Common Block |
|------|------------------|--------------|
| 1. Tests | Test output: exit 0, 0 failures | Failing tests |
| 2. Acceptance Criteria | Per-AC PASS / FAIL / N/A | Any AC marked FAIL |
| 3. Documentation | Checklist complete | Missing CHANGELOG entry |
| 4. Breaking Changes | None or documented + accepted | Undocumented API or schema break |
| 5. Rollback Plan | 4 questions answered specifically | Vague "revert the PR" answer |
| 6. Observability | Checklist complete | Silent error paths; uncovered SLO |
| 7. Security | Checklist complete | Unvalidated input; wrong auth level |
| 8. Sign-Off | Explicit "yes" from human partner | No response; implied consent |

## Integration

**Runs before:**
- Any deployment to production
- Merging to the main or release branch when that triggers a deploy
- Publishing a library or package version

**Called after:**
- **superpowers:finishing-a-development-branch** — that skill handles git integration; this skill gates the deploy that follows

**Pairs with:**
- **superpowers:acceptance-criteria** — ACs written there become Gate 2 here
- **superpowers:verification-before-completion** — verification covers code correctness; feature-ship covers deployment readiness
- **superpowers:test-driven-development** — passing Gate 1 is the payoff of having followed TDD throughout
