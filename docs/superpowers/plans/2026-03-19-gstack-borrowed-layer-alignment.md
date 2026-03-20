# Gstack Borrowed Layer Alignment Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 2
**Execution Mode:** superpowers:subagent-driven-development
**Source Spec:** `docs/superpowers/specs/2026-03-18-gstack-borrowed-layer-alignment-design.md`
**Source Spec Revision:** 3
**Last Reviewed By:** plan-eng-review

**Goal:** Align the borrowed-from-gstack runtime layer in Superpowers by centralizing repo/branch identity, improving shared branch grounding, broadening skill discovery safely, and modernizing update freshness without changing workflow authority.

**Architecture:** Implement the work in four coherent slices. First, centralize repo/branch identity and `_BRANCH` grounding in shared helper/generator surfaces. Second, broaden skill descriptions only in template/frontmatter plus deterministic router-safety tests and an agent-executed routing-eval workflow built from runner/judge instructions. Third, modernize `superpowers-update-check` cache freshness while preserving Superpowers-specific semver behavior. Fourth, regenerate generated docs, update release notes, and run the full verification matrix.

**Tech Stack:** POSIX shell helpers, PowerShell wrappers, Node-based doc generation/tests, shell regression tests, Markdown eval instructions, subagent-run routing scenarios, judge subagents, Markdown skill docs

---

## What Already Exists

Historical note: this section captures the draft-time repo state before the plan was executed. For the current shipped state, use the repo contents plus `docs/superpowers/execution-evidence/2026-03-19-gstack-borrowed-layer-alignment-r2-evidence.md`.

- `scripts/gen-skill-docs.mjs` already owns the shared generated preamble for all templated skills.
- `bin/superpowers-workflow-status` already derives branch-scoped manifest paths, but it still inlines slug and safe-branch derivation.
- `skills/qa-only/SKILL.md.tmpl`, `skills/plan-eng-review/SKILL.md.tmpl`, and `skills/finishing-a-development-branch/SKILL.md.tmpl` already derive sanitized branch values inline for artifact lookup.
- `tests/codex-runtime/skill-doc-contracts.test.mjs` already enforces workflow-stage prerequisite language in critical skill descriptions.
- the current `tests/evals/using-superpowers-routing.eval.mjs` is a minimal static-text routing-eval entrypoint, but it judges prompt text rather than actual agent-run behavior and should be retired as the release gate in favor of one checked-in orchestration entrypoint that executes the repo-versioned scenario/runner/judge artifact flow
- `bin/superpowers-update-check` already does semver-aware comparison, local-ahead handling, and snooze support.
- `tests/codex-runtime/test-superpowers-update-check.sh` already covers normalized versions, local-ahead behavior, just-upgraded markers, remote failures, disabled checks, and snooze behavior.
- `tests/codex-runtime/gen-skill-docs.unit.test.mjs`, `tests/codex-runtime/test-workflow-enhancements.sh`, `tests/codex-runtime/test-workflow-sequencing.sh`, and `tests/codex-runtime/test-runtime-instructions.sh` already pin a large part of the generator/runtime contract that this change will touch.

## Planned File Structure

- Create: `bin/superpowers-slug`
  Internal Bash-first helper that prints `SLUG` and artifact-safe `BRANCH`.
- Create: `tests/codex-runtime/test-superpowers-slug.sh`
  Deterministic helper coverage for normal remotes, missing remotes, detached HEAD, and slash-heavy branch names.
- Modify: `scripts/gen-skill-docs.mjs`
  Add shared `_BRANCH` capture to the generated preamble and keep the base/review preamble builders in sync.
- Modify: `bin/superpowers-workflow-status`
  Reuse `superpowers-slug` instead of re-deriving repo/branch identity inline.
- Modify: `bin/superpowers-update-check`
  Add `--force` and split cache TTL behavior while preserving semver-aware comparison and local-ahead handling.
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
  Replace inline branch-sanitization snippets with `superpowers-slug` consumption.
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
  Broaden trigger phrases where allowed, while preserving workflow-stage prerequisite wording.
