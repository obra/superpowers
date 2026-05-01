# Platform Package Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Claude Code into `claude-code/`, keep Codex under `codex/`, and rewrite install docs/prompts around platform-specific packages.

**Architecture:** The repository root becomes a marketplace and documentation entry point. Claude Code runtime assets move together under `claude-code/`; Codex runtime assets remain under `codex/`. Package-layout tests enforce both boundaries.

**Tech Stack:** Markdown docs, shell tests, JSON plugin metadata, Claude Code plugin layout, Codex plugin layout.

---

### Task 1: Add Claude Code Package Layout Test

**Files:**
- Create: `tests/claude-code/test-plugin-package.sh`
- Modify: `tests/claude-code/run-skill-tests.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/claude-code/test-plugin-package.sh` with shell assertions for the new package layout:

```bash
#!/usr/bin/env bash
# Verifies the Claude Code plugin package is isolated under claude-code/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_DIR="$REPO_ROOT/claude-code"
PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
SKILLS_DIR="$PLUGIN_DIR/skills"

fail() {
  echo "  [FAIL] $1"
  exit 1
}

pass() {
  echo "  [PASS] $1"
}

require_file() {
  [ -f "$1" ] || fail "Missing required file: $1"
  pass "found $2"
}

require_dir() {
  [ -d "$1" ] || fail "Missing required directory: $1"
  pass "found $2"
}

forbid_dir() {
  [ ! -d "$1" ] || fail "Runtime directory should not remain at repository root: $1"
  pass "root does not contain $2"
}

echo "=== Test: Claude Code Plugin Package ==="

require_file "$MARKETPLACE_JSON" "root Claude Code marketplace"
grep -Eq '"source"[[:space:]]*:[[:space:]]*"\./claude-code"' "$MARKETPLACE_JSON" \
  || fail 'Claude Code marketplace must point at "./claude-code"'
pass 'Claude Code marketplace points at ./claude-code'

require_file "$PLUGIN_JSON" "Claude Code plugin metadata"
require_dir "$SKILLS_DIR" "Claude Code skills directory"
require_file "$SKILLS_DIR/using-superpowers/SKILL.md" "using-superpowers skill"
require_file "$PLUGIN_DIR/hooks/session-start.sh" "session-start hook"
require_file "$PLUGIN_DIR/commands/brainstorm.md" "brainstorm command"
require_file "$PLUGIN_DIR/agents/audit-agent.md" "audit agent"

forbid_dir "$REPO_ROOT/skills" "skills/"
forbid_dir "$REPO_ROOT/hooks" "hooks/"
forbid_dir "$REPO_ROOT/commands" "commands/"
forbid_dir "$REPO_ROOT/agents" "agents/"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/claude-code/test-plugin-package.sh`

Expected: FAIL because `claude-code/.claude-plugin/plugin.json` and moved package directories do not exist yet.

- [ ] **Step 3: Update the Claude Code test runner**

Add `test-plugin-package.sh` to the fast `tests` array in `tests/claude-code/run-skill-tests.sh`:

```bash
tests=(
    "test-plugin-package.sh"
    "test-subagent-driven-development.sh"
)
```

- [ ] **Step 4: Run the runner to verify the package test still fails first**

Run: `bash tests/claude-code/run-skill-tests.sh --test test-plugin-package.sh`

Expected: FAIL with the same package-layout failure.

### Task 2: Move Claude Code Runtime Package

**Files:**
- Move: `.claude-plugin/plugin.json` -> `claude-code/.claude-plugin/plugin.json`
- Move: `skills/` -> `claude-code/skills/`
- Move: `agents/` -> `claude-code/agents/`
- Move: `commands/` -> `claude-code/commands/`
- Move: `hooks/` -> `claude-code/hooks/`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Create package directory**

Run: `mkdir -p claude-code/.claude-plugin`

Expected: directory exists.

- [ ] **Step 2: Move runtime assets with git**

Run:

```bash
git mv .claude-plugin/plugin.json claude-code/.claude-plugin/plugin.json
git mv skills claude-code/skills
git mv agents claude-code/agents
git mv commands claude-code/commands
git mv hooks claude-code/hooks
```

Expected: root no longer contains `skills/`, `agents/`, `commands/`, or `hooks/`.

- [ ] **Step 3: Update marketplace source**

Change `.claude-plugin/marketplace.json` so the plugin source is:

```json
"source": "./claude-code"
```

- [ ] **Step 4: Run the Claude Code package test**

Run: `bash tests/claude-code/test-plugin-package.sh`

Expected: PASS.

### Task 3: Add Platform Installation Docs And Prompts

**Files:**
- Create: `claude-code/README.md`
- Create: `claude-code/INSTALL.md`
- Create: `docs/installation.md`
- Create: `docs/prompts.md`

