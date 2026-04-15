---
name: requesting-security-review
description: Use when changes touch auth, authorization, secrets, user input sinks, file handling, webhooks, admin/audit surfaces, dependencies, or agent/tool execution — to catch exploitable issues before merge
---

# Requesting Security Review

Dispatch superpowers:security-reviewer subagent when a change can plausibly affect security posture. The reviewer gets the diff and a threat-model lens — not your session history — so it stays focused on assets, actors, and exploit paths instead of product behavior.

**Core principle:** Security review is not a substitute for code review — it runs alongside it, with a different lens. Code review asks "does this work and is it clean?" Security review asks "can it be abused?"

Tracks obra/superpowers#1151.

## When to Request Review

Dispatch a security reviewer whenever the diff touches any of the following surfaces:

**Identity & access**
- Authentication, session issuance/validation, password handling, account recovery
- Authorization, role checks, ownership/tenant boundaries, IDOR-prone lookups
- Token minting, refresh, revocation, scopes

**Sensitive data**
- Secrets, API keys, credentials, signing keys
- PII, payment data, health data, other regulated categories
- Anything that could end up in logs, crash reports, or analytics

**Untrusted input sinks**
- User input reaching SQL, HTML, shell, file paths, templates, URLs, or LLM prompts
- Deserialization, template rendering, regex-on-untrusted
- Unsafe redirects and open-redirect-prone URL construction

**External surfaces**
- File upload / download / preview / import / export
- Webhook receivers and senders (signature verification, replay)
- URL fetching, SSRF-adjacent code, outbound callbacks
- Admin tools, moderation tools, audit logs

**Supply chain & runtime**
- New third-party dependencies (including transitive)
- Build, CI, or deployment configuration
- Trust-related defaults (cookie flags, CORS, CSP, TLS, sandbox)
- Agent/tool execution, filesystem access, network access

**Optional but valuable:**
- Before shipping a branch that touched security boundaries earlier in its life
- Right after fixing a security bug (to check for adjacent issues)
- Before enabling a feature flag that exposes new attack surface

## How to Request

**1. Get git SHAs and diff scope:**
```bash
BASE_SHA=$(git rev-parse origin/main)  # or the pre-change point
HEAD_SHA=$(git rev-parse HEAD)
git diff --stat $BASE_SHA..$HEAD_SHA
```

**2. Identify assets and trust boundaries yourself first.**
Before dispatching, jot down (in your own prompt to the reviewer):
- What the change does in plain English
- Which assets the touched code protects
- Which actors can reach the changed code path
- What trust boundary the change sits on

This keeps the reviewer anchored. Without it, the reviewer fires a generic OWASP checklist and misses the real questions.

**3. Dispatch security-reviewer subagent:**

Use Task tool with superpowers:security-reviewer type, fill template at `security-reviewer.md`.

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` — What you just built, in product terms
- `{ASSETS}` — What the code protects (e.g. "cross-tenant document contents", "OAuth refresh tokens")
- `{ACTORS}` — Who can reach the code (anon, authed user, admin, webhook caller, agent)
- `{TRUST_BOUNDARY}` — Where untrusted input becomes trusted (e.g. "request body → DB write")
- `{BASE_SHA}` / `{HEAD_SHA}` — Commit range
- `{DESCRIPTION}` — Brief summary

**4. Act on findings:**
- **Critical** — fix before merge. No exceptions.
- **Important** — fix before merge unless there is an explicit, written accepted-risk decision.
- **Minor** — note for later; these are hardening / defense-in-depth.
- Push back if the reviewer is wrong, but write down the reasoning — "this is fine" is not a response.

## Example

```
[Just implemented: per-user export endpoint that streams the user's own documents as a ZIP]

You: Export endpoint touches authz + file handling + large user-controlled responses.
     Dispatching security review.

BASE_SHA=$(git rev-parse origin/main)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch superpowers:security-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: GET /api/export returns the caller's documents as a ZIP stream
  ASSETS: Document contents (confidential per-user), document IDs (not secret but enumerable)
  ACTORS: Authenticated users only; endpoint is behind session cookie + CSRF
  TRUST_BOUNDARY: Query param ?ids=... accepts a caller-supplied list of doc IDs → filesystem read
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Streaming ZIP export with optional ids filter and audit log

[Subagent returns]:
  Critical:
    - ?ids=... is not re-checked against the caller's ownership before streaming (IDOR)
      → file path constructed from user input without resolving against the user's scope
  Important:
    - audit log writes doc titles but redaction config doesn't apply to titles
    - no per-user rate limit; unbounded ZIP size
  Minor:
    - Content-Disposition not explicitly attachment; browsers may inline
  Assessment: Do not merge. Critical IDOR fix + size cap needed.

You: [Fix IDOR, add authz assertion test, add size cap, re-request review]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Run security review alongside code review after tasks that touched a listed surface.
- Don't bundle them — separate review passes with separate prompts.

**Test-Driven Development:**
- For each Critical / Important finding, add a regression test that fails on the vulnerable version.
- A security fix without a test is a security fix waiting to regress.

**Requesting Code Review:**
- Security review does not replace code review. Run both. They catch different classes of bug.

## What This Skill Is Not

- **Not a compliance checklist.** HIPAA / SOC2 / PCI sign-off is not this skill's job.
- **Not dependency scanning.** Run your SCA tool separately; this skill only flags dependency *changes* that deserve a second look.
- **Not pen-testing.** The reviewer reads the diff; it does not probe a running system.
- **Not a gate for every PR.** If the change doesn't touch any surface in "When to Request Review," skip it.
