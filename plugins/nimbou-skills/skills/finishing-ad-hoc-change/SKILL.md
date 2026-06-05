---
name: finishing-ad-hoc-change
description: Use when an ad-hoc change is implemented without a wave-structured plan and needs to be closed end-to-end — review, scoped tests, fix critical/important findings, commit, and report.
---

# Finishing Ad-Hoc Change

## Overview

Close an ad-hoc change end-to-end when no wave-structured plan exists: detect git state, optionally run scoped backend/frontend tests, dispatch a code review, apply Critical/Important findings in place, defer Minor findings to a follow-ups artifact, and report.

This skill is the orchestrator for "I just finished a small change, now what?". It composes existing skills — it does not replace them.

**Reviews block here.** Unlike `nimbou-skills:executing-plans`, there is no next wave to absorb deferred findings, so the review runs synchronously and Critical/Important items are applied before the skill ends.

**Announce at start:** "I'm using the finishing-ad-hoc-change skill to close this change."

## Boundary

Use this skill when:

- An ad-hoc change is implemented (bug fix, small adjustment, chat-driven tweak).
- There is **no** `docs/plans/<plan>.md` with `## Ondas de Execução` for this work.
- The change is ready to be reviewed and committed cleanly, but the closing steps were not orchestrated yet.

Do not use this skill when:

- A wave-structured plan exists → use `nimbou-skills:executing-plans`.
- The user only wants to merge / open a PR over already-reviewed work → call `nimbou-skills:finishing-a-development-branch` directly.
- Work is mid-flight and incomplete → finish the implementation first.

This skill does not replace `nimbou-skills:request-review`, `nimbou-skills:apply-review`, `nimbou-skills:nestjs-test`, or `nimbou-skills:nuxt-test` — it orchestrates them.

## Step 1 — Detect Git State

Inspect the working tree and the commit range that will be reviewed.

```bash
git status --porcelain
git diff --name-only           # unstaged
git diff --cached --name-only  # staged
git rev-parse --abbrev-ref HEAD
```

Determine the review range:

- **If there are unstaged or staged changes:** they belong to this ad-hoc work. Continue to Step 2 to commit them before reviewing.
- **If the working tree is clean:** compute the range against the base branch.
  ```bash
  BASE_BRANCH=$(git rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null \
    | sed 's|.*/||' || echo main)
  BASE_SHA=$(git merge-base HEAD "$BASE_BRANCH")
  HEAD_SHA=$(git rev-parse HEAD)
  ```
  If `BASE_SHA == HEAD_SHA` (range is empty), **stop and report**: "Nada a concluir — árvore limpa e nenhum commit acima de `$BASE_BRANCH`." Do not proceed.

Capture `BASE_SHA` and `HEAD_SHA` for later steps.

## Step 2 — Initial Commit (Conditional)

Only run this step when Step 1 detected uncommitted changes.

1. Stage explicitly the files that belong to this change:
   ```bash
   git add <path1> <path2> ...
   ```
   Never `git add -A` / `git add .` — that risks pulling in unrelated files or secrets.
2. Match the message style of recent commits:
   ```bash
   git log --oneline -5
   ```
3. Create the commit. Capture:
   ```bash
   BASE_SHA=$(git rev-parse HEAD~1)
   HEAD_SHA=$(git rev-parse HEAD)
   ```
4. If new untracked files appeared that do not belong to this change, leave them out and warn the user.

## Step 3 — Select Test Suites

Ask the user explicitly which suites to run. Do not infer from the diff.

Use `AskUserQuestion`, single-select, four options:

1. **`nestjs-test`** — backend HTTP and persistence coverage.
2. **`nuxt-test`** — frontend Playwright coverage.
3. **Ambos** — both suites.
4. **Nenhum** — skip Step 4 (acceptable for doc-only or config-only changes).

Record the choice and continue.

## Step 4 — Run Scoped Tests

Skip this step if the user picked **Nenhum** in Step 3.

For each selected suite:

1. Compute the changed surface relative to the review range:
   ```bash
   git diff --name-only "$BASE_SHA".."$HEAD_SHA"
   ```
2. Map those paths to their test files using the same convention as `nimbou-skills:finishing-a-development-branch` Step 1 (`*.spec.ts`, `*.test.ts` siblings, `test/**` mirrors, Playwright `*.spec.ts` under `e2e/` or `tests/e2e/`).
3. Dispatch the suite:
   - `nimbou-skills:nestjs-test` in **stabilize mode**, with explicit suite paths only.
   - `nimbou-skills:nuxt-test` in **stabilize mode**, with explicit spec paths only.
