---
name: project-memory
description: Use when setting up or updating repo-visible project memory under docs/project_notes, or when recording durable bugs, decisions, key facts, or issue breadcrumbs without changing FeatureForge workflow authority
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_INSTALL_ROOT="$HOME/.featureforge/install"
_FEATUREFORGE_ROOT=""
_FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge"
if [ ! -x "$_FEATUREFORGE_BIN" ] && [ -f "$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe" ]; then
  _FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe"
fi
[ -x "$_FEATUREFORGE_BIN" ] || [ -f "$_FEATUREFORGE_BIN" ] || _FEATUREFORGE_BIN=""
_FEATUREFORGE_RUNTIME_ROOT_PATH=""
if [ -n "$_FEATUREFORGE_BIN" ] && _FEATUREFORGE_RUNTIME_ROOT_PATH=$("$_FEATUREFORGE_BIN" repo runtime-root --path 2>/dev/null); then
  [ -n "$_FEATUREFORGE_RUNTIME_ROOT_PATH" ] && _FEATUREFORGE_ROOT="$_FEATUREFORGE_RUNTIME_ROOT_PATH"
fi
_UPD=""
[ -n "$_FEATUREFORGE_BIN" ] && _UPD=$("$_FEATUREFORGE_BIN" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_BIN" ] && _CONTRIB=$("$_FEATUREFORGE_BIN" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `featureforge-upgrade/SKILL.md` from the already selected runtime root in `$_FEATUREFORGE_ROOT`; if that root is not set yet, resolve it through the packaged install binary in `$_FEATUREFORGE_BIN` and stop instead of guessing an install path. Then follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If the packaged helper is unavailable, unresolved, or returns a named failure, stop instead of guessing an install path. If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

## Search Before Building

Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers.
If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge.
If safe sanitization is not possible, skip external search.
See `$_FEATUREFORGE_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple FeatureForge sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **featureforge itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with featureforge and it didn't work / was confusing / was annoying. Here's what happened."

**featureforge issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the FeatureForge workflow.
**NOT featureforge issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to FeatureForge tooling.

**To file:** write `~/.featureforge/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey featureforge team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {featureforge version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.featureforge/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.featureforge/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.featureforge/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed featureforge field report: {title}"


# Project Memory

Create or maintain supportive project memory under `docs/project_notes/` without turning it into a second workflow system.

Use upstream ProjectMemory as source material only. In FeatureForge, project memory is narrowed to repo-visible markdown, stable reject vocabulary, and strict authority boundaries.

## What This Skill Owns

- set up or repair `docs/project_notes/README.md`, `bugs.md`, `decisions.md`, `key_facts.md`, and `issues.md`
- distill durable memory from approved specs, approved plans, execution evidence, review artifacts, or stable repo docs
- keep entries concise, dated when useful, and linked back to authoritative sources

## Hard Boundaries

- Treat `docs/project_notes/*` as supportive context only; approved specs, plans, execution evidence, review artifacts, runtime state, and active instructions remain authoritative.
- Never store secrets, tokens, passwords, private keys, or credential-shaped values in project memory.
- Default write set is limited to `docs/project_notes/*` and the narrow project-memory section this repo owns in `AGENTS.md`.
- Do not turn `issues.md` into a live tracker, daily status log, or execution checklist.
- If existing memory content is partially valid, preserve the valid content and create or normalize only the missing boundary pieces unless the user explicitly asks for a rewrite.

Read `authority-boundaries.md` before broad setup or repair work.
Read `examples.md` before writing new entries.
Reuse the seed layouts in `references/` when creating missing files.

## Protected-Branch Repo-Write Gate

Before editing repo-visible memory files, run the shared repo-safety preflight for the exact paths you will touch:

```bash
featureforge repo-safety check --intent write --stage featureforge:project-memory --task-id <current-memory-update> --path <repo-relative-path> --write-target repo-file-write
```

- If the helper returns `allowed`, continue with the memory write.
- If it returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `featureforge:using-git-worktrees` or explicit user approval for this exact memory-update scope.
- If the user explicitly approves the protected-branch memory write, approve the full memory scope you intend to use on that branch, including each repo-relative path you will edit:

```bash
featureforge repo-safety approve --stage featureforge:project-memory --task-id <current-memory-update> --reason "<explicit user approval>" --path <repo-relative-path> --write-target repo-file-write
featureforge repo-safety check --intent write --stage featureforge:project-memory --task-id <current-memory-update> --path <repo-relative-path> --write-target repo-file-write
```

- Continue only if the re-check returns `allowed`.
- If the protected-branch task scope changes, run a new `approve` plus full-scope `check` before continuing.

## Update Flow

1. Read `docs/project_notes/README.md` if it exists. If it does not exist, treat setup as boundary creation first.
2. Identify the authoritative source for the memory you want to add or repair.
3. Distill only the durable takeaway. Prefer short bullets plus backlinks over copied prose.
4. Apply the reject vocabulary from `authority-boundaries.md` when content drifts:
   - `SecretLikeContent`
   - `AuthorityConflict`
   - `TrackerDrift`
   - `MissingProvenance`
   - `OversizedDuplication`
   - `InstructionAuthorityDrift`
5. Keep file-specific maintenance rules:
   - `bugs.md`: recurring failures and expensive fixes only
   - `decisions.md`: compact decision index with backlinks
   - `key_facts.md`: non-sensitive facts with `Last Verified` or source
   - `issues.md`: breadcrumb log, not active task management

## When To Stop

- The user is really asking to change workflow truth, not supportive memory
- The only available source is unverified or conflicts with approved artifacts
- The requested content would broaden writes outside the default memory surface
- The material is secret-like, authority-blurring, or instruction-like

In those cases, refuse the memory update, explain the reject class, and redirect to the authoritative surface that should be edited instead.