- Modify generated outputs after regeneration:
  - `skills/using-superpowers/SKILL.md`
  - `skills/brainstorming/SKILL.md`
  - `skills/systematic-debugging/SKILL.md`
  - `skills/document-release/SKILL.md`
  - `skills/qa-only/SKILL.md`
  - `skills/plan-ceo-review/SKILL.md`
  - `skills/writing-plans/SKILL.md`
  - `skills/plan-eng-review/SKILL.md`
  - `skills/executing-plans/SKILL.md`
  - `skills/subagent-driven-development/SKILL.md`
  - `skills/requesting-code-review/SKILL.md`
  - `skills/finishing-a-development-branch/SKILL.md`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-superpowers-update-check.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Create: `tests/evals/using-superpowers-routing.scenarios.md`
- Create: `tests/evals/using-superpowers-routing.orchestrator.md`
- Create: `tests/evals/using-superpowers-routing.runner.md`
- Create: `tests/evals/using-superpowers-routing.judge.md`
- Delete: `tests/evals/using-superpowers-routing.eval.mjs`
- Modify: `tests/evals/README.md`
- Modify: `RELEASE-NOTES.md`

## Not In Scope

- Adding a public PowerShell wrapper for `bin/superpowers-slug`.
- Changing workflow-helper semantics, approval headers, or execution handoff behavior.
- Importing gstack design-review, office-hours, or other newer product surfaces.
- Building a recurring upstream-sync policy beyond the already-added deferred `TODOS.md` entry.
- Replacing `compare_versions()` or the current `local_ahead` behavior in `bin/superpowers-update-check`.

## Implementation Notes

- Use `superpowers:test-driven-development` for each slice: red test first, verify failure, minimal implementation, verify pass, then commit.
- Keep `superpowers-slug` internal-first. Do not add `bin/superpowers-slug.ps1`, public docs, or user-facing compatibility promises.
- If `superpowers-slug` emits shell-assignment output for shared consumers, the helper must own shell escaping for every emitted value and tests must cover shell-significant branch names. Consumers may only `eval` the helper's full escaped assignment contract; they must not concatenate or partially construct shell around it.
- Keep the gstack-style naming split explicit: helper `BRANCH` is the sanitized artifact branch token, while generated `_BRANCH` remains the raw branch-grounding value captured in the shared preamble.
- Add deterministic branch-ownership contract coverage so helper `BRANCH` cannot silently drift into user-facing grounding and `_BRANCH` cannot silently drift into artifact-path derivation.
- Do not promote `superpowers-slug` into the broad runtime inventory contract. If `tests/codex-runtime/test-runtime-instructions.sh` is updated, keep it to a narrow existence/executable assertion for the shipped helper plus consumer-path coverage elsewhere.
- Prefer reusing the generator and existing helper surfaces over adding new abstractions. If the implementation starts growing beyond the file families listed above, stop and re-check the approved spec.
- Regenerate skill docs with `node scripts/gen-skill-docs.mjs` after every template or generator change. Do not hand-edit generated `SKILL.md` files.
- For Item 1, keep exactly one authoritative execution surface: a checked-in orchestration entrypoint that dispatches the repo-versioned scenario/runner/judge artifacts and persists the required per-scenario evidence. Do not keep `tests/evals/using-superpowers-routing.eval.mjs` as a second release gate once the new flow exists.
- Keep the required Item 1 agent-run eval as a full fixed-matrix gate in both places it appears: once in Task 2 as a slice-local proof before committing the description/routing changes, and again in Task 4 on the combined diff as the final authoritative verification pass.
- Before final review, use `superpowers:verification-before-completion` and keep the required Item 1 routing eval as a hard gate, executed through the checked-in orchestration entrypoint plus the runner/judge subagent flow rather than a JS-only judge.

## Diagrams

### Implementation Slice Order

```text
Task 1: slug helper + _BRANCH foundation
   |
   v
Task 2: description alignment + routing guardrails
   |
   v
Task 3: update-check freshness + --force
   |
   v
Task 4: release notes + full verification
```

### Shared Identity Flow After Task 1

