# Red Team Pipeline

How code review, adversarial red teaming, and auto-fix work together.

## Flow

```
requesting-code-review (skill)
        │
        ├──► code-reviewer (agent) ── checklist-based review
        │      OWASP, CWE, spec alignment, correctness, test quality
        │
        └──► red-team (agent) ── adversarial analysis (parallel)
               Logic bugs, adversarial inputs, state corruption,
               concurrency, resource exhaustion, assumption violations
                      │
                      ▼
               Breakage Report (severity-ranked findings)
                      │
                      ▼
               Auto-Fix Pipeline (Critical/High only)
                      │
               ┌──────┴──────┐
               │ For each    │
               │ finding:    │
               │  1. Write   │
               │     failing │
               │     test    │
               │  2. Fix the │
               │     code    │
               │  3. Run     │
               │     full    │
               │     suite   │
               └──────┬──────┘
                      │
                      ▼
               Triage Report
               (real vs false positive, regressions, merge readiness)
```

## When Each Part Fires

| Component | Triggers on |
|---|---|
| **Code reviewer** | Every review (always) |
| **Security pass** | Auth flows, input validation, secrets, crypto, API endpoints, CI/CD |
| **Red team** | Complex logic, concurrency, state machines, data pipelines, retry/rollback |
| **Auto-fix** | Red team report has Critical or High findings |

Red team and code reviewer run **in parallel** — they cover non-overlapping domains.

## What the Red Team Produces

A Breakage Report with concrete, reproducible failure scenarios. Each entry has:

- **Trigger** — exact input, sequence, or timing condition
- **What breaks** — the specific incorrect behavior
- **Root cause** — file:line reference and why it fails
- **Severity** — Critical (data loss, auth bypass) / High (wrong behavior under plausible conditions) / Medium (unlikely edge case)
- **Test case skeleton** — runnable test outline that catches the scenario

The red team does NOT duplicate OWASP/CWE checks. Its value is finding failures that no checklist covers: race conditions, off-by-one errors, state corruption on partial failure, adversarial unicode inputs, resource exhaustion at scale.

## Auto-Fix Pipeline

Runs only when the Breakage Report contains Critical or High findings. Processes each finding individually, in severity order (Critical first).

**Per finding:**

1. **Write a failing test.** Flesh out the red team's test skeleton into a real test. Run it — it must fail. If it passes, the finding was a false positive; skip and note it.
2. **Fix the code.** Minimum change to pass the test. No surrounding refactors.
3. **Run the full test suite.** Confirm no regressions before moving to the next finding.

**After all findings are processed:** one final full-suite run, then a triage report summarizing real findings vs false positives.

**Skip conditions:**
- Zero Critical/High findings → skip entirely
- Medium findings → tracked, not auto-fixed
- User explicitly skips → respected

## Merge Blocking

Both security review and red team findings can block merge:

- **Critical/High security findings** — block until fixed or user explicitly accepts risk with documented rationale
- **Critical red team findings** — block until auto-fix pipeline completes
- **Medium findings** — tracked for later, do not block

## Example: What This Catches That Checklists Miss

A function processes webhook events and updates a database record. Checklist review confirms: input is validated, auth token is checked, SQL is parameterized. All green.

Red team finds: if two webhooks for the same record arrive within milliseconds, both read the current state, both compute an update, and the second write overwrites the first — a classic lost-update race condition. The test skeleton provides the exact concurrent call sequence. Auto-fix adds row-level locking and a regression test.
