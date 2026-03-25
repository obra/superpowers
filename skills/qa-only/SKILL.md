---
name: qa-only
description: Use when you need browser-based QA, repro steps, screenshots, evidence, and reports, but do not want the agent to fix any code
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_IS_FEATUREFORGE_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/featureforge" ] &&
  [ -f "$candidate/VERSION" ]
}
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_ROOT=""
_IS_FEATUREFORGE_RUNTIME_ROOT "$_REPO_ROOT" && _FEATUREFORGE_ROOT="$_REPO_ROOT"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.featureforge/install" && _FEATUREFORGE_ROOT="$HOME/.featureforge/install"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.codex/featureforge" && _FEATUREFORGE_ROOT="$HOME/.codex/featureforge"
[ -z "$_FEATUREFORGE_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.copilot/featureforge" && _FEATUREFORGE_ROOT="$HOME/.copilot/featureforge"
_UPD=""
[ -n "$_FEATUREFORGE_ROOT" ] && _UPD=$("$_FEATUREFORGE_ROOT/bin/featureforge" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_ROOT" ] && _CONTRIB=$("$_FEATUREFORGE_ROOT/bin/featureforge" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `featureforge-upgrade/SKILL.md` from the same featureforge root (check the current repo when it contains the FeatureForge runtime, then `$HOME/.featureforge/install`, then `$HOME/.codex/featureforge`, then `$HOME/.copilot/featureforge`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

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


# QA-Only

Report-only browser QA for web applications. Test like a user, gather evidence, score health, and never fix anything.

## Browser prerequisite

This skill depends on browser automation support from `playwright` or `playwright-interactive`.

- Prefer `playwright` for CLI-first QA runs
- Prefer `playwright-interactive` for persistent local-app debugging when it is already enabled

If neither skill nor equivalent browser automation support is available, STOP and tell the user:

`qa-only needs browser automation support. Install or enable the playwright skill (or an equivalent Playwright CLI workflow), then retry.`

## Setup

Parse these parameters from the request:

| Parameter | Default | Example |
|-----------|---------|---------|
| Target URL | auto-detect or required | `https://app.example.com`, `http://127.0.0.1:3000` |
| Tier | Standard | `Standard`, `Exhaustive` |
| Mode | full | `--quick`, `--regression <baseline>` |
| Output dir | `.featureforge/qa-reports/` | `Output to /tmp/qa` |
| Scope | Diff or full app | `Focus on billing` |
| Auth | none | `Use staging login` |

Treat `quick` as a mode, not a tier.

Map the parsed "Output dir" to `QA_OUTPUT_DIR` when the user provided one, then create the local output directory:

```bash
REPORT_DIR="${QA_OUTPUT_DIR:-.featureforge/qa-reports}"
mkdir -p "$REPORT_DIR/screenshots"
```

## Test plan context

Before falling back to git-diff heuristics, look for richer QA input:

```bash
_SLUG_ENV=$("$_FEATUREFORGE_ROOT/bin/featureforge" repo slug 2>/dev/null || true)
if [ -n "$_SLUG_ENV" ]; then
  eval "$_SLUG_ENV"
fi
unset _SLUG_ENV
PLAN_ARTIFACT=""
for CANDIDATE in $(ls -t "$_SP_STATE_DIR/projects/$SLUG"/*-test-plan-*.md 2>/dev/null); do
  [ -f "$CANDIDATE" ] || continue
  ARTIFACT_BRANCH=$(sed -n 's/^\*\*Branch:\*\* //p' "$CANDIDATE" | head -1)
  if [ "$ARTIFACT_BRANCH" = "$BRANCH" ]; then
    PLAN_ARTIFACT="$CANDIDATE"
    break
  fi
done
[ -n "$PLAN_ARTIFACT" ] || PLAN_ARTIFACT=$(ls -t "$_SP_STATE_DIR/projects/$SLUG"/*-test-plan-*.md 2>/dev/null | head -1)
printf '%s\n' "$PLAN_ARTIFACT"
```

Prefer the newest artifact for the current branch under `$_SP_STATE_DIR/projects/$SLUG` when it exists. Only fall back to the newest project-wide test-plan artifact when there is no branch-specific match and you only need extra QA scoping context. That project-wide fallback does not satisfy branch-finish freshness checks, and it must not be treated as the structured finish-gate handoff for another branch.

Match current-branch artifacts by their `**Branch:**` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`.

When a test-plan artifact includes richer additive sections such as `## Coverage Graph`, `## E2E Test Decision Matrix`, `## Browser Matrix`, `## Non-Browser Contract Checks`, `## Regression Risks`, `## Manual QA Notes`, or `## Engineering Review Summary`, treat them as additive context only:

- use them to prioritize routes, browsers, risks, and manual checks
- do not require them for artifact validity
- finish-gate freshness still depends on the current required headers and current-branch artifact freshness
- absence of the richer sections does not invalidate the artifact

If no artifact exists, use:
1. Explicit user scope
2. Conversation context
3. `diff-aware` inference from the current branch

## Modes

### diff-aware

If no URL is provided and the repo is on a feature branch, automatically enter `diff-aware` mode:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
BASE_BRANCH=""
if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "HEAD" ]; then
  case "$CURRENT_BRANCH" in
    main|master|develop|dev|trunk)
      BASE_BRANCH="$CURRENT_BRANCH"
      ;;
  esac
  [ -n "$BASE_BRANCH" ] || BASE_BRANCH=$(git config --get "branch.$CURRENT_BRANCH.gh-merge-base" 2>/dev/null || true)
