# Wiki Management System Design

## Overview

Implement Andrej Karpathy's LLM Wiki pattern as a superpowers skill. Instead of Claude Code exploring the codebase every session, a wiki serves as a pre-compiled knowledge cache that accumulates over time.

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Target | Universal skill for all projects using superpowers | superpowers is a skill library; wiki should be per-project |
| Update timing | Existing skill integration + manual `/wiki-sync` | Realistic within Claude Code's session-based model |
| L1 cache loading | CLAUDE.md `@docs/wiki/hot.md` reference | Simplest, automatic every session |
| Relationship with auto memory | Separate — memory for user context, wiki for project knowledge | Different purposes, clean separation |
| Wiki language | Follows raw source language | Universal skill shouldn't force a specific language |
| Architecture | Single skill + separate commands | Start simple, split if skill exceeds 200 lines |
| Update coverage gap | Catch at finishing/verification stage | Avoids parallel worker conflicts, covers all work paths |

## 3-Layer Structure (Karpathy Pattern)

- **Raw Sources (immutable)**: `docs/specs/`, `docs/api/`, `docs/plans/` — human-managed, LLM never modifies
- **Wiki (LLM-owned)**: `docs/wiki/` — LLM generates and maintains markdown pages
- **Schema (rules)**: CLAUDE.md wiki section — instructs LLM how to structure the wiki

## L1/L2 Cache

- **L1**: `hot.md` auto-loaded via CLAUDE.md `@` reference (~500 words, every session)
- **L2**: Full wiki pages, accessed on-demand via `index.md` lookup

## Files to Create

### Skill

```
skills/wiki-management/skill.md    # Core skill with ingest/query/sync/lint sections
```

### Commands

```
commands/wiki-init.md              # /wiki-init — one-time project wiki creation
commands/wiki-sync.md              # /wiki-sync — full raw→wiki sync
commands/wiki-lint.md              # /wiki-lint — wiki health check
```

### Wiki structure (created by wiki-init in target project)

```
docs/wiki/
├── index.md                       # Page catalog with one-line summaries
├── hot.md                         # L1 cache (~500 words)
├── log.md                         # Change history (append-only)
├── architecture.md                # Architecture summary
├── features.md                    # Feature list + status
├── api-contracts.md               # API contract summary
├── decisions.md                   # Key decisions with rationale
├── tech-stack.md                  # Tech stack + config summary
└── changelog.md                   # Commit-based change history
```

## Skill Modes

### Ingest

**Trigger**: After existing skills create/modify docs in specs/api/plans/

1. Read changed raw document
2. Extract key concepts, entities, API contracts
3. Create or update related wiki pages
4. Maintain `[[wikilinks]]` cross-references
5. Update `index.md` catalog
6. Append to `log.md`
7. Update `hot.md` (keep under 500 words)

### Query

**Trigger**: Questions about project spec/architecture/API, or api-edr-validation reference

1. Check `hot.md` (already loaded via CLAUDE.md @reference)
2. Find related pages in `index.md`
3. Read wiki pages and synthesize answer
4. If wiki lacks answer → explore code → reflect findings back to wiki

### Sync

**Trigger**: `/wiki-sync` command

1. Scan all raw sources in `docs/specs/`, `docs/api/`, `docs/plans/`
2. Compare with current codebase implementation
3. Bulk update all wiki pages
4. Mark spec↔implementation mismatches in relevant pages
5. Regenerate `hot.md`

### Lint

**Trigger**: `/wiki-lint` command

1. Orphan pages (not linked from any other page)
2. Broken `[[wikilinks]]`
3. Stale pages (old `last_updated`)
4. Raw docs not reflected in wiki
5. Contradictory information across pages
6. Output report + suggest auto-fixes

## Existing Skill Integration

| Skill | Integration Point | Wiki Action |
|---|---|---|
| `brainstorming` | After saving design doc to `docs/plans/` | Ingest → `features.md`, `decisions.md` |
| `writing-plans` | After plan creation | Ingest → `features.md` |
| `api-edr-validation` | Before API verification | Query → `api-contracts.md` first |
| `finishing-a-development-branch` | On branch completion | Ingest + Git → `changelog.md`, related pages, `hot.md` |
| `audit-verification` | During audit | Query → spec vs implementation comparison |
| `verification-before-completion` | Before commit/PR | Ingest → ensure wiki reflects completed work |

**Key principle**: If `docs/wiki/` doesn't exist, skip all wiki integration. No impact on projects that haven't run `/wiki-init`.

## CLAUDE.md Schema (inserted by wiki-init)

```markdown
## Wiki Knowledge Base

@docs/wiki/hot.md

### Session Start Protocol
1. hot.md is auto-loaded via @ reference above
2. Look up related pages in docs/wiki/index.md if needed
3. Only explore code when wiki lacks the answer

### Wiki Update Rules
- Update related wiki pages on feature completion / branch finish
- All updates are recorded in log.md (append-only)
- Maintain [[wikilinks]] between wiki pages
- Each wiki page includes last_updated and sources

### Raw Sources (immutable — never modify)
- docs/specs/   : Specs, PRDs, requirements
- docs/api/     : API contracts, schemas
- docs/plans/   : Implementation plans

### Wiki (LLM-owned)
- docs/wiki/    : Knowledge pages generated and maintained by LLM
```

## Wiki Page Template

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
1-2 sentence core content

## Details
Body text. Related concepts linked via [[wikilinks]].

## Change History
- YYYY-MM-DD: Change description (commit: abc1234)
```

## Special Page Rules

### hot.md
- **500 words max** strictly enforced
- Content: current project state summary, active work, recent major changes
- Overwritten (not appended) on each wiki update

### log.md
- **Append-only** — never delete existing content
- Format: `- YYYY-MM-DD HH:MM: [action] target page (reason)`

## Implementation Priority

1. `commands/wiki-init.md` — project wiki creation command
2. `skills/wiki-management/skill.md` — core skill file
3. `commands/wiki-sync.md`, `commands/wiki-lint.md` — utility commands
4. Target project CLAUDE.md wiki schema section (handled by wiki-init)
5. Existing skill files — add wiki integration triggers (finishing-a-development-branch first)
