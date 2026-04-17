---
name: guiding-pr-review
description: Use when a human reviewer asks you to help them review a PR or branch — orients them on what changed, ranks files by review importance, and proposes a reading order. Read-only analysis, not a review. Distinct from the built-in /review skill (which produces a review) and from requesting-code-review (which dispatches a reviewer agent).
---

# Guiding PR Review

## Overview

Help a human reviewer orient themselves in a PR. You are **not** reviewing — you are a map.

**Core principle:** Short, on-point, read-only. The reviewer does the reviewing.

## Hard Constraints

**NEVER:**
- Write or edit files
- Post PR comments, approve, or request changes
- Produce a multi-page summary
- Critique code quality or correctness (that is their job)
- Go file-by-file with long descriptions (the diff already does that)

**ALWAYS:**
- Keep output compact (budgets below)
- Read the PR discussion before ranking files
- Name specific files and line ranges, not vague areas

## Workflow

```
1. GATHER   → PR metadata, description, discussion, file list, diffstat, commits
2. TRIAGE   → split files into FOCUS vs SKIM tiers
3. ORDER    → build a review path through FOCUS files
4. REPORT   → emit the tight summary (see Output Budget)
```

### 1. Gather

Resolve the PR (number, URL, or current branch). Then run, in parallel:

```bash
gh pr view <ref> --json number,title,body,author,baseRefName,headRefName,state,isDraft,additions,deletions,changedFiles
gh pr view <ref> --comments
gh api repos/{owner}/{repo}/pulls/<num>/comments   # inline review threads
gh pr diff <ref> --name-only
git diff <base>...<head> --stat
git log <base>..<head> --oneline
```

If no PR exists (local branch only), skip `gh pr *` and work from `git` alone. Say so in the summary.

For files that look load-bearing (see Triage), read the diff for just those files rather than the whole PR:

```bash
gh pr diff <ref> -- <file>
```

### 2. Triage

**SKIM tier** (flag as "don't spend time here"):
- Lockfiles: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`, `poetry.lock`, `Gemfile.lock`
- Generated: `*_pb.go`, `*.pb.*`, generated SDK clients, OpenAPI-generated code, `*.generated.*`
- Snapshots: `*.snap`, `__snapshots__/`
- Vendored: `vendor/`, `third_party/`
- Pure renames / formatting-only diffs (detect with `git diff --stat` + `--find-renames`)
- **Tests** — skim to confirm coverage exists for the claimed behavior, but do not line-read
- Docs content edits (read headings, not bodies)
- Large fixture data (`.json`, `.csv`, `.sql` seed files) — check shape, not values

**FOCUS tier:**
- Public API changes: exported functions, HTTP routes, CLI flags, schema/migrations
- Core logic touched by the PR's stated goal
- Security-sensitive paths: auth, crypto, input validation, SQL construction, file/path handling
- Call sites of changed APIs (ripple effects)
- Config/env/infra changes that alter runtime behavior

Heuristics for demoting to SKIM even if they look like code:
- >500 LOC changed but almost all additions of repetitive patterns (fixtures, enum entries, table rows)
- Mechanical refactor (rename, move) confirmed by reading 1–2 hunks

### 3. Order

Build a review path through FOCUS files, ≤10 entries. Default ordering:

1. PR description + linked issue (intent)
2. Public API / schema change (what the outside world sees)
3. Core logic implementing the change (the "why")
4. Call sites & dependents (blast radius)
5. Config / migrations (runtime / data impact)
6. A quick glance at one or two test files to sanity-check coverage

Each entry: `path/to/file.ext:Lstart-Lend — one-line reason`. No paragraphs.

### 4. Report

Produce a single message with these sections, nothing else:

```
## What changed
- 3–5 bullets, one line each. Behavior, not file list.

## Why (from PR/commits)
1–2 sentences. Quote the PR body if it says it well.

## Skip or skim
- file — reason (e.g. "lockfile", "generated", "pure rename", "snapshot")

## Review path
1. file:L10-L80 — start here: defines the new endpoint contract
2. file:L200-L240 — core handler, where validation moved
3. ...

## Flags (only if real)
- Unresolved discussion thread on <file:line>
- Diff is 2k LOC — reviewer should timebox
- Test file touches no new assertion for <behavior>
```

Omit any section that would be empty. Do not pad.

## Output Budget

| Section | Limit |
|---|---|
| What changed | 5 bullets |
| Why | 2 sentences |
| Skip or skim | no limit, but 1 line each |
| Review path | 10 entries max, 1 line each |
| Flags | only concrete items, no speculation |

If you cannot fit a finding in the budget, it probably belongs in the reviewer's own notes, not yours.

## Red Flags

| Thought | Reality |
|---|---|
| "I'll also suggest fixes" | That is a review. Stop. |
| "Let me summarize each file" | The diff does that. Give a path, not a catalog. |
| "I should note every small thing" | Only flag items that change review order or risk. |
| "Let me write this to a notes file" | Read-only. Output in chat only. |
| "I need to read every file fully" | Read FOCUS files in full, SKIM files only enough to classify. |
| "The PR has no description, I'll skip gathering" | Check commits and discussion — intent often lives there. |

## Handling Edge Cases

- **No PR, just a branch:** run git-only, note it in the header, use the first commit message as the "why".
- **Stacked PRs / dependent branches:** review path covers only the current PR's diff; mention the base PR once.
- **Draft PR:** still fine to orient; flag "draft — intent may shift".
- **Huge PR (>1k LOC or >30 files):** explicitly recommend the reviewer timebox and focus on the first 3 path entries; ask whether they want a narrower pass.
- **Merge commits in range:** use `git log --no-merges` and `git diff <base>...<head>` (three dots) to stay on the branch's own work.

## Example (abbreviated)

```
## What changed
- New POST /exports/csv endpoint, auth required, rate-limited per org
- Export job now runs via worker queue instead of inline
- Adds ExportJob table + migration
- Removes deprecated /download-all endpoint

## Why
Inline exports were timing out for orgs with >50k rows. Moves to async job per issue #842.

## Skip or skim
- pnpm-lock.yaml — lockfile
- src/generated/api.ts — generated SDK
- tests/fixtures/large_org.json — fixture data, shape only

## Review path
1. src/api/routes.ts:L45-L72 — new route, auth + rate-limit wiring
2. src/exports/job.ts:L1-L180 — core async job, start here for logic
3. migrations/2026_04_add_export_jobs.sql — schema, check indexes
4. src/api/routes.ts:L310-L330 — /download-all removal, check no internal callers
5. src/workers/registry.ts:L22-L35 — job registration
6. tests/exports/job.test.ts — skim: confirms retry + failure paths covered

## Flags
- Unresolved thread on src/exports/job.ts:L120 about retry backoff
- No test for rate-limit behavior on the new route
```

## The Bottom Line

Orient, don't review. Short, not thorough. Read-only, not editorial.
