---
name: superpowers:compound
description: Use when a problem has just been solved and verified working — the fix is fresh, the investigation is in recent history, and the solution is non-trivial enough to capture for future reference
---

# Compound

## Overview

Captures problem solutions while context is fresh, creating structured documentation in `docs/solutions/` with YAML frontmatter for searchability. Uses parallel subagents to gather context, extract the solution, find related docs, develop prevention strategies, and classify the category — then the orchestrator assembles and writes a single final file.

<critical_requirement>
**Only ONE file gets written — the final documentation.**

Phase 1 subagents return TEXT DATA to the orchestrator. They must NOT write files. Only the orchestrator (Phase 2) writes the final documentation file.
</critical_requirement>

## When to Use

**Trigger phrases:** "that worked", "it's fixed", "working now", "problem solved", "tests are passing"

**Use when:**
- Problem is solved and solution is verified working
- Solution is non-trivial (not a simple typo or obvious error)
- Context is fresh — investigation steps are in recent conversation history

**Don't use when:**
- Fix is still in progress or unverified
- Problem was trivial

## Quick Reference

```bash
/superpowers:compound                    # Document the most recent fix
/superpowers:compound [brief context]    # Provide additional context hint
/compound --compact          # Single-pass mode for context-constrained sessions
```

**Output location:** `docs/solutions/[category]/[filename].md`

**Categories auto-detected from problem type:**
`build-errors` · `test-failures` · `runtime-errors` · `performance-issues` · `database-issues` · `security-issues` · `ui-bugs` · `integration-issues` · `logic-errors`

## Implementation

**Always run full mode by default.** Use compact-safe mode only when explicitly requested.

### Phase 0.5: Auto Memory Scan

Before Phase 1, read MEMORY.md from the auto memory directory. If relevant entries exist for the problem being documented, pass them as a labeled supplementary excerpt to the Context Analyzer and Solution Extractor prompts. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])".

### Phase 1: Parallel Research

Launch these five subagents IN PARALLEL — each returns text data only, no files:

| Subagent | Returns |
|----------|---------|
| **Context Analyzer** | YAML frontmatter skeleton (problem type, component, symptoms) |
| **Solution Extractor** | Root cause + working solution with code examples |
| **Related Docs Finder** | Cross-references, related issues, stale doc candidates |
| **Prevention Strategist** | Prevention strategies and test cases |
| **Category Classifier** | Final `docs/solutions/[category]/[filename].md` path |

### Phase 2: Assembly & Write

WAIT for all Phase 1 subagents to complete, then:

1. Collect all text results from Phase 1 subagents
2. Assemble complete markdown file
3. Validate YAML frontmatter
4. `mkdir -p docs/solutions/[category]/`
5. Write the single final file: `docs/solutions/[category]/[filename].md`

### Phase 2.5: Selective Refresh

After writing, check whether older docs should be refreshed. `superpowers:compound-refresh` is **not** a default follow-up — invoke it selectively:

| Condition | Action |
|-----------|--------|
| New fix contradicts a prior doc's recommendation | Invoke `superpowers:compound-refresh [doc-name]` |
| New fix supersedes an older solution | Invoke with narrowest useful scope |
| Multiple related candidates in same area | Ask user whether to run targeted refresh |
| No related docs found, or docs still consistent | Skip |

Never invoke `superpowers:compound-refresh` without a scope argument.

### Phase 3: Optional Enhancement

After Phase 2, optionally invoke specialized agents based on problem type:

| Problem type | Agent |
|-------------|-------|
| `performance_issue` | `performance-oracle` |
| `security_issue` | `security-sentinel` |
| `database_issue` | `data-integrity-guardian` |
| `test_failure` | `cora-test-reviewer` |
| Code-heavy | `kieran-rails-reviewer` + `code-simplicity-reviewer` |

### Compact-Safe Mode

When context is tight: skip Phase 1 subagents entirely. In one sequential pass, extract problem/root cause/solution from conversation history (plus any relevant MEMORY.md notes), classify the category, and write a minimal doc with YAML frontmatter, 1-2 sentence problem description, root cause, key code snippets, and one prevention tip. Skip Phase 3 reviews.

## Common Mistakes

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| Subagents write files like `context-analysis.md`, `solution-draft.md` | Subagents return text data; orchestrator writes one final file |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | Single file: `docs/solutions/[category]/[filename].md` |
