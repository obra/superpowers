---
name: parameterizing-plan-docs
description: Use when authoring or maintaining a multi-step plan, runbook, or implementation document containing configurable values (ports, namespaces, repo names, version pins, paths, URLs, secret names) that future readers may need to substitute when applying the plan to a different environment.
---

# Parameterizing Plan Docs

## Overview

A plan or implementation doc serves two readers: the **historical record** of what was built, and the **template** for re-applying it elsewhere. Hardcoded configurable values (ports, namespaces, repo names, version pins) scattered as body literals break both roles -- the artifact rots as values drift; the template is invisible until a reader hits a collision. This is the **best-practice pattern** for resolving that tension.

**Core principle:** Factor configurable parameters into a top-of-doc table documenting the option range and rationale; leave body code blocks with the project's concrete defaults. Body = historical artifact. Top table = template lens. Both stay accurate; neither contaminates the other.

## When to Use

- Authoring or maintaining plans, runbooks, implementation docs, or setup guides
- Doc has 3+ references to an environment-specific value
- Reader will reasonably ask "what can I change here?"
- Hardcoded values have caused collisions, drift, or stale references

**When NOT to use:** single-use scripts; compliance / security / contract docs with mandated fixed values; project-internal conventions baked into code (use `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` instead).

## The Pattern

1. **Identify configurable parameters.** Common categories: ports, namespaces, organization/repo names, version pins, file paths, URLs, secret names, cluster names, region codes, account IDs, environment labels.

2. **Insert a parameter section immediately after the metadata block** (before content sections):
   - Heading: `## <Category> Selection` (e.g., Host Port Selection, Namespace Selection, Version Pinning)
   - 1-2 sentences of context: what the parameter is, why configurable, what value the body retains
   - Table of plausible options, one per row, with a rationale column
   - Bold the project's currently-used value alongside its rationale
   - **Substitution checklist**: enumerate the files / sections that need updating once a reader picks their own value

3. **Leave body code blocks unchanged.** Keep the original concrete value as a deliberate historical anchor. Do NOT replace it with `<PLACEHOLDER>` syntax -- that breaks copy-paste, removes the doc's value as a faithful artifact, and forces readers to re-render mentally on every reading.

## Quick Reference

| Parameter type | Table column | Rationale column |
|---|---|---|
| Port | Port number | Memorability, collision odds, IANA status |
| Namespace | Namespace name | Convention, isolation tier, naming scheme |
| Version pin | Version string | Compatibility, stability, security posture |
| Repo name | Org/repo path | Ownership, naming convention |
| Path | Path string | Mount points, FHS conventions, project layout |
| Secret name | Secret identifier | Naming scheme, scope, rotation policy |

## Common Mistakes

- **Placeholder syntax in body code blocks** -- breaks copy-paste; defeats the artifact role
- **Parameter table buried at the end** -- place immediately after metadata
- **Single-row "table"** -- a range with rationale *is* the value; one row is hardcoding with extra steps
- **No substitution checklist** -- readers know "I can change this" but not "where else this threads"
- **"Currently used" marker drifting from body** -- sync when either side changes

## Red Flags

- "Only one parameter is configurable, not worth a table" -- if it varies, document the variance
- "The doc is short, parameterizing is overkill" -- short docs get reused more, not less
- "Readers can just grep" -- they cannot grep for what they do not know is configurable
- "We will refactor the body to use placeholders later" -- placeholders contaminate the artifact role; do not

## Real-World Impact

Applied to a 3500-line plan with 30+ references to a single configurable host port (originally hardcoded to a heavily-trafficked dev-tool port), the pattern collapsed re-application from "audit every code block" to "read the top table, run the substitution checklist." Body stayed canonical; table became the template lens.

## Cross-Reference

**RELATED:** `superpowers:writing-plans` -- general plan-doc structure conventions; this skill refines them on the configurability axis.
