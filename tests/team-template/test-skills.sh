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
check_skill team/skills/generate-workflow/SKILL.md generate-workflow "compose and scaffold, never hallucinate" "team/workflow.md" "requesting-code-review"
check_skill team/skills/new-skill/SKILL.md new-skill "team or personal" "~/.claude/skills" "trigger description"
finish