4. Bare `pnpm test` / `npm test` / `pytest` / `go test ./...` are forbidden here. Always pass explicit paths.
5. If any suite fails: **stop**. Report the failures and the exact suite paths. Do not proceed to Step 5 — failing tests must be resolved (or the failures explicitly acknowledged by the user) before review.

## Step 5 — Dispatch Review (Synchronous)

Use `nimbou-skills:request-review` to dispatch `nimbou-skills:code-reviewer` over `BASE_SHA..HEAD_SHA`.

Fill the placeholders defined in `request-review/code-reviewer.md`:

- `WHAT_WAS_IMPLEMENTED` — short summary derived from the diff (file list + intent in 2–3 lines).
- `PLAN_OR_REQUIREMENTS` — `"Alteração ad-hoc — sem plano formal; requisitos derivados do briefing original do usuário"` (and quote the user's original brief if available in this session).
- `BASE_SHA`, `HEAD_SHA` — from Step 1 / Step 2.
- `DESCRIPTION` — one-line summary of the change.

Run the dispatch **synchronously** (no `run_in_background`). Unlike `nimbou-skills:executing-plans`, there is no next wave to absorb advisory findings, so the controller waits for the result.

## Step 6 — Triage Findings

Process the reviewer's output by severity:

- **Critical and Important:** apply now via `nimbou-skills:apply-review` (verify against the codebase first, push back with technical reasoning when the suggestion is wrong, implement one item at a time, retest the affected paths).
- **Minor:** record in `<branch-name>.followups.md` at the repo root, using `./followups-template.md`. If the Minor list is empty, **do not create the file**.

If Critical/Important findings produced code changes:

1. Re-run the relevant scoped test paths from Step 4 (if Step 4 ran). Do not widen the scope.
2. Commit the fixes as a **separate commit** with a message that mirrors the repo's recent style — e.g. `fix: aplicar críticos/importantes do review`. Stage only the files touched by the fixes.

If the reviewer pushed back items the controller disagrees with after verification, document the pushback in the final report (Step 7) instead of silently dropping them.

## Step 7 — Wrap-Up Report

Produce a concise textual summary. **Do not** invoke `nimbou-skills:finishing-a-development-branch` automatically — that is the user's call.

Report:

- Review range: `BASE_SHA..HEAD_SHA`.
- Suites executed and result (pass/fail counts) — or "Nenhum" if skipped.
- Findings: counts of Critical / Important / Minor returned, plus how many were applied vs deferred.
- Commit list produced by this skill (initial commit when applicable, fixes commit when applicable).
- Path to `<branch-name>.followups.md` if it was created.
- Suggested next step: "Para integrar à base ou abrir PR, rode `nimbou-skills:finishing-a-development-branch`."

## Red Flags

**Never:**

- Run `pnpm test` / `npm test` / `pytest` / `go test ./...` without explicit paths.
- Stage with `git add -A` / `git add .` in Step 2.
- Apply review findings without verifying them against the codebase first (`nimbou-skills:apply-review` discipline).
- Dispatch the review in background here — there is no next wave.
- Invoke `nimbou-skills:finishing-a-development-branch` automatically at the end.
- Squash the initial commit and the fixes commit into one — they answer different review questions.

**Always:**

- Compute the review range explicitly and report it.
- Ask the user which suites to run; never infer from the diff.
- Stop on test failures before requesting review.
- Treat Critical and Important as in-skill blockers; only Minor goes to follow-ups.

## Remember

- This skill is the closing orchestrator for ad-hoc work. If a wave plan exists, use the wave-aware skills instead.
- Reviews block here. Step 5 is synchronous.
- Critical and Important are applied in-place via `apply-review`; only Minor lands in `<branch-name>.followups.md`.
- The skill ends with a textual report. The user decides whether to continue to `finishing-a-development-branch`.

## Integration

Required workflow skills:

- `nimbou-skills:request-review` — dispatched synchronously in Step 5.
- `nimbou-skills:apply-review` — applies Critical/Important findings in Step 6.

Optional, user-selected in Step 3:

- `nimbou-skills:nestjs-test` — backend stabilize-mode dispatch with scoped paths.
- `nimbou-skills:nuxt-test` — frontend stabilize-mode dispatch with scoped paths.

Pairs with:

- `nimbou-skills:finishing-a-development-branch` — manual next step the user can invoke after the wrap-up report.

Local templates:

- `./followups-template.md` — skeleton for `<branch-name>.followups.md`.

## Output Discipline

When the skill completes (or stops early), the report must include:

- Whether Step 1 found uncommitted changes or computed a clean range.
- The exact `BASE_SHA..HEAD_SHA` reviewed.
- Suite choice from Step 3 and per-suite outcome from Step 4.
- Reviewer findings by severity, what was applied, and what was deferred.
- New commits produced and the path to `<branch-name>.followups.md` if any.
