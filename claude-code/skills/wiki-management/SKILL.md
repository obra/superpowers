---
name: wiki-management
description: "Manages project wiki knowledge base — ingest raw sources into wiki pages, query wiki for answers, sync wiki with codebase, and lint wiki for quality issues. Implements Karpathy LLM Wiki pattern: Raw Sources (immutable) -> Wiki (LLM-owned) -> Schema (CLAUDE.md)."
---

# Wiki Management

## Overview

Manage a project's wiki knowledge base using the Karpathy LLM Wiki pattern. The wiki serves as a pre-compiled knowledge cache that accumulates over time, so Claude doesn't need to re-explore the codebase every session.

**3-Layer Structure:**
- **Raw Sources (immutable)**: `docs/specs/`, `docs/api/`, `docs/plans/` — human-managed, LLM never modifies
- **Wiki (LLM-owned)**: `docs/wiki/` — LLM generates and maintains markdown pages
- **Schema (rules)**: CLAUDE.md wiki section — instructs LLM how to structure the wiki

**L1/L2 Cache:**
- **L1**: `hot.md` — auto-loaded via CLAUDE.md `@docs/wiki/hot.md` reference (~500 words, every session)
- **L2**: Full wiki pages — accessed on-demand via `index.md` lookup

## Pre-flight Check

Before ANY wiki operation, verify the wiki directory exists:

```bash
test -d docs/wiki/
```

**If `docs/wiki/` does NOT exist: skip all wiki operations silently.** No errors, no warnings. Wiki integration has zero impact on projects that haven't initialized a wiki. Return immediately without performing any wiki work.

## Raw Source Protection

**NEVER modify files in these directories:**
- `docs/specs/` — Specs, PRDs, requirements
- `docs/api/` — API contracts, schemas
- `docs/plans/` — Implementation plans

These are human-managed raw sources. The wiki reads from them but never writes to them. Violation of this rule corrupts the 3-layer separation.

## Modes

### Mode 1: Ingest

**Trigger**: After existing skills create/modify docs in `specs/`, `api/`, or `plans/`, or after feature completion.

**Steps:**

1. **Read changed raw document** — identify the source file that was created or modified
2. **Extract key concepts** — pull out entities, API contracts, architectural decisions, feature descriptions
3. **Create or update wiki pages** — write extracted knowledge to the appropriate wiki page(s) using the Wiki Page Template
4. **Maintain wikilinks** — add `[[page-name]]` cross-references between related pages (no `.md` extension in links)
5. **Update `index.md`** — add or update the page entry in the catalog
6. **Append to `log.md`** — record the ingest action (append-only, never delete existing entries)
7. **Update `hot.md`** — rewrite with current project state summary (overwrite, keep under 500 words)

### Mode 2: Query

**Trigger**: Questions about project spec/architecture/API, or when another skill needs project context.

**Steps:**

1. **Check `hot.md`** — already loaded via CLAUDE.md `@` reference, check if it answers the question
2. **Find related pages in `index.md`** — look up the catalog for relevant wiki pages
3. **Read wiki pages and synthesize answer** — combine information from relevant pages
4. **If wiki lacks answer** — explore code directly, then reflect findings back into wiki via Ingest mode

### Mode 3: Sync

**Trigger**: `/wiki-sync` command.

**Steps:**

1. **Scan all raw sources** — read all files in `docs/specs/`, `docs/api/`, `docs/plans/`
2. **Compare with current codebase** — check implementation against documented specs
3. **Bulk update all wiki pages** — regenerate wiki content from raw sources + code reality
4. **Mark mismatches** — flag spec-vs-implementation discrepancies in relevant wiki pages
5. **Regenerate `hot.md`** — rewrite with current project state (overwrite, 500 words max)

### Mode 4: Lint

**Trigger**: `/wiki-lint` command.

**Checks:**

1. **Orphan pages** — wiki pages not linked from any other page or `index.md`
2. **Broken wikilinks** — `[[page-name]]` references pointing to non-existent pages
3. **Stale pages** — pages with `last_updated` older than 30 days
4. **Missing coverage** — raw docs in `specs/`, `api/`, `plans/` not reflected in any wiki page
5. **Contradictions** — conflicting information across wiki pages
6. **Output report** — summarize findings and suggest auto-fixes

## Wiki Page Template

All wiki pages (except special pages) use this format:

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
1-2 sentence core content.

## Details
Body text. Related concepts linked via [[wikilinks]].

## Change History
- YYYY-MM-DD: Change description (commit: abc1234)
```

**Template rules:**
- YAML frontmatter is required on every wiki page
- `last_updated` uses ISO date format
- `sources` lists raw source files this page was derived from
- `related` uses `[[page-name]]` wikilink format (no `.md` extension)
- Commit references use short form (7 characters)
- Wiki language follows the language of its raw sources

## Special Pages

### `hot.md` (L1 Cache)
- **500 words max** — strictly enforced
- Content: current project state summary, active work, recent major changes
- **Overwritten** (not appended) on each wiki update
- Auto-loaded every session via CLAUDE.md `@docs/wiki/hot.md`

### `log.md` (Change History)
- **Append-only** — never delete or modify existing entries
- Format: `- YYYY-MM-DD HH:MM: [action] target page (reason)`
- Actions: `[ingest]`, `[sync]`, `[lint-fix]`, `[query-reflect]`

### `index.md` (Page Catalog)
- Lists all wiki pages with one-line summaries
- Updated whenever a page is created, renamed, or deleted
- Serves as the L2 lookup table for Query mode

## Integration

| Skill | Integration Point | Wiki Action |
|---|---|---|
| `brainstorming` | After saving design doc to `docs/plans/` | Ingest -> `features.md`, `decisions.md` |
| `writing-plans` | After plan creation | Ingest -> `features.md` |
| `api-edr-validation` | Before API verification | Query -> `api-contracts.md` first |
| `finishing-a-development-branch` | On branch completion | Ingest + Git -> `changelog.md`, related pages, `hot.md` |
| `audit-verification` | During audit | Query -> spec vs implementation comparison |
| `verification-before-completion` | Before commit/PR | Ingest -> ensure wiki reflects completed work |

**Key principle**: If `docs/wiki/` doesn't exist, skip all wiki integration. No impact on projects that haven't run `/wiki-init`.