- [ ] **Step 1: Add Claude Code package README**

Create `claude-code/README.md` with sections:

```markdown
# Sonbbal Superpowers for Claude Code

Claude Code package for Sonbbal Superpowers.

## What This Package Contains

- `.claude-plugin/plugin.json`
- `skills/`
- `agents/`
- `commands/`
- `hooks/`

## How This Differs From The Codex Package

Claude Code uses Claude-native skills, agents, commands, and hooks. Codex uses the separate `../codex` package with Codex-native skill instructions and plugin metadata.

## Installation

See `INSTALL.md`.

## Compatibility Tests

Run from the repository root:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-plugin-package.sh
```
```

- [ ] **Step 2: Add Claude Code install guide**

Create `claude-code/INSTALL.md` covering marketplace add, install, update, verify, migration from root package, and uninstall notes.

- [ ] **Step 3: Add combined installation reference**

Create `docs/installation.md` with platform sections for Claude Code and Codex, plus a note that historical docs can mention pre-split root paths.

- [ ] **Step 4: Add paste-ready prompts**

Create `docs/prompts.md` with two prompt blocks:

```markdown
## Claude Code Install Or Update Prompt

현재 프로젝트에 Sonbbal Superpowers for Claude Code를 설치하거나 업데이트해줘...

## Codex Install Or Update Prompt

현재 Codex 환경에 Sonbbal Superpowers for Codex를 설치하거나 업데이트해줘...
```

Each prompt must mention platform package roots: `claude-code/` and `codex/`.

### Task 4: Update Codex Install Docs And Tests

**Files:**
- Create: `codex/INSTALL.md`
- Modify: `.codex/INSTALL.md`
- Modify: `codex/README.md`
- Modify: `docs/README.codex.md`
- Modify: `tests/codex/test-plugin-package.sh`

- [ ] **Step 1: Add canonical Codex install guide**

Create `codex/INSTALL.md` from the current `.codex/INSTALL.md` content, updating wording so `codex/INSTALL.md` is canonical.

- [ ] **Step 2: Replace root Codex install doc with compatibility pointer**

Replace `.codex/INSTALL.md` with:

```markdown
# Codex Install Guide Moved

The canonical Codex install guide now lives at `codex/INSTALL.md`.

Open:

```text
codex/INSTALL.md
```
```

- [ ] **Step 3: Update Codex README references**

Update `codex/README.md` so it says:

```markdown
- Claude Code package: `../claude-code/`
- Codex package: this directory, `codex/`
```

- [ ] **Step 4: Update Codex package test**

Change `tests/codex/test-plugin-package.sh` so `INSTALL_DOC` points to:

```bash
INSTALL_DOC="$PLUGIN_DIR/INSTALL.md"
ROOT_INSTALL_DOC="$REPO_ROOT/.codex/INSTALL.md"
```

Add a `require_text "$ROOT_INSTALL_DOC" 'codex/INSTALL.md'` compatibility-pointer assertion.

- [ ] **Step 5: Run Codex package test**

Run: `bash tests/codex/test-plugin-package.sh`

Expected: PASS.

### Task 5: Rewrite Root Documentation And Release Notes

**Files:**
- Modify: `README.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Rewrite root README**

Make `README.md` a platform selector that links to:

- `claude-code/`
- `codex/`
- `docs/installation.md`
- `docs/prompts.md`

The README must not say Claude Code skills live in root `skills/`.

- [ ] **Step 2: Add release note**

Add a top release note stating that the Claude Code package moved from repository root to `claude-code/`, while Codex remains under `codex/`.

- [ ] **Step 3: Update current testing doc path**

Update `docs/testing.md` current guidance from root `skills/` to `claude-code/skills/`.

### Task 6: Final Verification

**Files:**
- All changed package, test, and documentation files.

- [ ] **Step 1: Run Claude Code package layout test**

Run: `bash tests/claude-code/test-plugin-package.sh`

Expected: PASS.

- [ ] **Step 2: Run Codex package test**

Run: `bash tests/codex/test-plugin-package.sh`

Expected: PASS.

- [ ] **Step 3: Run Codex compatibility suite without pressure behavior**

Run:

```bash
bash tests/codex/test-codex-skill-language.sh
```

Expected: PASS.

- [ ] **Step 4: Inspect status**

Run: `git status --short`

Expected: only intended files changed plus any pre-existing unrelated untracked files.

- [ ] **Step 5: Commit**

Run:

```bash
git add .claude-plugin .codex claude-code codex docs README.md RELEASE-NOTES.md tests
git commit -m "refactor: separate Claude Code and Codex packages"
```

Expected: commit succeeds.