fi
[ -n "$BASE_BRANCH" ] || BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's#^refs/remotes/origin/##' || true)
if [ -z "$BASE_BRANCH" ]; then
  for candidate in main master develop dev trunk; do
    if git show-ref --verify --quiet "refs/heads/$candidate"; then
      BASE_BRANCH="$candidate"
      break
    fi
  done
fi
if [ -z "$BASE_BRANCH" ] && [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "HEAD" ]; then
  NON_CURRENT_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null | grep -vxF "$CURRENT_BRANCH" || true)
  NON_CURRENT_BRANCH_COUNT=$(printf '%s\n' "$NON_CURRENT_BRANCHES" | sed '/^$/d' | wc -l | tr -d ' ')
  if [ "$NON_CURRENT_BRANCH_COUNT" = "1" ]; then
    BASE_BRANCH=$(printf '%s\n' "$NON_CURRENT_BRANCHES" | sed '/^$/d')
  fi
fi
if [ -z "$BASE_BRANCH" ]; then
  echo "Could not determine the base branch for diff-aware QA scoping. Stop and resolve it before continuing."
  exit 1
fi
git fetch origin "$BASE_BRANCH" --quiet 2>/dev/null || true
git diff "origin/$BASE_BRANCH...HEAD" --name-only 2>/dev/null || git diff "$BASE_BRANCH...HEAD" --name-only
git log "origin/$BASE_BRANCH"..HEAD --oneline 2>/dev/null || git log "$BASE_BRANCH"..HEAD --oneline
```

Do not use PR metadata or repo default-branch APIs as a fallback; keep diff-aware scoping aligned with `document-release`, `requesting-code-review`, and `gate-finish`.

From the changed files, infer:
- affected pages and routes
- touched forms, controls, or flows
- adjacent regression surfaces worth checking

Then use the browser automation skill to:
- open the target page
- inspect interactive elements
- navigate the affected flow
- capture screenshots and console/network evidence

### full

Systematic exploration of the app or the requested surface.

### quick

Fast smoke test: landing page plus the top navigation targets.

### regression

Load a previous baseline report or saved scorecard and compare score and issue deltas.

## Workflow

### Phase 1: Initialize

1. Resolve URL or auto-detect the local app
2. Create the local report skeleton from `$_FEATUREFORGE_ROOT/qa/templates/qa-report-template.md` when available
3. Start a timer for duration tracking

### Phase 2: Orient

Use the browser automation skill to get a map of the app:
- initial page load
- interactive controls
- console or failed-request health
- framework clues

### Phase 3: Explore

For each affected page or route:
- take a screenshot
- check interactive elements
- test forms and validation
- test navigation in and out
- check loading, empty, and error states
- run a mobile pass if relevant

Use the taxonomy in `$_FEATUREFORGE_ROOT/qa/references/issue-taxonomy.md` to classify each issue.

### Phase 4: Document

Document issues immediately. Every issue needs:
- severity
- category
- URL or route
- repro steps
- evidence

### Optional ecosystem issue lookup

When a reproduced issue looks likely to be browser-version specific, framework-version specific, Playwright or tooling specific, or platform-environment specific, you may add:

`Known ecosystem issue lookup (optional)`

Rules:
- label the result as a hypothesis, not a fix
- do not block the report if search is unavailable
- preserve report-only posture

### Phase 5: Score Health

Score the run across:
- Console
- Links
- Visual
- Functional
- UX
- Performance
- Accessibility

Use the shared rubric from the current template and state the final Health Score explicitly.

### Phase 6: Write reports

Write the local report to:
- `$REPORT_DIR/qa-report-{domain}-{YYYY-MM-DD}.md`

When a current-branch test-plan artifact exists, also write a project-scoped outcome artifact:

```bash
_SLUG_ENV=$("$_FEATUREFORGE_ROOT/bin/featureforge" repo slug 2>/dev/null || true)
if [ -n "$_SLUG_ENV" ]; then
  eval "$_SLUG_ENV"
fi
unset _SLUG_ENV
USER=$(whoami)
DATETIME=$(date +%Y%m%d-%H%M%S)
mkdir -p "$_SP_STATE_DIR/projects/$SLUG"
```

Write to:
- `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-test-outcome-{datetime}.md`

For workflow-routed QA with a current-branch test-plan artifact, this project artifact is the structured finish-gate input. Copy `Source Plan` and `Source Plan Revision` from that exact artifact and point `Source Test Plan` at that exact artifact path.

If no current-branch test-plan artifact exists, do not fabricate `Source Plan`, `Source Plan Revision`, or `Source Test Plan` headers just to make the artifact look workflow-routed. In that case, keep the local `qa-report` as the authoritative ad-hoc QA output and say explicitly that no finish-gate artifact was produced.

Use this structure:

```markdown
# QA Result
**Source Plan:** `docs/featureforge/plans/...`
**Source Plan Revision:** 3
**Source Test Plan:** `~/.featureforge/projects/.../test-plan.md`
**Branch:** feature/foo
**Repo:** featureforge
**Head SHA:** abc1234
**Result:** pass
**Generated By:** featureforge:qa-only
**Generated At:** 2026-03-22T15:05:00Z

## Summary
- what was tested
- the Health Score
- critical and high issues
- deferred follow-ups
- the local `qa-report` path
```

Allowed `**Result:**` values:
- `pass`
- `fail`
- `blocked`

## Output structure

```
$REPORT_DIR/
├── qa-report-{domain}-{YYYY-MM-DD}.md
└── screenshots/
```

Regression mode compares against an existing baseline artifact. `qa-only` should not invent or overwrite one implicitly.

## Important rules

- Never fix code in this skill
- Every reported issue needs evidence
- Verify issues are reproducible before documenting them
- Redact credentials in notes and screenshots
- If the browser prerequisite is missing, fail fast with the single actionable setup message above