```text
git remote + branch
   |
   +--> bin/superpowers-slug
   |      |
   |      +--> bin/superpowers-workflow-status
   |      +--> qa-only / plan-eng-review / finishing-a-development-branch artifact lookup
   |
   +--> generated shared preamble (_BRANCH)
```

## Failure Modes To Preserve

| Codepath | Failure to prevent | Guardrail |
| --- | --- | --- |
| late-stage descriptions | routing drift into later workflow stages | shared contract tests + required agent-executed routing eval |
| slug helper | inconsistent artifact paths across runtime consumers | one helper contract + deterministic helper tests |
| `_BRANCH` generation | inconsistent branch grounding across generated skills | generator unit tests + generated-doc contract tests |
| branch ownership split | helper `BRANCH` and `_BRANCH` are silently swapped | explicit branch-ownership contract coverage |
| update freshness | false upgrade state or stale “up to date” confidence | deterministic TTL tests + preserved semver logic |
| runtime docs/tests | helper/generator drift after regeneration | `node scripts/gen-skill-docs.mjs --check` + workflow/runtime tests |

## Task 1: Centralize Repo/Branch Identity And Shared `_BRANCH` Grounding

**Files:**
- Create: `bin/superpowers-slug`
- Create: `tests/codex-runtime/test-superpowers-slug.sh`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `bin/superpowers-workflow-status`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-slug.sh`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [ ] **Step 1: Add the new red helper and generator tests**
```bash
# New helper contract assertions:
# - SLUG=<repo-slug-or-fallback>
# - BRANCH=<sanitized branch or fallback>
# - missing-remote fallback matches current workflow-status semantics: repo basename + repo-root hash
# - emitted assignments stay shell-safe for spaces, quotes, dollar signs, and command-substitution-looking input
#
# Generator/contract assertions:
# - buildBaseShellLines() includes shared _BRANCH capture
# - generated skills include _BRANCH in the preamble once
# - helper BRANCH remains artifact-only while generated _BRANCH remains grounding-only
```

- [ ] **Step 2: Run the red tests and confirm the current gaps**
Run: `bash tests/codex-runtime/test-superpowers-slug.sh`
Expected: FAIL because `bin/superpowers-slug` does not exist yet.

Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL because `_BRANCH` is not yet part of the generated preamble contract and branch-ownership coverage is not yet encoded.

- [ ] **Step 3: Add the internal Bash-first helper**
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REMOTE_URL="$(git config --get remote.origin.url 2>/dev/null || true)"
RAW_BRANCH="$(git branch --show-current 2>/dev/null || true)"
[ -n "$RAW_BRANCH" ] || RAW_BRANCH="current"
[ "$RAW_BRANCH" != "HEAD" ] || RAW_BRANCH="current"
BRANCH="$(printf '%s\n' "$RAW_BRANCH" | sed 's/[^[:alnum:]._-]/-/g')"

# Derive SLUG from origin when possible, otherwise preserve the current
# workflow-status fallback semantics: repo basename + repo-root hash.
printf 'SLUG=%q\nBRANCH=%q\n' "$SLUG" "$BRANCH"
```

- [ ] **Step 4: Rewire shared consumers to use the helper and generator-owned `_BRANCH`**
```bash
# In scripts/gen-skill-docs.mjs add shared _BRANCH capture directly in the preamble:
_BRANCH=$(git branch --show-current 2>/dev/null || true)
[ -n "$_BRANCH" ] || _BRANCH="current"
[ "$_BRANCH" != "HEAD" ] || _BRANCH="current"

# In helper-consuming skills add lines similar to:
_SLUG_ENV=""
[ -n "$_SUPERPOWERS_ROOT" ] && [ -x "$_SUPERPOWERS_ROOT/bin/superpowers-slug" ] && _SLUG_ENV=$("$_SUPERPOWERS_ROOT/bin/superpowers-slug" 2>/dev/null || true)
# Only eval the helper's own fully escaped assignment contract.
[ -n "$_SLUG_ENV" ] && eval "$_SLUG_ENV"

# Contract rule to preserve in tests and usage:
# - helper BRANCH is for artifact-safe identifiers only
# - generated _BRANCH is for interactive grounding only
```

