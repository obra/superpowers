---
name: hads
description: Use when writing or converting technical documentation that needs to be readable by both humans and AI models, or when optimizing existing docs for AI consumption and token efficiency.
---

# HADS — Human-AI Document Standard

## Overview

Lightweight Markdown tagging convention that separates machine-readable facts from human context — in the same document, without duplication.

## Four Block Types

| Tag | Content | Reader |
|-----|---------|--------|
| `**[SPEC]**` | Authoritative facts. Terse. Lists/tables/code. | AI primary |
| `**[NOTE]**` | Context, history, examples, rationale. Verbose OK. | Human primary |
| `**[BUG]**` | Verified failure + fix. Requires: symptom, cause, fix. | Both |
| `**[?]**` | Unverified/inferred. Treat as hypothesis. | Both |

**Rule:** Tag must be bold, on its own line, no blank line before content.

## Document Structure (required order)

```markdown
# Document Title
**Version:** 1.0.0

---

## AI Reading Instructions
**[SPEC] blocks** — extract directly as facts
**[NOTE] blocks** — skip unless context needed
**[BUG] blocks** — always read
**[?] blocks** — treat as unverified

---

## Section Name

**[SPEC]**
- Key: Value
- Key: Value

**[NOTE]**
Narrative explanation for humans.

**[BUG] Short description**
Symptom: ...
Cause: ...
Fix: ...
```

## Quick Example

```markdown
## Authentication

**[SPEC]**
- Method: Bearer token
- Header: `Authorization: Bearer <token>`
- Token expiry: 3600s
- Refresh: `POST /auth/refresh`

**[NOTE]**
Switched from cookie-based auth in v2.0 (2022). Legacy docs mentioning
cookies are outdated.

**[BUG] Token rejected after password change**
Symptom: 401 `{"error": "invalid_token"}` identical to expired token
Cause: All tokens invalidated on password change, no error distinction
Fix: Re-authenticate after any account operation
```

## When to Apply Each Tag

- `[SPEC]` — anything an AI should extract as ground truth: endpoints, types, limits, formats, flags
- `[NOTE]` — why decisions were made, historical context, caveats, examples
- `[BUG]` — any known failure mode with confirmed fix (no fix = use `[?]`)
- `[?]` — inferred behavior, unconfirmed edge cases, suspected causes

## Benefits

- AI reads `[SPEC]` only → fewer tokens, less hallucination
- Humans read `[NOTE]` → full context preserved
- Single file serves both — no separate "AI context" files
- Standard Markdown — no tooling required

## Validator

```bash
python validator/validate.py your-doc.md
# Exit 0: valid | 1: warnings | 2: errors | 3: not HADS
```
