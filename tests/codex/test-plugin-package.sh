#!/usr/bin/env bash
# Verifies the Codex plugin package is populated and discoverable.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_DIR="$REPO_ROOT/plugins/sonbbal-superpowers-codex"
SKILLS_DIR="$PLUGIN_DIR/skills"
PLUGIN_JSON="$PLUGIN_DIR/.codex-plugin/plugin.json"

required_skills=(
  "api-edr-validation"
  "audit-verification"
  "brainstorming"
  "context-window-management"
  "dispatching-parallel-agents"
  "executing-plans"
  "finishing-a-development-branch"
  "model-assignment"
  "project-scoping"
  "receiving-code-review"
  "requesting-code-review"
  "subagent-driven-development"
  "systematic-debugging"
  "team-driven-development"
  "test-driven-development"
  "using-git-worktrees"
  "using-superpowers"
  "verification-before-completion"
  "wiki-management"
  "writing-plans"
  "writing-skills"
)

INSTALL_DOC="$REPO_ROOT/.codex/INSTALL.md"
CODEX_README="$REPO_ROOT/docs/README.codex.md"
PLUGIN_README="$PLUGIN_DIR/README.md"

fail() {
  echo "  [FAIL] $1"
  exit 1
}

pass() {
  echo "  [PASS] $1"
}

require_text() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  [ -f "$file" ] || fail "Missing required file: $file"

  if rg -q "$pattern" "$file"; then
    pass "$message"
  else
    fail "$message"
  fi
}

echo "=== Test: Codex Plugin Package ==="

[ -f "$PLUGIN_JSON" ] || fail "Missing plugin metadata: $PLUGIN_JSON"
pass "plugin.json exists"

grep -Eq '"skills"[[:space:]]*:[[:space:]]*"\./skills"' "$PLUGIN_JSON" \
  || fail 'plugin.json must contain "skills": "./skills"'
pass 'plugin.json points skills to ./skills'

[ -d "$SKILLS_DIR" ] || fail "Missing skills directory: $SKILLS_DIR"

skill_count=$(find "$SKILLS_DIR" -name SKILL.md | wc -l | tr -d ' ')
[ "$skill_count" -gt 0 ] || fail "No SKILL.md files found in $SKILLS_DIR"
pass "found $skill_count skill files"

for skill in "${required_skills[@]}"; do
  skill_file="$SKILLS_DIR/$skill/SKILL.md"
  [ -f "$skill_file" ] || fail "Missing required skill: $skill_file"

  awk '
    NR == 1 && $0 != "---" { exit 1 }
    NR > 1 && $0 == "---" { found_end = 1; exit 0 }
    END { exit found_end ? 0 : 1 }
  ' "$skill_file" || fail "Missing YAML frontmatter delimiters: $skill_file"

  awk '
    NR == 1 { next }
    $0 == "---" { exit }
    /^name:[[:space:]]*[^[:space:]]/ { name = 1 }
    /^description:[[:space:]]*./ { description = 1 }
    END { exit name && description ? 0 : 1 }
  ' "$skill_file" || fail "Frontmatter must include name and description: $skill_file"
done

pass "all required root skills exist with name and description frontmatter"

[ "$skill_count" -eq "${#required_skills[@]}" ] \
  || fail "Expected ${#required_skills[@]} Codex skill files, found $skill_count"
pass "Codex plugin has ${#required_skills[@]} skill files"

require_text "$INSTALL_DOC" 'plugins/sonbbal-superpowers-codex' \
  ".codex/INSTALL.md points users at the Codex plugin package"
require_text "$INSTALL_DOC" '~/.agents/skills/sonbbal-superpowers-codex' \
  ".codex/INSTALL.md documents the Codex-native skill install path"
require_text "$PLUGIN_README" 'plugins/sonbbal-superpowers-codex' \
  "plugin README identifies the Codex plugin package path"
require_text "$PLUGIN_README" '~/.agents/skills/sonbbal-superpowers-codex' \
  "plugin README documents the Codex-native skill install path"
require_text "$CODEX_README" 'plugins/sonbbal-superpowers-codex' \
  "docs/README.codex.md points users at the Codex plugin package"
require_text "$CODEX_README" '~/.agents/skills/sonbbal-superpowers-codex' \
  "docs/README.codex.md documents the Codex-native skill install path"