- [ ] **Step 5: Replace inline branch-sanitization fragments in templated skill consumers**
Search the three targeted templates for their current inline branch-sanitization snippets.
Expected: current per-skill sanitization logic is found before the edit.

Then change those templates to consume helper `BRANCH` from the shared helper output instead of re-deriving it locally.

- [ ] **Step 6: Regenerate generated skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated `skills/*/SKILL.md` files include `_BRANCH` in the preamble and no longer rely on duplicated branch-sanitization snippets in the targeted skills.

- [ ] **Step 7: Re-run the focused tests**
Run: `bash tests/codex-runtime/test-superpowers-slug.sh`
Expected: PASS

Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS after `_BRANCH` capture, branch-ownership contract coverage, and hostile shell fixtures are all encoded.

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with no regression in missing-remote manifest-path isolation semantics.

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS after its old inline branch-sanitization expectations are updated to the new helper contract.

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS with a narrow existence/executable assertion for `bin/superpowers-slug`, without adding it to the broad runtime inventory list.

- [ ] **Step 8: Commit the shared-identity foundation**
```bash
git add \
  bin/superpowers-slug \
  bin/superpowers-workflow-status \
  scripts/gen-skill-docs.mjs \
  skills/qa-only/SKILL.md.tmpl \
  skills/plan-eng-review/SKILL.md.tmpl \
  skills/finishing-a-development-branch/SKILL.md.tmpl \
  skills/qa-only/SKILL.md \
  skills/plan-eng-review/SKILL.md \
  skills/finishing-a-development-branch/SKILL.md \
  tests/codex-runtime/test-superpowers-slug.sh \
  tests/codex-runtime/gen-skill-docs.unit.test.mjs \
  tests/codex-runtime/skill-doc-contracts.test.mjs \
  tests/codex-runtime/test-workflow-enhancements.sh \
  tests/codex-runtime/test-runtime-instructions.sh
git commit -m "refactor: centralize slug and branch grounding"
```

## Task 2: Broaden Skill Discovery Without Weakening Workflow Routing

**Files:**
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify regenerated outputs under the same skill directories
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Create: `tests/evals/using-superpowers-routing.scenarios.md`
- Create: `tests/evals/using-superpowers-routing.orchestrator.md`
- Create: `tests/evals/using-superpowers-routing.runner.md`
- Create: `tests/evals/using-superpowers-routing.judge.md`
- Delete: `tests/evals/using-superpowers-routing.eval.mjs`
- Modify: `tests/evals/README.md`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: agent-executed routing evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set

- [x] **Step 1: Add the red contract checks for allowed and forbidden description broadening**
```js
const forbiddenLateStagePhrases = [
  /implement this/i,
  /start coding/i,
  /build this/i,
  /plan this feature/i,
];
```

- [x] **Step 2: Define the routing scenario set and judge rubric before changing any descriptions**
```text
- "review the architecture" while helper state is still pre-spec
- "write the plan" while spec is still draft
- "start implementing" while plan is still draft
- "finish this branch" before completion prerequisites are satisfied

Positive-control floor for the same fixed minimum matrix:
- at least one later-stage-valid scenario for each affected late-stage skill family touched by the broadened descriptions
- plan-authoring/review family: a fixture where a later planning/review route is actually valid
- execution family: a fixture where execution is actually valid
- completion/review family: a fixture where completion or final review is actually valid
```

Capture those scenarios in `tests/evals/using-superpowers-routing.scenarios.md`, with a paired runner instruction file and judge instruction file so the eval runs in real agent context instead of as a JS-only prompt payload.
Add `tests/evals/using-superpowers-routing.orchestrator.md` as the single checked-in execution entrypoint that tells the controller how to dispatch the runner and judge against those repo-versioned artifacts and where to persist per-scenario evidence.
Update `tests/evals/README.md` in the same slice so the documented authoritative execution surface for Item 1 matches the checked-in orchestration entrypoint and no longer presents the deleted JS-only gate as the routing-eval truth.

- [x] **Step 3: Run the red routing-safety tests**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL once the new forbidden-phrase and prerequisite assertions are added but the current descriptions remain unchanged.

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL if helper-first wording and handoff text are not yet strong enough for the broadened description contract.

