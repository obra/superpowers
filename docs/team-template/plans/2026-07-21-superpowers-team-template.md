# Superpowers Team Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this Superpowers fork into "Superpowers Team Template" — a repo a team clones once and, via an interactive intake + generator, converts into a unified team-tailored Claude Code workflow delivered as a second plugin alongside the untouched Superpowers engine.

**Architecture:** One repo, one private marketplace, two plugins. The engine (`skills/`, `hooks/`) stays byte-for-byte upstream for clean sync. A new `team/` plugin (placeholder name `team-workflow`, renamed per team) holds intake, generated team skills, connector config, and the authoring generators. Personal skills route to `~/.claude/skills/`.

**Tech Stack:** Claude Code plugins (skills = markdown with YAML frontmatter), Bash scripts (zero-dependency; `python3` allowed for dev-time JSON validation only), Superpowers methodology.

## Global Constraints

- Engine dirs `skills/` and `hooks/` MUST stay byte-for-byte upstream — never edit them. (Clean sync.)
- Zero third-party runtime dependencies in shipped plugin content. Dev/test scripts may use `python3` (present) but NOT `jq` (absent).
- Skill files are authored with `superpowers:writing-skills`; frontmatter is exactly `name:` + `description:` between `---` fences.
- Full attribution to Superpowers (obra / Jesse Vincent, MIT) in README and `/getting-started`; `LICENSE` unmodified.
- Team plugin placeholder name is the literal token `team-workflow` everywhere, so a single rename can find/replace it.
- This project's own docs live under `docs/team-template/`; superpowers' `docs/superpowers/` is removed.
- Tests live under `tests/team-template/` as plain bash (zero-dep). Run with `bash tests/team-template/<name>.sh`.
- Commit after each task with a `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

## File Structure

**Created:**
- `README.md` (rewritten), `CLAUDE.md` (rewritten)
- `scripts/sync-engine.sh`
- `tests/team-template/assert.sh` (tiny zero-dep assert helper)
- `tests/team-template/test-house-cleaning.sh`, `test-manifests.sh`, `test-sync-engine.sh`, `test-rename-plugin.sh`
- `team/.claude-plugin/plugin.json`
- `team/CLAUDE.md` (placeholder conventions), `team/README.md`
- `team/intake/` templates: `what-we-do.md`, `what-we-use.md`, `our-conventions.md`, `testing.md`, `connectors.md`
- `team/scripts/rename-plugin.sh`
- `team/skills/team-setup/SKILL.md`
- `team/skills/generate-workflow/SKILL.md`
- `team/skills/new-skill/SKILL.md`
- `team/skills/new-connector/SKILL.md`
- `team/skills/new-workflow/SKILL.md`
- `team/skills/getting-started/SKILL.md`
- `team/skills/.gitkeep`, `team/docs/.gitkeep`

**Modified:**
- `.claude-plugin/marketplace.json` (add second plugin entry)

**Removed (Task 1):** `docs/superpowers/`, `CODE_OF_CONDUCT.md`, `RELEASE-NOTES.md`, `.github/FUNDING.yml`, `.pi/`, `.opencode/`, `.cursor-plugin/`, `.kimi-plugin/`, `.codex-plugin/`, `GEMINI.md`, `AGENTS.md`, `gemini-extension.json`.

**Never touched:** `skills/`, `hooks/`, `LICENSE`.

---

## Task 1: House-cleaning

**Files:**
- Remove: `docs/superpowers/`, `CODE_OF_CONDUCT.md`, `RELEASE-NOTES.md`, `.github/FUNDING.yml`, `.pi/`, `.opencode/`, `.cursor-plugin/`, `.kimi-plugin/`, `.codex-plugin/`, `GEMINI.md`, `AGENTS.md`, `gemini-extension.json`
- Create: `tests/team-template/assert.sh`, `tests/team-template/test-house-cleaning.sh`

**Interfaces:**
- Produces: `tests/team-template/assert.sh` exposing shell functions `assert_absent <path>`, `assert_present <path>`, `assert_contains <file> <substring>`, `pass`/`fail` counters, and `finish` (exits nonzero if any failed). Every later test sources this.

- [ ] **Step 1: Write the assert helper**

Create `tests/team-template/assert.sh`:
```bash
#!/usr/bin/env bash
# Zero-dependency test assertions for team-template. Source this in tests.
FAILED=0
assert_present()  { [ -e "$1" ] && echo "ok: present $1" || { echo "FAIL: missing $1"; FAILED=1; }; }
assert_absent()   { [ ! -e "$1" ] && echo "ok: absent $1" || { echo "FAIL: still present $1"; FAILED=1; }; }
assert_contains() { grep -qF -- "$2" "$1" && echo "ok: '$2' in $1" || { echo "FAIL: '$2' not in $1"; FAILED=1; }; }
assert_json_valid(){ python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$1" && echo "ok: json $1" || { echo "FAIL: bad json $1"; FAILED=1; }; }
finish() { [ "$FAILED" -eq 0 ] && { echo "ALL PASS"; exit 0; } || { echo "FAILURES"; exit 1; }; }
```

- [ ] **Step 2: Write the failing test**

Create `tests/team-template/test-house-cleaning.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
for p in docs/superpowers CODE_OF_CONDUCT.md RELEASE-NOTES.md .github/FUNDING.yml \
         .pi .opencode .cursor-plugin .kimi-plugin .codex-plugin \
         GEMINI.md AGENTS.md gemini-extension.json; do
  assert_absent "$p"
done
# Engine + license must survive.
assert_present skills/using-superpowers/SKILL.md
assert_present hooks/session-start
assert_present LICENSE
finish
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bash tests/team-template/test-house-cleaning.sh`
Expected: FAIL lines (files still present).

- [ ] **Step 4: Remove the files**

```bash
git rm -r docs/superpowers CODE_OF_CONDUCT.md RELEASE-NOTES.md .github/FUNDING.yml \
  .pi .opencode .cursor-plugin .kimi-plugin .codex-plugin GEMINI.md AGENTS.md gemini-extension.json
```
(If any path is absent in this fork, drop it from the command — verify with `ls` first.)

- [ ] **Step 5: Run test to verify it passes**

Run: `bash tests/team-template/test-house-cleaning.sh`
Expected: `ALL PASS`.

- [ ] **Step 6: Commit**

```bash
git add tests/team-template/
git commit -m "Remove superpowers project-meta and non-Claude-Code harness plumbing

Keep engine (skills/, hooks/) and LICENSE pristine.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Rewrite top-level README

**Files:**
- Modify (overwrite): `README.md`
- Test: `tests/team-template/test-manifests.sh` (created here, extended in Task 4)

**Interfaces:**
- Consumes: nothing.
- Produces: a README whose install section names both plugins and the `marketplace add` flow that Task 4 finalizes.

- [ ] **Step 1: Write the failing test**

Create `tests/team-template/test-manifests.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
# README attribution + purpose + install
assert_contains README.md "Superpowers Team Template"
assert_contains README.md "github.com/obra/superpowers"
assert_contains README.md "MIT"
assert_contains README.md "/plugin marketplace add"
assert_contains README.md "team-workflow"
finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-manifests.sh`
Expected: FAIL (old superpowers README lacks these).

- [ ] **Step 3: Write the README**

Overwrite `README.md` with this structure (fill prose with `elements-of-style` clarity; the exact required tokens are shown):
```markdown
# Superpowers Team Template

Onboard your whole team to Claude Code — working the same way — in an afternoon.

> **Built on [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent — MIT.**
> This repo is a team-onboarding template layered on top. All of the workflow
> methodology (brainstorming, planning, TDD, subagent-driven development, review)
> is Superpowers' work. Go star the original.

## What this is

A repo your team clones once. A leader runs an interactive setup that interviews
them about how the team works, then generates a unified, team-tailored Claude Code
workflow every member shares. New members learn by using guided tools, not courses.

It ships as **two plugins in one private marketplace**:
- `superpowers` — the engine, kept byte-for-byte upstream.
- `team-workflow` (renamed to your team) — your intake, generated skills, connectors.

## Quickstart (team leader)

1. Fork this repo privately and clone it.
2. Open it in Claude Code and run `/team-setup` — answer the interview.
3. Run the workflow generator — review and approve the proposed workflow.
4. Commit and push.

## Quickstart (team member)

​```
/plugin marketplace add <your-team-repo-url>
/plugin install superpowers@<your-marketplace>
/plugin install <your-team-name>@<your-marketplace>
​```
Then run `/getting-started`.

## Keeping the engine current

Run `./scripts/sync-engine.sh <upstream-ref>` to pull new Superpowers releases into
`skills/` + `hooks/` and bump the pinned version. Nothing else is touched.

## Credit

This template stands entirely on [Superpowers](https://github.com/obra/superpowers).
See `LICENSE` (MIT, Jesse Vincent).
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/team-template/test-manifests.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/team-template/test-manifests.sh
git commit -m "Rewrite README: team-template purpose + full Superpowers credit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Rewrite top-level CLAUDE.md (team-facing)

**Files:**
- Modify (overwrite): `CLAUDE.md`
- Test: extend `tests/team-template/test-manifests.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: a CLAUDE.md that orients an agent working *in this template repo* (not superpowers' PR-contributor guide).

- [ ] **Step 1: Add failing assertions**

Append to `tests/team-template/test-manifests.sh` before `finish`:
```bash
assert_contains CLAUDE.md "Superpowers Team Template"
assert_contains CLAUDE.md "skills/ and hooks/ are the upstream engine"
assert_absent_string() { grep -qF -- "$2" "$1" && { echo "FAIL: '$2' should be gone from $1"; FAILED=1; } || echo "ok: '$2' absent from $1"; }
assert_absent_string CLAUDE.md "94% PR rejection"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-manifests.sh`
Expected: FAIL (old contributor CLAUDE.md still present).

- [ ] **Step 3: Write CLAUDE.md**

Overwrite `CLAUDE.md`:
```markdown
# Superpowers Team Template — Working in this repo

This repo is a team-onboarding template built on Superpowers (obra/Jesse Vincent, MIT).

## Ground rules for agents

- `skills/` and `hooks/` are the upstream engine. NEVER edit them — they are synced
  from https://github.com/obra/superpowers via `scripts/sync-engine.sh`. Editing them
  breaks clean sync.
- All team-specific work lives under `team/`. Personal skills go to `~/.claude/skills/`.
- Author skills with the `superpowers:writing-skills` skill. Author plans/specs under
  `docs/team-template/`.
- Keep shipped plugin content zero-dependency. Dev scripts may use `python3`, not `jq`.
- Preserve attribution to Superpowers everywhere.

## Layout

- `skills/`, `hooks/` — engine (do not touch)
- `team/` — the team plugin: `intake/`, `skills/`, `docs/`, `generators/`, `CLAUDE.md`
- `scripts/sync-engine.sh` — pull upstream engine + bump version
- `docs/team-template/` — this project's specs and plans
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/team-template/test-manifests.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md tests/team-template/test-manifests.sh
git commit -m "Rewrite CLAUDE.md for team-template agents; drop contributor guide

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Two-plugin marketplace + team plugin manifest + skeleton

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Create: `team/.claude-plugin/plugin.json`, `team/skills/.gitkeep`, `team/docs/.gitkeep`, `team/README.md`, `team/CLAUDE.md`
- Test: extend `tests/team-template/test-manifests.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: marketplace listing two plugins whose `source` values are `"./"` (engine) and `"./team"` (team). Team plugin `name` is the token `team-workflow`.

- [ ] **Step 1: Add failing assertions**

Append to `tests/team-template/test-manifests.sh` before `finish`:
```bash
assert_json_valid .claude-plugin/marketplace.json
assert_json_valid team/.claude-plugin/plugin.json
assert_contains .claude-plugin/marketplace.json "./team"
assert_contains team/.claude-plugin/plugin.json "team-workflow"
python3 - <<'PY'
import json
m=json.load(open(".claude-plugin/marketplace.json"))
names={p["name"] for p in m["plugins"]}
srcs={p["source"] for p in m["plugins"]}
assert "superpowers" in names and "team-workflow" in names, names
assert "./" in srcs and "./team" in srcs, srcs
print("ok: marketplace has both plugins with correct sources")
PY
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-manifests.sh`
Expected: FAIL (only one plugin; `team/` manifest missing).

- [ ] **Step 3: Add the team plugin to marketplace.json**

Edit `.claude-plugin/marketplace.json` — add a second object to `plugins` (keep the existing superpowers entry):
```json
    {
      "name": "team-workflow",
      "description": "Your team's Claude Code workflow: intake-generated skills, connectors, and conventions layered on Superpowers.",
      "version": "0.1.0",
      "source": "./team",
      "author": { "name": "Your Team" }
    }
```

- [ ] **Step 4: Create the team plugin manifest**

Create `team/.claude-plugin/plugin.json`:
```json
{
  "name": "team-workflow",
  "description": "Your team's Claude Code workflow: intake-generated skills, connectors, and conventions layered on Superpowers.",
  "version": "0.1.0",
  "keywords": ["team", "workflow", "onboarding", "superpowers"]
}
```

- [ ] **Step 5: Create skeleton files**

```bash
mkdir -p team/skills team/docs
printf '# Team skills\nGenerated + hand-written skills live here. Create them with /new-skill.\n' > team/skills/.gitkeep
printf '# Team docs\nCommitted internal documentation (a connector target).\n' > team/docs/.gitkeep
```
Create `team/README.md`:
```markdown
# team-workflow (rename me)

This is your team's plugin. Run `/team-setup` to name it and fill in the intake,
then run the workflow generator. See the repo root README for the full flow.
```
Create `team/CLAUDE.md`:
```markdown
# Team conventions (placeholder)

This file is generated/expanded by `/team-setup` and the workflow generator from
`team/intake/`. Until then it is a placeholder. Do not hand-edit conventions you
expect the generator to own; add durable notes below the generated section.
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bash tests/team-template/test-manifests.sh`
Expected: `ALL PASS`.

- [ ] **Step 7: Commit**

```bash
git add .claude-plugin/marketplace.json team/ tests/team-template/test-manifests.sh
git commit -m "Add team-workflow as a second plugin in the marketplace + skeleton

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Engine sync script

**Files:**
- Create: `scripts/sync-engine.sh`, `tests/team-template/test-sync-engine.sh`

**Interfaces:**
- Produces: `scripts/sync-engine.sh <upstream-ref>` that fetches `upstream`, checks out only `skills` + `hooks` at `<upstream-ref>`, bumps the `superpowers` version in `marketplace.json`, and stages a commit. Exposes a `--dry-run` flag that prints the actions without mutating git.

- [ ] **Step 1: Write the failing test**

Create `tests/team-template/test-sync-engine.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
assert_present scripts/sync-engine.sh
[ -x scripts/sync-engine.sh ] && echo "ok: executable" || { echo "FAIL: not executable"; FAILED=1; }
# Dry-run must not error and must mention the two engine dirs and refuse a missing ref.
out=$(scripts/sync-engine.sh --dry-run v6.1.1 2>&1)
echo "$out" | grep -q "skills hooks" && echo "ok: targets skills hooks" || { echo "FAIL: dry-run missing target"; FAILED=1; }
scripts/sync-engine.sh 2>&1 | grep -qi "usage" && echo "ok: usage on no arg" || { echo "FAIL: no usage guard"; FAILED=1; }
finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-sync-engine.sh`
Expected: FAIL (script missing).

- [ ] **Step 3: Write the script**

Create `scripts/sync-engine.sh`:
```bash
#!/usr/bin/env bash
# Sync the Superpowers engine (skills/, hooks/) from upstream and pin its version.
# Usage: scripts/sync-engine.sh [--dry-run] <upstream-ref>
set -euo pipefail
DRY=0
[ "${1:-}" = "--dry-run" ] && { DRY=1; shift; }
REF="${1:-}"
if [ -z "$REF" ]; then
  echo "usage: scripts/sync-engine.sh [--dry-run] <upstream-ref>   e.g. v6.2.0" >&2
  exit 2
fi
echo "Will checkout 'skills hooks' from upstream/$REF and bump the superpowers version."
if [ "$DRY" -eq 1 ]; then echo "(dry-run) no changes made"; exit 0; fi
git remote get-url upstream >/dev/null 2>&1 || \
  git remote add upstream https://github.com/obra/superpowers.git
git fetch upstream --tags
git checkout "$REF" -- skills hooks
# Bump the superpowers entry version in marketplace.json to match the ref (strip leading v).
VER="${REF#v}"
python3 - "$VER" <<'PY'
import json,sys
ver=sys.argv[1]
p=".claude-plugin/marketplace.json"
m=json.load(open(p))
for plug in m["plugins"]:
    if plug["name"]=="superpowers":
        plug["version"]=ver
json.dump(m,open(p,"w"),indent=2); open(p,"a").write("\n")
print("bumped superpowers ->",ver)
PY
git add skills hooks .claude-plugin/marketplace.json
echo "Staged engine sync to $REF. Review with 'git diff --cached' then commit."
```
Make executable: `chmod +x scripts/sync-engine.sh`

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/team-template/test-sync-engine.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-engine.sh tests/team-template/test-sync-engine.sh
git commit -m "Add scoped engine-sync script (skills+hooks only) with dry-run + test

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Plugin rename utility

**Files:**
- Create: `team/scripts/rename-plugin.sh`, `tests/team-template/test-rename-plugin.sh`

**Interfaces:**
- Consumes: the `team-workflow` token placed in Task 4's manifests + `team/README.md`.
- Produces: `team/scripts/rename-plugin.sh <new-slug>` that validates the slug (`^[a-z][a-z0-9-]*$`) and replaces the `team-workflow` token in `.claude-plugin/marketplace.json`, `team/.claude-plugin/plugin.json`, and `team/README.md`. Consumed by the `/team-setup` skill (Task 8).

- [ ] **Step 1: Write the failing test**

Create `tests/team-template/test-rename-plugin.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
# Work on a throwaway copy so the repo isn't mutated.
TMP=$(mktemp -d)
cp -R team "$TMP/team"; cp -R .claude-plugin "$TMP/.claude-plugin"
( cd "$TMP" && bash "$OLDPWD/team/scripts/rename-plugin.sh" acme-workflow )
assert_contains "$TMP/team/.claude-plugin/plugin.json" "acme-workflow"
assert_contains "$TMP/.claude-plugin/marketplace.json" "acme-workflow"
grep -qF "team-workflow" "$TMP/team/.claude-plugin/plugin.json" && { echo "FAIL: placeholder left"; FAILED=1; } || echo "ok: placeholder replaced"
# Reject bad slug.
bash team/scripts/rename-plugin.sh "Bad Name" >/dev/null 2>&1 && { echo "FAIL: accepted bad slug"; FAILED=1; } || echo "ok: rejects bad slug"
rm -rf "$TMP"
finish
```
Note: the rename script must operate on the current working directory's files so the test's copy is what gets edited.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-rename-plugin.sh`
Expected: FAIL (script missing).

- [ ] **Step 3: Write the script**

Create `team/scripts/rename-plugin.sh`:
```bash
#!/usr/bin/env bash
# Rename the team plugin from the placeholder 'team-workflow' to <new-slug>.
# Operates on files relative to the current working directory.
set -euo pipefail
NEW="${1:-}"
case "$NEW" in
  ''|*[!a-z0-9-]*|[!a-z]*) echo "invalid slug '$NEW' (use lowercase, digits, hyphens; start with a letter)" >&2; exit 2;;
esac
for f in team/.claude-plugin/plugin.json .claude-plugin/marketplace.json team/README.md; do
  [ -f "$f" ] || continue
  tmp="$f.tmp.$$"
  sed "s/team-workflow/$NEW/g" "$f" > "$tmp" && mv "$tmp" "$f"
  echo "renamed in $f"
done
echo "Team plugin is now '$NEW'."
```
Make executable: `chmod +x team/scripts/rename-plugin.sh`

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/team-template/test-rename-plugin.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add team/scripts/rename-plugin.sh tests/team-template/test-rename-plugin.sh
git commit -m "Add plugin rename utility (placeholder -> team slug) with test

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Intake templates (schema)

**Files:**
- Create: `team/intake/what-we-do.md`, `what-we-use.md`, `our-conventions.md`, `testing.md`, `connectors.md`
- Test: `tests/team-template/test-intake.sh`

**Interfaces:**
- Produces: five markdown templates with fixed top-level headings that `/team-setup` (Task 8) fills and the generator (Task 9) reads. Heading contract (exact `##` headings) is the interface between setup and generator.

- [ ] **Step 1: Write the failing test**

Create `tests/team-template/test-intake.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
for f in what-we-do what-we-use our-conventions testing connectors; do
  assert_present "team/intake/$f.md"
done
assert_contains team/intake/what-we-do.md "## What we build"
assert_contains team/intake/what-we-use.md "## Tools and services"
assert_contains team/intake/our-conventions.md "## Code style"
assert_contains team/intake/testing.md "## How we test"
assert_contains team/intake/connectors.md "## Documentation sources"
finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-intake.sh`
Expected: FAIL (files missing).

- [ ] **Step 3: Create the templates**

`team/intake/what-we-do.md`:
```markdown
# What we do
<!-- Filled by /team-setup. Plain prose is fine; keep the headings. -->
## What we build
## Our stack
## How work typically flows (idea -> shipped)
```
`team/intake/what-we-use.md`:
```markdown
# What we use
## Tools and services
## Where each tool fits in our flow
```
`team/intake/our-conventions.md`:
```markdown
# Our conventions
## Code style
## Review rules
## Glossary / terms
```
`team/intake/testing.md`:
```markdown
# Testing
## How we test
## What must be tested before merge
```
`team/intake/connectors.md`:
```markdown
# Connectors
## Documentation sources
## MCP tools / integrations
## Always-on context
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/team-template/test-intake.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add team/intake tests/team-template/test-intake.sh
git commit -m "Add intake templates (schema for /team-setup and the generator)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Skill-authoring tasks (8–13)

Tasks 8–13 create skill files. For each, the deliverable is `team/skills/<name>/SKILL.md`. Author with the **`superpowers:writing-skills`** sub-skill. Each task gives the exact frontmatter (`name`, `description`) and a concrete body spec (sections + the interview/output behavior). The "test" for a skill is twofold and both must pass:

- **Structural test** (automated): `tests/team-template/test-skills.sh` (created in Task 8, extended per task) checks the file exists, has valid frontmatter with the exact `name`, and contains the required section markers.
- **Acceptance test** (manual, recorded): run the documented prompt in a clean Claude Code session and paste the transcript into the task's PR/commit notes, confirming the skill triggers and behaves as specified.

Skills are behavior-shaping prose — do not invent pytest-style tests for them.

---

## Task 8: `/team-setup` skill

**Files:**
- Create: `team/skills/team-setup/SKILL.md`, `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: `team/scripts/rename-plugin.sh` (Task 6), `team/intake/*` templates (Task 7).
- Produces: filled `team/intake/*` files and a renamed plugin. Downstream: Task 9's generator reads the filled intake.

- [ ] **Step 1: Write the structural test**

Create `tests/team-template/test-skills.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
check_skill() { # <path> <expected-name> <marker...>
  local f="$1" name="$2"; shift 2
  assert_present "$f"
  head -1 "$f" | grep -q '^---$' && echo "ok: frontmatter fence $f" || { echo "FAIL: no frontmatter $f"; FAILED=1; }
  grep -q "^name: $name\$" "$f" && echo "ok: name $name" || { echo "FAIL: name != $name in $f"; FAILED=1; }
  grep -q '^description:' "$f" && echo "ok: has description $f" || { echo "FAIL: no description $f"; FAILED=1; }
  for m in "$@"; do assert_contains "$f" "$m"; done
}
check_skill team/skills/team-setup/SKILL.md team-setup "rename-plugin.sh" "one question at a time" "team/intake"
finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL (skill missing).

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Create `team/skills/team-setup/SKILL.md` with frontmatter:
```markdown
---
name: team-setup
description: Use when a team leader first sets up this template - interviews them about how the team works, writes the intake files, and names the team plugin. Run this before generating the workflow.
---
```
Body must specify this behavior (write it out fully, Superpowers voice):
1. **Announce** "Using team-setup to capture how your team works."
2. **Name the plugin first.** Ask for the team plugin slug; validate; run `team/scripts/rename-plugin.sh <slug>`. Confirm the new `/<slug>:` prefix.
3. **Interview, one question at a time**, walking the five intake files in order (`what-we-do`, `what-we-use`, `our-conventions`, `testing`, `connectors`). For each `##` heading in each template, ask a focused question; probe shallow answers ("you said Jira — for what, and at which step?"). Multiple-choice where possible.
4. **Write** each answer into the matching heading in `team/intake/<file>.md`, preserving the headings. Files stay plain markdown.
5. **Summarize** what was captured and tell the leader to run the workflow generator next (`/generate-workflow`).
Include a Red Flags table (e.g., "tempted to ask all questions at once" → one at a time; "leader gave a one-word answer" → probe).

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual, record transcript)**

In a clean session with the plugin installed: run `/team-setup`. Confirm it renames the plugin, asks one question at a time, and writes `team/intake/*`. Paste transcript into commit notes.

- [ ] **Step 6: Commit**

```bash
git add team/skills/team-setup tests/team-template/test-skills.sh
git commit -m "Add /team-setup: interactive intake + plugin rename

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: `/generate-workflow` skill (assembler + gap-analyzer)

**Files:**
- Create: `team/skills/generate-workflow/SKILL.md`
- Test: extend `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: filled `team/intake/*` (Task 8).
- Produces: `team/workflow.md`, expanded `team/CLAUDE.md`, connector config files, and a thin `team/skills/team-workflow-entry/SKILL.md` trigger skill. Also scaffolds gap stubs under `team/skills/`.

- [ ] **Step 1: Add structural assertion**

Append to `tests/team-template/test-skills.sh` before `finish`:
```bash
check_skill team/skills/generate-workflow/SKILL.md generate-workflow "compose and scaffold, never hallucinate" "team/workflow.md" "requesting-code-review"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL (skill missing).

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Create `team/skills/generate-workflow/SKILL.md` frontmatter:
```markdown
---
name: generate-workflow
description: Use after /team-setup to turn the team intake into a unified workflow - composes engine skills, proposes improvements for gaps, and writes the team workflow, conventions, connectors, and a trigger skill.
---
```
Body must specify:
1. **Read** all of `team/intake/*`. If any are empty/unfilled, stop and tell the leader to run `/team-setup`.
2. **Compose** `team/workflow.md`: the ordered team flow, each step mapped to an existing engine skill where one fits (name them explicitly: `brainstorming`, `writing-plans`, `test-driven-development`, `subagent-driven-development`, `requesting-code-review`, etc.). Team steps reference team skills.
3. **Gap-analyze** the described flow vs the Superpowers methodology. For each gap, PROPOSE (do not auto-write) either wiring in an existing engine skill (e.g., missing review → `requesting-code-review`) or scaffolding a thin team skill stub. Present proposals, get approval (Superpowers-style), then act. Governing rule: **compose and scaffold, never hallucinate** — never write a deep skill body the leader didn't ask for.
4. **Write** `team/CLAUDE.md` conventions/style/glossary from `our-conventions.md`.
5. **Write** connector config from `connectors.md`: doc-pointer file(s) referencing `team/docs/`, and MCP entries as documented config the leader can paste.
6. **Write** a thin trigger skill `team/skills/team-workflow-entry/SKILL.md` whose description triggers when a member starts work and points them at `team/workflow.md`.
7. **Summarize** what was written; remind that stubs need fleshing out via `/new-skill`.
Include Red Flags (e.g., "intake empty" → stop; "tempted to write a full skill for a gap" → scaffold a stub and stop).

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual, record transcript)**

With intake filled (from Task 8 acceptance), run `/generate-workflow`. Confirm it composes `team/workflow.md`, proposes gaps for approval, and writes the trigger skill + conventions. Paste transcript.

- [ ] **Step 6: Commit**

```bash
git add team/skills/generate-workflow tests/team-template/test-skills.sh
git commit -m "Add /generate-workflow: compose engine skills + propose gap fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: `/new-skill` generator (team|personal routing, teach-while-doing)

**Files:**
- Create: `team/skills/new-skill/SKILL.md`
- Test: extend `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: nothing hard; references `superpowers:writing-skills` for anatomy.
- Produces: a new `SKILL.md` in `team/skills/<name>/` (team) or `~/.claude/skills/<name>/` (personal).

- [ ] **Step 1: Add structural assertion**

Append before `finish`:
```bash
check_skill team/skills/new-skill/SKILL.md new-skill "team or personal" "~/.claude/skills" "trigger description"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL.

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Frontmatter:
```markdown
---
name: new-skill
description: Use when a team member wants to create a new skill - asks whether it is team-shared or personal, teaches skill anatomy while interviewing, and writes the SKILL.md to the right place.
---
```
Body must specify:
1. **Announce**, then ask **"team or personal?"** — team → `team/skills/<name>/SKILL.md` (committed); personal → `~/.claude/skills/<name>/SKILL.md` (that member's, global).
2. **Teach while interviewing**: explain each part as you gather it — the `name`, then the **trigger description** ("this sentence decides when Claude reaches for the skill — describe the situations that should trigger yours"), then the body/steps, then Red Flags. Reference `superpowers:writing-skills` as the authority.
3. **Write** the file with valid frontmatter and the gathered body.
4. **Confirm** the resulting slash command (`/<team>:<name>` or `/<name>`) and that it will auto-trigger.
Include Red Flags (e.g., "wrote a vague description" → descriptions are triggers, be concrete).

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual)**

Run `/new-skill`, choose personal, create a trivial skill; confirm it lands in `~/.claude/skills/`. Repeat team → `team/skills/`. Paste transcript.

- [ ] **Step 6: Commit**

```bash
git add team/skills/new-skill tests/team-template/test-skills.sh
git commit -m "Add /new-skill: team|personal routing, teaches anatomy while building

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: `/new-connector` generator

**Files:**
- Create: `team/skills/new-connector/SKILL.md`
- Test: extend `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: `team/docs/`, `team/intake/connectors.md`.
- Produces: a doc-pointer skill/file, an MCP config snippet, or a conventions entry — depending on the chosen kind.

- [ ] **Step 1: Add structural assertion**

Append before `finish`:
```bash
check_skill team/skills/new-connector/SKILL.md new-connector "doc, MCP tool, or convention" "team/docs" "MCP"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL.

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Frontmatter:
```markdown
---
name: new-connector
description: Use when a team member wants to connect something to the workflow - internal documentation, an MCP tool, or a team convention - and wires the right kind while explaining it.
---
```
Body must specify the branch on **"doc, MCP tool, or convention?"**:
- **doc** → either drop markdown into `team/docs/` and create a small pointer skill referencing it, or, for external sources, record where it lives; explain grounding.
- **MCP tool** → produce a ready-to-paste MCP server config snippet + a one-line note on when Claude should use it; explain that MCP gives Claude actions in real systems.
- **convention** → append to `team/CLAUDE.md` (always-on) or create a broadly-triggering conventions skill; explain always-on context vs on-demand skills.
Explain each kind as it goes (teach-while-doing). Include Red Flags.

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual)**

Run `/new-connector`, exercise each of the three branches once. Paste transcript.

- [ ] **Step 6: Commit**

```bash
git add team/skills/new-connector tests/team-template/test-skills.sh
git commit -m "Add /new-connector: doc | MCP | convention, teach-while-doing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: `/new-workflow` generator

**Files:**
- Create: `team/skills/new-workflow/SKILL.md`
- Test: extend `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: engine skills + `team/skills/*`.
- Produces: a `team/workflows/<name>.md` composition + optional thin trigger skill.

- [ ] **Step 1: Add structural assertion**

Append before `finish`:
```bash
check_skill team/skills/new-workflow/SKILL.md new-workflow "compose" "team/workflows"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL.

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Frontmatter:
```markdown
---
name: new-workflow
description: Use when a team member wants to define a new multi-step workflow - composes existing engine and team skills into an ordered flow and optionally a trigger skill.
---
```
Body must specify: interview for the goal and steps; map each step to an existing engine/team skill (reuse, don't recreate); write `team/workflows/<name>.md` as an ordered composition naming those skills; optionally write a thin trigger skill. Same governing rule: compose, don't duplicate. Include Red Flags (e.g., "about to write a new skill that duplicates brainstorming" → reference the engine skill instead).

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual)**

Run `/new-workflow`, create a 3-step flow; confirm `team/workflows/<name>.md` names real skills. Paste transcript.

- [ ] **Step 6: Commit**

```bash
git add team/skills/new-workflow tests/team-template/test-skills.sh
git commit -m "Add /new-workflow: compose engine+team skills into an ordered flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: `/getting-started` skill (teach-only mindset)

**Files:**
- Create: `team/skills/getting-started/SKILL.md`
- Test: extend `tests/team-template/test-skills.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: no files — it teaches. Points to `team/workflow.md`, the generators, and upstream Superpowers.

- [ ] **Step 1: Add structural assertion**

Append before `finish`:
```bash
check_skill team/skills/getting-started/SKILL.md getting-started "github.com/obra/superpowers" "brainstorm" "team/workflow.md"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/team-template/test-skills.sh`
Expected: FAIL.

- [ ] **Step 3: Author the skill (use `superpowers:writing-skills`)**

Frontmatter:
```markdown
---
name: getting-started
description: Use when a new team member wants to learn how to work with Claude Code effectively on this team - explains the mindset, when to brainstorm vs plan, why skills exist, and points to the team workflow.
---
```
Body must specify (teach-only, no artifacts): the mental model of working with an agent; when to brainstorm vs plan vs implement; why skills exist and how they auto-trigger; how to invoke team vs personal skills; where the team's own flow lives (`team/workflow.md`); and a clear pointer crediting upstream Superpowers (`https://github.com/obra/superpowers`). Keep it short and orienting.

- [ ] **Step 4: Structural test passes**

Run: `bash tests/team-template/test-skills.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Acceptance test (manual)**

Run `/getting-started` in a clean session; confirm it orients without creating files and credits Superpowers. Paste transcript.

- [ ] **Step 6: Commit**

```bash
git add team/skills/getting-started tests/team-template/test-skills.sh
git commit -m "Add /getting-started: teach-only onboarding mindset + Superpowers credit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Full-suite run + integration acceptance

**Files:**
- Create: `tests/team-template/run-all.sh`

**Interfaces:**
- Consumes: every `test-*.sh`.
- Produces: one entrypoint that runs the whole suite.

- [ ] **Step 1: Write the runner**

Create `tests/team-template/run-all.sh`:
```bash
#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
rc=0
for t in test-*.sh; do echo "== $t =="; bash "$t" || rc=1; done
[ "$rc" -eq 0 ] && echo "SUITE PASS" || echo "SUITE FAIL"
exit $rc
```

- [ ] **Step 2: Run the full suite**

Run: `bash tests/team-template/run-all.sh`
Expected: `SUITE PASS`.

- [ ] **Step 3: End-to-end acceptance (manual, record)**

In a fresh clone with both plugins installed: `/team-setup` → `/generate-workflow` → confirm `team/workflow.md` + trigger skill exist and the trigger fires on "let's build X". Then `/new-skill` (personal + team), `/new-connector`, `/new-workflow`, `/getting-started`. Paste the transcript into the final commit notes.

- [ ] **Step 4: Commit**

```bash
git add tests/team-template/run-all.sh
git commit -m "Add full test-suite runner + record end-to-end acceptance

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Two-plugin architecture → Task 4. Engine pristine → Global Constraints + Task 1 test asserts engine present. Clean sync → Task 5. ✓
- Interactive intake (5b) → Task 8 + templates Task 7. ✓
- Assembler + gap-analyzer generator (6b) → Task 9. ✓
- Teach-while-doing generators + getting-started (7b) → Tasks 10–13. ✓
- Personal→`~/.claude/skills`, team→`team/skills` (4a) → Task 10. ✓
- One marketplace, team-pinned engine (8a) → Task 4 marketplace + Task 5 version bump; README install → Task 2. ✓
- House-cleaning (9b) → Task 1; README/CLAUDE rewrite → Tasks 2–3. ✓
- Naming (11) → placeholder token Task 4, rename Task 6, README title Task 2. ✓
- Attribution → Tasks 2, 3, 13 assert `obra/superpowers`; LICENSE untouched. ✓

**Placeholder scan:** Skill bodies are specified by behavior + exact frontmatter + acceptance test rather than final prose — intentional and marked, since authoring is delegated to `superpowers:writing-skills`; every skill has a concrete structural test and a required transcript. No "TBD/TODO" left.

**Type/name consistency:** Slash/skill names are consistent across tasks: `team-setup`, `generate-workflow`, `new-skill`, `new-connector`, `new-workflow`, `getting-started`; trigger skill `team-workflow-entry`; script `team/scripts/rename-plugin.sh` produced in Task 6 and consumed in Task 8; `team-workflow` placeholder token set in Task 4, renamed in Task 6; intake headings defined in Task 7 and consumed in Task 9.
</content>
