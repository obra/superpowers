# Test Report: security-reviewer

## Goal

Verify that a specialized security review skill pushes the reviewer toward evidence-backed security findings, explicit source-to-sink reasoning, and regression detection instead of generic code review comments.

## RED Phase Baseline Scenarios

These scenarios are designed to expose how a generic reviewer can miss security-relevant changes by focusing on style, architecture, or tests instead of trust boundaries and security regressions.

### Scenario 1: Authorization check moved after data access

**Pressure:** Clean refactor appearance, passing tests, tempting to call it harmless.

**Prompt:**

```markdown
IMPORTANT: This is a real review scenario. You must review the change and decide if it is security-ready.

A pull request refactors an endpoint handler. Before the change, ownership was checked before loading a billing record. After the change, the handler loads the billing record by ID first, then checks ownership against a field on the loaded object.

Diff summary:
- old: `requireAccountAccess(req.user, accountId)` before `loadInvoice(invoiceId)`
- new: `invoice = loadInvoice(invoiceId)` then `requireAccountAccess(req.user, invoice.accountId)`
- tests still pass
- reviewer notes say "nice cleanup, less parameter threading"

What do you do? Provide your review.
```

**Expected baseline failure patterns:**
- praises refactor cleanliness without examining IDOR risk
- assumes post-load check is equivalent without tracing trust boundary
- focuses on tests, style, or maintainability only

### Scenario 2: Validation narrowed during parser refactor

**Pressure:** Validation still exists, code looks cleaner, change seems low-risk.

**Prompt:**

```markdown
IMPORTANT: This is a real review scenario. You must review the change and decide if it is security-ready.

A PR refactors webhook verification.

Before:
- Rejects requests missing `x-signature`
- Rejects duplicate headers
- Canonicalizes header casing
- Verifies HMAC over raw body bytes

After:
- Reads the first `x-signature` value if present
- Uses parsed JSON body instead of raw bytes
- Leaves the rest of the verification flow intact
- Existing unit tests still pass

Review this change for merge readiness.
```

**Expected baseline failure patterns:**
- says verification still exists so change is fine
- misses canonicalization / duplicate-header regression
- misses raw-body versus parsed-body trust change

### Scenario 3: SSRF guard bypass through nearby sibling path

**Pressure:** Original fix exists, diff only adds a new helper path, easy to miss sibling issue.

**Prompt:**

```markdown
IMPORTANT: This is a real review scenario. You must review the change and decide if it is security-ready.

A previous SSRF fix introduced `fetchWithHostnameBlocklist(url)` and replaced direct fetches in most import paths.

This PR adds a new preview feature:
- `previewRemoteImage(url)`
- implementation calls raw `fetch(url)` directly
- author says it is safe because it only fetches images and does not reuse credentials
- the earlier SSRF bug was considered fixed already

Review the change.
```

**Expected baseline failure patterns:**
- accepts the author’s safety claim without tracing network trust boundary
- misses sibling pattern despite prior SSRF fix
- treats it as a generic code consistency issue, not security regression risk

## GREEN Expectations

With the `security-reviewer` skill loaded, the reviewer should:
- identify the relevant trust boundary in each scenario
- trace source → propagation → sink or broken control
- explicitly call out regression risk where prior defenses were weakened or bypassed
- avoid padding with generic style feedback
- give a clear merge-readiness assessment tied to security evidence

## REFACTOR Targets

If the reviewer still fails after the skill, capture rationalizations such as:
- "tests pass so behavior is probably equivalent"
- "there is still an auth check, so not a security issue"
- "this is more of a code quality concern than security"
- "the old fix still exists elsewhere"
- "it only affects images / internal tools / background jobs"

Then tighten the skill against those exact shortcuts.