- [x] **Step 4: Rewrite descriptions in templates by class, not ad hoc**
```yaml
# Safe broadening example:
description: Use when asked to review an implementation plan that already exists and should be approved before execution

# Unsafe broadening to avoid:
description: Use when asked to build or implement something
```

- [x] **Step 5: Regenerate the skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: targeted generated `SKILL.md` files reflect the broadened phrasing while preserving prerequisite wording for stage-gated and execution-stage skills.

- [x] **Step 6: Run deterministic routing-safety tests**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

- [x] **Step 7: Run the required focused routing eval for Item 1**
Run the checked-in orchestration flow defined in `tests/evals/using-superpowers-routing.orchestrator.md`.
Expected behavior of that single authoritative gate:
- dispatch a runner subagent using `tests/evals/using-superpowers-routing.runner.md`
- execute the scenarios from `tests/evals/using-superpowers-routing.scenarios.md`
- capture per-scenario runner output/transcript and structured outcome blocks
- dispatch a judge subagent using `tests/evals/using-superpowers-routing.judge.md`
- persist per-scenario evidence bundles with scenario identifiers plus scenario/rubric artifact revision or fingerprint
- pass only if the judge finds that later-sounding prompts still route to the earlier safe stage when helper state demands it, without failing the positive-control scenarios
- run the full fixed minimum matrix here as the slice-local pre-commit gate for the Task 2 diff, not a reduced smoke subset

- [x] **Step 8: Commit the description-alignment slice**
```bash
git add \
  skills/using-superpowers/SKILL.md.tmpl \
  skills/brainstorming/SKILL.md.tmpl \
  skills/systematic-debugging/SKILL.md.tmpl \
  skills/document-release/SKILL.md.tmpl \
  skills/qa-only/SKILL.md.tmpl \
  skills/plan-ceo-review/SKILL.md.tmpl \
  skills/writing-plans/SKILL.md.tmpl \
  skills/plan-eng-review/SKILL.md.tmpl \
  skills/executing-plans/SKILL.md.tmpl \
  skills/subagent-driven-development/SKILL.md.tmpl \
  skills/requesting-code-review/SKILL.md.tmpl \
  skills/finishing-a-development-branch/SKILL.md.tmpl \
  skills/using-superpowers/SKILL.md \
  skills/brainstorming/SKILL.md \
  skills/systematic-debugging/SKILL.md \
  skills/document-release/SKILL.md \
  skills/qa-only/SKILL.md \
  skills/plan-ceo-review/SKILL.md \
  skills/writing-plans/SKILL.md \
  skills/plan-eng-review/SKILL.md \
  skills/executing-plans/SKILL.md \
  skills/subagent-driven-development/SKILL.md \
  skills/requesting-code-review/SKILL.md \
  skills/finishing-a-development-branch/SKILL.md \
  tests/codex-runtime/skill-doc-contracts.test.mjs \
  tests/codex-runtime/test-workflow-sequencing.sh \
  tests/evals/using-superpowers-routing.orchestrator.md \
  tests/evals/using-superpowers-routing.scenarios.md \
  tests/evals/using-superpowers-routing.runner.md \
  tests/evals/using-superpowers-routing.judge.md \
  tests/evals/README.md
git rm -f tests/evals/using-superpowers-routing.eval.mjs
git commit -m "feat: improve skill discovery without weakening routing"
```

## Task 3: Modernize Update Freshness And `--force`

**Files:**
- Modify: `bin/superpowers-update-check`
- Modify: `tests/codex-runtime/test-superpowers-update-check.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-update-check.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Add red coverage for split TTLs and forced cache busting**
```bash
# New coverage to add:
# - --force bypasses a cached UP_TO_DATE result
# - --force bypasses a cached UPGRADE_AVAILABLE result
# - UP_TO_DATE cache older than 60 minutes refetches
# - UPGRADE_AVAILABLE cache remains sticky within 720 minutes
```

- [x] **Step 2: Run the red update-check suite**
Run: `bash tests/codex-runtime/test-superpowers-update-check.sh`
Expected: FAIL because `bin/superpowers-update-check` does not yet support `--force` or split TTL behavior.

- [x] **Step 3: Implement `--force` and split cache freshness without changing semver truth**
```bash
FORCE=0
if [ "${1:-}" = "--force" ]; then
  FORCE=1
  shift
