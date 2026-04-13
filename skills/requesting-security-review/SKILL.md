---
name: requesting-security-review
description: Use when completed or planned changes affect authentication, authorization, sensitive data, file handling, webhooks, admin tools, multi-tenant boundaries, external input, dependency trust, or agent/tool execution
---

# Requesting Security Review

Request a focused security review before risky changes merge.

**Core principle:** Security review is evidence-based risk analysis, not a generic checklist. Review the actual diff, the intended behavior, and the trust boundaries.

## When to Use

Use this skill when work touches:

- Authentication, sessions, tokens, passwords, account recovery
- Authorization, roles, permissions, tenant isolation, ownership checks
- Sensitive data, secrets, PII, payment data, health data
- File uploads, downloads, previews, import/export
- Webhooks, callbacks, redirects, URL fetching
- Admin tools, moderation tools, audit logs
- User-controlled input rendered into HTML, SQL, shell, templates, paths, URLs, or prompts
- AI agents, tool execution, sandboxing, filesystem access, network access
- Dependency, build, deployment, or configuration changes that affect trust

Do not use for purely visual changes, copy edits, or internal refactors with no security boundary.

## Review Inputs

Before dispatching the security reviewer, gather:

```bash
BASE_SHA=$(git rev-parse origin/main)
HEAD_SHA=$(git rev-parse HEAD)
git diff --stat "$BASE_SHA..$HEAD_SHA"
```

Provide the reviewer:

- What changed
- Why it changed
- Threat model or product requirement
- Base and head SHAs
- Relevant test commands
- Known constraints or accepted risks

## Dispatch

Use the `security-reviewer` agent with the template in `security-reviewer.md`.

The reviewer must inspect the diff, not just summarize intentions.

## Required Checks

The reviewer must check:

| Area | Questions |
| --- | --- |
| Authentication | Can identity be spoofed, sessions fixed, tokens leaked, or recovery abused? |
| Authorization | Can users access, mutate, export, or infer data they do not own? |
| Input handling | Can input reach SQL, shell, HTML, paths, templates, URLs, or prompts unsafely? |
| Data protection | Are secrets, credentials, tokens, PII, or sensitive errors exposed? |
| Abuse resistance | Can the feature be spammed, automated, replayed, or used for privilege escalation? |
| Dependency/config | Did defaults, CORS, CSP, cookies, TLS, env vars, or dependency versions weaken security? |
| Observability | Are security-relevant failures logged without leaking sensitive data? |
| Tests | Are security boundaries covered by tests or clear manual verification? |

## Severity

- **Critical:** likely exploit causing auth bypass, data exposure, remote code execution, secret leak, or cross-tenant access
- **Important:** plausible security weakness, missing authorization check, unsafe default, or missing regression test
- **Minor:** defense-in-depth, documentation, logging, or hardening improvement

Critical issues block progress. Important issues should be fixed before merge unless the human partner explicitly accepts the risk.

## Red Flags

Stop and request security review if you catch yourself saying:

- "This endpoint is internal, so auth is unnecessary"
- "The UI hides it, so users cannot call it"
- "Validation happens somewhere else"
- "This is only admin-facing"
- "The token is short-lived, so logging it is fine"
- "We can add security tests later"
- "The model should know not to call dangerous tools"

## Output Format

The security reviewer must return:

```markdown
### Scope Reviewed
[Files, feature area, base/head SHAs]

### Threat Model
[Assets, actors, trust boundaries, risky inputs]

### Findings

#### Critical
[Must-fix issues]

#### Important
[Should-fix issues]

#### Minor
[Hardening or clarity issues]

### Missing Tests
[Security tests or manual checks still needed]

### Positive Controls
[Security decisions that are sound]

### Assessment
Ready to merge: Yes / No / With fixes
Reasoning: [1-2 sentences]
```

## Related Skills

**REQUIRED SUB-SKILL:** Use superpowers:verification-before-completion before claiming security issues are fixed.

Use superpowers:test-driven-development when adding regression tests for security boundaries.
