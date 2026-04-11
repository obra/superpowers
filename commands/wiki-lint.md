---
description: "Check wiki health and report issues. Finds orphan pages, broken wikilinks, stale pages, missing coverage, contradictions, and suggests auto-fixes."
disable-model-invocation: true
---

Invoke the superpowers:wiki-management skill in LINT mode and follow it exactly as presented to you.

## Lint Mode Checklist

You MUST perform ALL 6 health checks below and include results for each in your report:

1. **Orphan pages** — Find wiki pages in `docs/wiki/` that are not linked from any other wiki page (excluding `index.md` and `log.md`)
2. **Broken wikilinks** — Find `[[wikilinks]]` that point to pages that do not exist in `docs/wiki/`
3. **Stale pages** — Find wiki pages where `last_updated` in frontmatter is older than 30 days
4. **Missing coverage** — Find raw source documents in `docs/specs/`, `docs/api/`, `docs/plans/` that are not reflected in any wiki page's `sources` frontmatter
5. **Contradictions** — Cross-check key facts across wiki pages and flag information that conflicts between pages
6. **Auto-fix suggestions** — For each issue found, suggest a concrete fix (e.g., add missing link, update stale page, create missing wiki page)

## Output Format

Present results as a structured report grouped by check type. If a check finds no issues, mark it as passing. End with a summary count of total issues found.