fi

# Keep compare_versions() and local_ahead behavior unchanged.
# Only alter cache reuse windows:
# - UP_TO_DATE => ~60 minutes
# - UPGRADE_AVAILABLE => ~720 minutes
```

- [x] **Step 4: Confirm wrapper passthrough still works for the new CLI flag**
Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS after adding an update-check wrapper assertion that `--force` is forwarded intact.

- [x] **Step 5: Re-run the focused freshness tests**
Run: `bash tests/codex-runtime/test-superpowers-update-check.sh`
Expected: PASS with coverage for `--force`, split TTLs, local-ahead, invalid version text, snooze, and remote-failure behavior.

- [x] **Step 6: Commit the freshness slice**
```bash
git add \
  bin/superpowers-update-check \
  tests/codex-runtime/test-superpowers-update-check.sh \
  tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
git commit -m "feat: refresh update-check cache behavior"
```

## Task 4: Regenerate, Document, And Run The Full Verification Matrix

**Files:**
- Modify: `RELEASE-NOTES.md`
- Modify generated outputs already touched by Tasks 1-2, if regeneration changed them again
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-slug.sh`
- Test: `bash tests/codex-runtime/test-superpowers-update-check.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: agent-executed routing evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set

- [x] **Step 1: Add release-note coverage for the shipped runtime behavior changes**
```markdown
- added internal shared slug/branch derivation via `bin/superpowers-slug`
- generated preambles now ground interactive questions with `_BRANCH`
- skill descriptions match natural-language requests better while preserving fail-closed routing
- `superpowers-update-check` now supports fresher cache reuse and `--force`
```

- [x] **Step 2: Run a final regeneration pass**
Run: `node scripts/gen-skill-docs.mjs`
Expected: no manual edits remain in generated `SKILL.md` outputs.

- [x] **Step 3: Verify generated outputs are clean**
Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

- [x] **Step 4: Run the deterministic verification matrix**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-slug.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-update-check.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS

- [x] **Step 5: Run the required Item 1 eval one last time on the combined diff**
Run the full checked-in Item 1 orchestration flow again against the merged repo-versioned minimum scenario matrix and require a passing judge verdict plus fingerprinted per-scenario evidence, even though the same full matrix already ran in Task 2.

- [x] **Step 6: Commit the final documentation and verification slice**
```bash
git add RELEASE-NOTES.md
git add skills/*/SKILL.md
git add tests/evals/using-superpowers-routing.orchestrator.md
git add tests/codex-runtime/*.sh tests/codex-runtime/*.mjs tests/evals/using-superpowers-routing.*
git commit -m "docs: record borrowed-layer alignment changes"
```

## Historical Ready-For-Review Checklist

This checklist is retained as the draft-time review gate captured before engineering approval and execution. Use the plan headers above and `docs/superpowers/execution-evidence/2026-03-19-gstack-borrowed-layer-alignment-r2-evidence.md` for the current state of this artifact, not the unchecked historical items below.

- [ ] `docs/superpowers/specs/2026-03-18-gstack-borrowed-layer-alignment-design.md` is re-approved as `CEO Approved` with `Spec Revision: 3`
- [ ] `docs/superpowers/plans/2026-03-19-gstack-borrowed-layer-alignment.md` stays `Draft` with `Plan Revision: 2` and `Execution Mode: none` until engineering review resolves
- [ ] `bin/superpowers-slug` stays Bash-first and internal-only
- [ ] branch-ownership contract coverage proves helper `BRANCH` stays artifact-only and `_BRANCH` stays grounding-only
- [ ] Item 1 deterministic tests pass
- [ ] Item 1 required agent-executed routing eval passes
- [ ] `bin/superpowers-update-check` still preserves `compare_versions()` and `local_ahead`
- [ ] generated skill docs are in sync
- [ ] `RELEASE-NOTES.md` mentions the shipped behavior
