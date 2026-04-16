---
name: requesting-security-review
description: Use when changes touch authentication, authorization, sensitive data, user input, file handling, webhooks, or agent execution to catch security vulnerabilities before they ship
---

# Requesting Security Review

Dispatch superpowers:security-reviewer subagent to catch security vulnerabilities before they cascade.

The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on trust boundaries and abuse paths, not your thought process, and preserves your own context for continued work.

**Core principle:** Security review is not code review. It asks whether there is a realistic abuse path, not whether the implementation is correct.

## When to Request Security Review

**Mandatory — trigger when changes touch:**
- Authentication, sessions, tokens, passwords, or account recovery
- Authorization, roles, permissions, ownership checks, or tenant boundaries
- Sensitive data, secrets, PII, payment data, or health information
- User-controlled input that reaches SQL, HTML, shell commands, file paths, templates, URLs, or prompts
- File uploads, downloads, previews, import/export
- Webhooks, redirects, callbacks, or URL fetching
- Admin tools, moderation tools, or audit logs
- Third-party dependencies, build configuration, deployment configuration, or trust-related defaults
- Agent/tool execution, sandboxing, filesystem access, or network access

**Optional but valuable:**
- Before merging any branch that touches the surface areas above
- After fixing a security bug (verify the fix is complete)
- When a code reviewer flags a potential security concern

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main, or the SHA before the relevant work
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch security-reviewer subagent:**

Use Task tool with `superpowers:security-reviewer` type, fill template at `security-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` — What you just built
- `{PLAN_OR_REQUIREMENTS}` — What it should do
- `{BASE_SHA}` — Starting commit
- `{HEAD_SHA}` — Ending commit
- `{DESCRIPTION}` — Brief summary of security-sensitive surface areas touched

**3. Act on findings:**
- Fix **Critical** issues immediately — do not proceed
- Fix **Important** issues before proceeding to next task
- Note **Minor** issues for later or address opportunistically
- Push back if the reviewer is wrong (with reasoning and evidence)

## Example

```
[Just completed Task 3: Add file upload endpoint]

You: Changes touch file handling and user input — requesting security review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 2" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch superpowers:security-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: File upload endpoint with type validation and storage
  PLAN_OR_REQUIREMENTS: Task 3 from docs/superpowers/plans/feature-plan.md
  BASE_SHA: c3f91ab
  HEAD_SHA: 7d2e441
  DESCRIPTION: POST /upload — accepts multipart, validates MIME type, writes to uploads/

[Subagent returns]:
  Scope reviewed: upload.ts, storage.ts, routes/files.ts
  Threat model: Unauthenticated upload, path traversal, polyglot files, DoS via large upload
  Findings:
    Critical: Path traversal — filename not sanitized before join with upload dir (upload.ts:34)
    Important: No file size limit enforced — missing maxSize in middleware (routes/files.ts:12)
    Minor: MIME type checked from Content-Type header only, not file magic bytes
  Missing tests: No test for ../../../etc/passwd filename, no test for >100MB upload
  Positive controls: Upload directory is outside web root ✓
  Merge readiness: NOT READY — fix Critical before proceeding

You: [Sanitize filename with path.basename, add size limit]
[Re-request security review on the fix]
[Continue to Task 4]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Request security review after any task that touches the mandatory surface areas above
- Do this in addition to the normal code quality review — they have different goals
- Security review asks: "Is there a realistic abuse path?" Code review asks: "Is the implementation correct?"

**Executing Plans:**
- Request security review after each batch that touches security-sensitive areas
- A single security-review pass before merge is a minimum; per-task review is better

**Ad-Hoc Development:**
- Request before merge whenever the diff touches any mandatory surface area

## Red Flags

**Never:**
- Skip security review because "it's internal only" or "users are trusted"
- Ignore Critical findings
- Proceed past Important findings without fixing them
- Conflate "no known vulnerability" with "no vulnerability"

**If reviewer is wrong:**
- Push back with technical reasoning
- Show the authorization check, input sanitization, or boundary that makes the concern invalid
- Request clarification on the attack scenario

## Relationship to Code Review

Security review and code review are complementary, not interchangeable.

| | Code Review | Security Review |
|---|---|---|
| Goal | Correct, maintainable, tested | No realistic abuse path |
| Lens | Implementation quality | Trust boundaries, actors, exploits |
| Triggered by | Every task | Security-sensitive surface areas |
| Skill | `requesting-code-review` | `requesting-security-review` (this skill) |

Both should run when changes touch security-sensitive areas.

See template at: `requesting-security-review/security-reviewer.md`
