---
name: wiki-management
description: Use when managing a project wiki knowledge base, ingesting specs or plans into docs/wiki, querying project knowledge, syncing wiki pages with code reality, or linting wiki quality.
---

# Wiki Management

## Overview

Manage a project's wiki knowledge base using the Karpathy LLM Wiki pattern. The wiki is a pre-compiled knowledge cache that accumulates project facts over time, so Codex can query stable project context instead of re-exploring the codebase every session.

**Three layers:**
- **Raw sources:** `docs/specs/`, `docs/api/`, `docs/plans/`; human-managed, read-only for wiki work.
- **Wiki:** `docs/wiki/`; generated and maintained Markdown pages.
- **Schema:** the repository's agent instructions, such as a Wiki Knowledge Base block.

**Cache shape:**
- **L1:** `docs/wiki/hot.md`; short current-state summary.
- **L2:** full wiki pages reached through `docs/wiki/index.md`.

## Delegation Gate

For wiki writes, use `spawn_agent` only when the user explicitly asks for delegation, subagents, parallel agents, reviewer workflow, or a team-driven workflow is already active.

When delegation is authorized, hand off to a Wiki Writer subagent with `wiki-writer-prompt.md`. The main session may read wiki files, gather context, inspect diffs, and decide whether the result is acceptable. Pass precise source paths, findings, target pages, and ownership limits.

The main Codex session must not edit, write, modify, create, delete, or format `docs/wiki/**` directly. If Wiki Writer delegation is not authorized, unavailable, cannot be dispatched, or not permitted by the current runtime, do not update wiki files. Draft the exact wiki update or report it as pending instead.

Always preserve user and worker changes. Read existing wiki files first, keep handoffs minimal, and never ask the Wiki Writer to overwrite unrelated work.

## Preflight

Before any wiki operation except init, verify the wiki exists:

```bash
test -d docs/wiki/
```

If `docs/wiki/` does not exist, skip wiki work silently. Wiki integration must have no effect on projects that have not initialized a wiki.

Init may create `docs/wiki/` only when the user requests wiki setup and the active task allows those writes.

## Raw Source Protection

Never modify raw source directories during wiki work:
- `docs/specs/`
- `docs/api/`
- `docs/plans/`

Read these files as source material, but do not reformat, rename, or update them from this skill. Wiki pages can cite raw sources; raw sources do not get changed to match the wiki.

## Modes

### Ingest

Use after specs, API docs, plans, or completed feature work need to be reflected in the wiki.

1. Gather context: changed raw documents, task outcome, relevant diff or commits, and current `docs/wiki/index.md`.
2. Choose execution path: authorized Wiki Writer handoff, or pending draft/report when the delegation gate is closed.
3. Extract key concepts for the handoff: entities, API contracts, architectural decisions, workflows, and feature descriptions.
4. Ask the Wiki Writer to create or update focused wiki pages using the wiki page template.
5. Ask the Wiki Writer to maintain `[[wikilinks]]` between related pages, with no `.md` extension in links.
6. Ask the Wiki Writer to update `index.md`, append `log.md`, and refresh `hot.md` under the repository's word budget.
7. Review the resulting diff for factual alignment with the source work.

### Query

Use for questions about project specs, architecture, APIs, implementation state, or when another skill needs project context.

1. Check `docs/wiki/hot.md` if present.
2. Use `docs/wiki/index.md` to find related pages.
3. Read relevant pages and synthesize the answer with source caveats.
4. If the wiki lacks the answer, inspect the codebase or raw sources directly.
5. If useful and allowed, reflect newly discovered stable facts back into the wiki through Ingest mode.

### Sync

Use when asked to reconcile wiki content with raw sources and code reality.

1. Scan raw sources in `docs/specs/`, `docs/api/`, and `docs/plans/`.
2. Compare documented expectations with current implementation.
3. Identify missing, stale, or contradictory wiki pages.
4. Update through the delegation gate: authorized Wiki Writer handoff, or pending draft/report when the gate is closed.
5. Mark spec-vs-implementation mismatches in relevant wiki pages.
6. Ask the Wiki Writer to regenerate `hot.md`, update `index.md`, append `log.md`, then review the diff.

### Lint

Use when asked to assess wiki quality. Linting is read-only unless the user asks to apply fixes and the active task allows writes.

Check for:
- Orphan pages not linked from `index.md` or another wiki page.
- Broken `[[wikilinks]]`.
- Stale pages with old `last_updated` values.
- Missing coverage for raw docs.
- Contradictions across wiki pages.

Report findings with suggested fixes. Apply fixes only through an authorized Wiki Writer handoff; otherwise report the exact pending fix.

## Wiki Page Template

Use this shape for normal wiki pages:

```markdown
---
title: Page Title
last_updated: YYYY-MM-DD
sources:
  - docs/specs/example.md
related: [[architecture]], [[features]]
---

# Page Title

## Summary
One or two sentences with the core fact.

## Details
Body text with related concepts linked through [[wikilinks]].

## Change History
- YYYY-MM-DD: Change description (commit: abc1234)
```

Rules:
- YAML frontmatter is required on normal pages.
- `last_updated` uses ISO date format.
- `sources` lists raw source files or implementation paths used for the page.
- `related` uses `[[page-name]]` links without file extensions.
- Commit references use short hashes when available.
- Match the language of the raw sources unless the user asks otherwise.

## Special Pages

### `hot.md`

- Short current-state summary for high-value project context.
- Overwritten during wiki updates rather than appended.
- Keep under the repository's configured word budget; default to 500 words.

### `log.md`

- Append-only.
- Use entries like `- YYYY-MM-DD HH:MM: [ingest] target page (reason)`.
- Actions include `[ingest]`, `[sync]`, `[lint-fix]`, and `[query-reflect]`.

### `index.md`

- Catalogs wiki pages with one-line summaries.
- Updated whenever pages are created, renamed, deleted, or substantially changed.
- Serves as the lookup table for query mode.

## Integration Points

Use wiki-management from other workflows only when `docs/wiki/` exists or the user asks for wiki init:

| Workflow | Wiki action |
|---|---|
| Brainstorming or planning saved to `docs/plans/` | Ingest stable decisions and feature context. |
| API validation | Query API contract pages first; ingest durable discoveries when missing. |
| Branch completion | Ingest changelog-worthy implementation facts. |
| Audit or verification | Query wiki for expected behavior, then compare with code reality. |
| Final checks | Confirm completed work is reflected when wiki writes are in scope. |

If the wiki directory is absent, skip integration without warnings.
