---
name: document-release
description: Use when implementation is complete and release notes, changelog, TODO, or handoff documentation need a release-quality pass before merge
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_IS_SUPERPOWERS_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/superpowers-update-check" ] &&
  [ -x "$candidate/bin/superpowers-config" ] &&
  [ -f "$candidate/VERSION" ]
}
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_SUPERPOWERS_ROOT=""
_IS_SUPERPOWERS_RUNTIME_ROOT "$_REPO_ROOT" && _SUPERPOWERS_ROOT="$_REPO_ROOT"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.superpowers/install" && _SUPERPOWERS_ROOT="$HOME/.superpowers/install"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.codex/superpowers" && _SUPERPOWERS_ROOT="$HOME/.codex/superpowers"
[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.copilot/superpowers" && _SUPERPOWERS_ROOT="$HOME/.copilot/superpowers"
_UPD=""
[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers-update-check" 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_SUPERPOWERS_ROOT" ] && _CONTRIB=$("$_SUPERPOWERS_ROOT/bin/superpowers-config" get superpowers_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `superpowers-upgrade/SKILL.md` from the same superpowers root (check the current repo when it contains the Superpowers runtime, then `$HOME/.superpowers/install`, then `$HOME/.codex/superpowers`, then `$HOME/.copilot/superpowers`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running superpowers v{to} (just updated!)" and continue.

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
See `$_SUPERPOWERS_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple Superpowers sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **superpowers itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with superpowers and it didn't work / was confusing / was annoying. Here's what happened."

**superpowers issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the Superpowers workflow.
**NOT superpowers issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to Superpowers tooling.

**To file:** write `~/.superpowers/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey superpowers team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {superpowers version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.superpowers/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.superpowers/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.superpowers/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed superpowers field report: {title}"


# Document Release

Audit and update project documentation after implementation work is complete. This skill is mostly automatic for factual corrections and conservative everywhere else.

For workflow-routed implementation work, this is the required `document-release` handoff before branch completion. Treat it as the repo-facing release-readiness pass, not as an optional polish step.

## Step 0: Detect base branch

Determine which branch this work targets:

```bash
BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo main)
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
```

Use the detected branch as "the base branch" in the steps below.

## Core rules

**Only stop for:**
- Risky narrative rewrites
- Security or architecture explanation changes
- Large removals or section reshaping
- Ambiguous `VERSION` / release-notes consistency questions
- New `TODOS.md` items that require judgment

**Never stop for:**
- Straight factual corrections from the diff
- Updating file paths, counts, commands, or skill names
- Fixing stale cross-references
- Minor discoverability improvements

## Protected-Branch Repo-Write Gate

Before editing release-facing docs or metadata on disk, run the shared repo-safety preflight for the exact release-write scope:

```bash
superpowers-repo-safety check --intent write --stage superpowers:document-release --task-id <current-release-doc-pass> --path <release-doc-path> --write-target release-doc-write
```

- If the helper returns `allowed`, continue with the doc or metadata write.
- If it returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `superpowers:using-git-worktrees` or explicit user approval for this exact release-doc scope.
- If the user explicitly approves the protected-branch release write, approve the full release-doc scope you intend to use on that branch, including the release-doc path:

```bash
superpowers-repo-safety approve --stage superpowers:document-release --task-id <current-release-doc-pass> --reason "<explicit user approval>" --path <release-doc-path> --write-target release-doc-write
superpowers-repo-safety check --intent write --stage superpowers:document-release --task-id <current-release-doc-pass> --path <release-doc-path> --write-target release-doc-write
```

- Continue only if the re-check returns `allowed`.
- If the protected-branch task scope changes, run a new `approve` plus full-scope `check` before continuing.
- This skill may edit docs or metadata, but it does not own `git commit`, `git merge`, or `git push`; leave branch-integration actions to the next workflow stage.

## Step 1: Pre-flight and diff analysis

Run repo-appropriate commands such as:

```bash
git diff "origin/$BASE_BRANCH...HEAD" --stat 2>/dev/null || git diff "$BASE_BRANCH...HEAD" --stat 2>/dev/null || git diff --stat
git log "origin/$BASE_BRANCH"..HEAD --oneline 2>/dev/null || git log "$BASE_BRANCH"..HEAD --oneline || git log --oneline -20
git diff "origin/$BASE_BRANCH...HEAD" --name-only 2>/dev/null || git diff "$BASE_BRANCH...HEAD" --name-only || git diff --name-only
find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.superpowers/*" | sort
```

Classify the diff into:
- New features or new public workflows
- Changed behavior
- Removed functionality
- Infrastructure or contributor workflow changes

## Step 2: Per-file documentation audit

Read each documentation file and cross-reference it against the diff.

**README.md**
- Feature list still accurate?
- Setup instructions still accurate?
- Examples still valid?

**ARCHITECTURE.md**
- Diagrams and system descriptions still accurate?
- Be conservative. Only update things clearly contradicted by the diff.

**CONTRIBUTING.md / install docs / workflow docs**
- Would a new contributor succeed with these instructions?
- Do commands still exist?
- Are generated-file or build instructions still correct?

**Other `.md` files**
- Identify the file's audience and purpose
- Flag contradictions against the current diff

Classify each change as:
- `Auto-update` for safe factual corrections
- `Ask user` for risky or subjective edits

## Step 3: Apply safe factual updates

Make the clear factual updates directly.

For each file changed, record a one-line summary such as:
- `README.md: added qa-only to the public skill list and updated the skill count`
- `docs/README.codex.md: documented ~/.superpowers/projects/ artifact storage`

Do not silently rewrite positioning, philosophy, or security promises.

## Step 4: Ask about risky changes

For each risky or questionable update, use one interactive user question:
- State the doc file and the decision
- Give a recommendation
- Include a skip option

Apply approved changes immediately after each answer.

## Step 5: CHANGELOG or release-notes voice polish

**CRITICAL — NEVER CLOBBER CHANGELOG ENTRIES**

This step polishes voice. It does not replace history.

If the repo keeps release history in `CHANGELOG.md`, use that file. Otherwise, use the equivalent release-notes file (for example `RELEASE-NOTES.md`) for this step.

Rules:
1. Read the full current release-history file before touching it
2. Preserve existing entries and ordering
3. Only polish wording inside the current entry when the meaning stays the same
4. If an entry appears factually wrong or incomplete, ask instead of rewriting it

If the diff does not touch the current release-history file, skip this step.

## Step 6: Cross-doc consistency and discoverability

After auditing files individually, do one discoverability pass:

1. Do README and install docs describe the same public workflows?
2. Does the latest `CHANGELOG.md` or release-notes entry align with `VERSION`, if both exist?
3. Are important docs discoverable from README or the main contributor docs?

If a doc exists but nothing links to it, flag it as a discoverability issue and make the smallest safe fix.

## Step 6.5: Release-readiness pass

Run an explicit release-readiness pass before finishing:

1. Are refreshed docs present anywhere behavior or contributor workflows changed?
2. Are release notes or equivalent release-history updates present when the diff changes user-visible or operator-visible behavior?
3. Are rollout notes documented when the change meaningfully affects release or operations?
4. Are rollback notes documented when rollback is non-trivial?
5. Are known risks or operator-facing caveats documented when they matter?
6. Are monitoring or verification expectations documented when the change introduces operational risk?

If any of these are materially missing, stop and fix them or ask the user before calling the branch ready to finish.

## Step 7: TODOS.md cleanup

If `TODOS.md` exists:
- Mark obviously completed items when the diff closes them
- Add new follow-up items only when they are concrete and justified by the diff
- Ask the user before large reorganizations or subjective reprioritization

## Output

Provide:
- Files audited
- Files changed
- Risky changes that were deferred or skipped
- Any remaining discoverability, VERSION, or TODO questions

If documentation still looks stale after the safe pass, say so explicitly.
