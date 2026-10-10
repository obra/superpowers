#!/usr/bin/env bash
# Structural checks for the fork's skills (skills/handover, skills/obsidian
# and skills/recommending-mcp-servers): frontmatter, word budget, required sections, expected and
# referenced files exist, helper scripts are executable in git, no
# machine-specific paths, "your human partner" voice, and the MCP hooks in
# brainstorming, writing-plans and requesting-code-review. Behavior is checked by
# the scenario runs recorded in the implementation plan, not here.
#
# Usage: test-skill-structure.sh [SKILL...]
#   (default: handover obsidian recommending-mcp-servers)
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORD_BUDGET=1000

PASSES=0
FAILURES=0

pass() { echo "  [PASS] $1"; PASSES=$((PASSES + 1)); }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

expected_files() {
  case "$1" in
    handover) echo "SKILL.md scripts/handover-path scripts/handover-files" ;;
    obsidian) echo "SKILL.md note-templates.md scripts/vault-path scripts/vault-changes scripts/vault-mark-synced" ;;
    recommending-mcp-servers) echo "SKILL.md" ;;
  esac
}

# has FILE FIXED-STRING LABEL — pass when FILE contains FIXED-STRING.
has() {
  if grep -qF -- "$2" "$1" 2>/dev/null; then pass "$3"; else fail "$3"; fi
}

# The MCP recommendation skill and the hooks that hand off to it.
check_mcp_hooks() {
  local f="$REPO_ROOT/skills/recommending-mcp-servers/SKILL.md"
  has "$f" '~/.claude/superpowers/mcp-catalog.md' "mcp: catalog path"
  has "$f" '| Server | Need | Verifies | Status |' "mcp: output table"
  has "$f" 'No MCP servers recommended' "mcp: empty result"
  # Procedure-only phrases: the Red Flags table repeats some keywords, so
  # these must not be satisfiable by that table alone.
  has "$f" 'the result is the line' "mcp: procedure states the empty result"
  has "$f" 'or look at the `mcp__*` tools visible' "mcp: fallback to visible tools"
  has "$f" 'Judge each server by capability, not by exact name' "mcp: status judged by capability"
  has "$f" 'name the installed server' "mcp: a different server is named, not the catalog's"
  has "$f" 'declines an entry, continue' "mcp: declined entries"
  has "$f" 'rewrite or reorder existing entries' "mcp: hand-edited catalog"

  local b="$REPO_ROOT/skills/brainstorming/SKILL.md"
  has "$b" '6. **Recommend MCP servers**' "brainstorming: checklist step 6"
  has "$b" '10. **Transition to implementation**' "brainstorming: checklist renumbered"
  has "$b" 'superpowers:recommending-mcp-servers' "brainstorming: invokes the skill"
  has "$b" '## MCP Servers' "brainstorming: spec section"
  has "$b" '"User approves design?" -> "Recommend MCP servers" [label="yes"];' "brainstorming: flow edge in"
  has "$b" '"Recommend MCP servers" -> "Write design doc";' "brainstorming: flow edge out"
  has "$b" 'runs during brainstorming' "brainstorming: terminal-state clarification"

  local w="$REPO_ROOT/skills/writing-plans/SKILL.md" ln_stack ln_mcp ln_spec
  has "$w" '**MCP Servers:** [from the spec' "writing-plans: header line"
  has "$w" 'superpowers:recommending-mcp-servers' "writing-plans: invokes without a spec"
  has "$w" 'installs an MCP server' "writing-plans: no install tasks"
  ln_stack="$(grep -nF '**Tech Stack:**' "$w" | head -1 | cut -d: -f1)"
  ln_mcp="$(grep -nF '**MCP Servers:**' "$w" | head -1 | cut -d: -f1)"
  ln_spec="$(grep -nF '**Spec:**' "$w" | head -1 | cut -d: -f1)"
  if [ -n "$ln_mcp" ] && [ "${ln_stack:-0}" -lt "$ln_mcp" ] && [ "$ln_mcp" -lt "${ln_spec:-0}" ]; then
    pass "writing-plans: MCP Servers line sits between Tech Stack and Spec"
  else
    fail "writing-plans: MCP Servers line sits between Tech Stack and Spec"
  fi

  local r="$REPO_ROOT/skills/requesting-code-review/SKILL.md"
  local c="$REPO_ROOT/skills/requesting-code-review/code-reviewer.md"
  has "$r" '{MCP_SERVERS}' "code-review: SKILL.md placeholder"
  has "$c" '[MCP_SERVERS]' "code-review: template placeholder"
  has "$c" '## MCP Servers' "code-review: template section"
  has "$c" 'Do not write the MCP catalog' "code-review: reviewer never writes catalog"
  has "$c" 'under Recommendations' "code-review: missing servers recommended"
  has "$REPO_ROOT/skills/subagent-driven-development/SKILL.md" '`**MCP Servers:**` line as `[MCP_SERVERS]`' "sdd: final review fills MCP_SERVERS"
  has "$REPO_ROOT/skills/executing-plans/SKILL.md" '`**MCP Servers:**` line as `[MCP_SERVERS]`' "executing-plans: final review fills MCP_SERVERS"
  has "$REPO_ROOT/.muse-plugin/plugin.json" '"id": "recommending-mcp-servers"' "registered in the Muse manifest"
  has "$REPO_ROOT/README.md" '**recommending-mcp-servers**' "listed in the README"
}

check_skill() {
  local name="$1"
  local skill_dir="$REPO_ROOT/skills/$name"
  local skill_md="$skill_dir/SKILL.md"
  echo "$name structure"

  local rel
  for rel in $(expected_files "$name"); do
    if [ -f "$skill_dir/$rel" ]; then pass "$name: expected file present: $rel"; else fail "$name: expected file present: $rel"; fi
  done
  [ "$name" = recommending-mcp-servers ] && check_mcp_hooks
  [ -f "$skill_md" ] || return

  # --- frontmatter ----------------------------------------------------------
  local frontmatter description
  frontmatter="$(awk 'NR==1 && $0!="---"{exit} NR>1 && $0=="---"{exit} NR>1{print}' "$skill_md")"
  if printf '%s\n' "$frontmatter" | grep -q "^name: $name\$"; then
    pass "$name: frontmatter name matches the directory"
  else
    fail "$name: frontmatter name matches the directory"
  fi
  if [ "$(printf '%s\n' "$frontmatter" | grep -c '^[A-Za-z_-]*:')" -eq 2 ]; then
    pass "$name: frontmatter has only name and description"
  else
    fail "$name: frontmatter has only name and description"
  fi
  description="$(printf '%s\n' "$frontmatter" | awk '/^description:/{sub(/^description:[ ]*/,""); print; found=1; next} found && /^[ ]/{print} found && !/^[ ]/{exit}' | tr '\n' ' ')"
  if printf '%s' "$description" | grep -q '^Use when'; then
    pass "$name: description starts with 'Use when'"
  else
    fail "$name: description starts with 'Use when' (got: ${description:0:60})"
  fi
  if [ "${#description}" -le 1024 ]; then
    pass "$name: description under 1024 characters"
  else
    fail "$name: description under 1024 characters (${#description})"
  fi
  local banned
  for banned in dispatch then step; do
    if printf '%s' "$description" | grep -qiw "$banned"; then
      fail "$name: description contains workflow word '$banned'"
    else
      pass "$name: description avoids workflow word '$banned'"
    fi
  done

  # --- body -----------------------------------------------------------------
  local body_words
  body_words="$(awk 'BEGIN{fm=0} NR==1 && $0=="---"{fm=1; next} fm==1 && $0=="---"{fm=2; next} fm==2{print}' "$skill_md" | wc -w | tr -d ' ')"
  if [ "$body_words" -le "$WORD_BUDGET" ]; then
    pass "$name: SKILL.md body within $WORD_BUDGET words ($body_words)"
  else
    fail "$name: SKILL.md body within $WORD_BUDGET words ($body_words)"
  fi
  if grep -q '^## Red Flags' "$skill_md"; then pass "$name: has '## Red Flags'"; else fail "$name: has '## Red Flags'"; fi

  # --- every scripts/<x> the skill mentions exists and is executable in git -
  local ref mode
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    if [ -f "$skill_dir/$ref" ]; then pass "$name: referenced file exists: $ref"; else fail "$name: referenced file exists: $ref"; fi
  done < <(grep -o 'scripts/[a-z][a-z-]*' "$skill_md" | sort -u)
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    mode="$(git -C "$REPO_ROOT" ls-files -s -- "skills/$name/$ref" | cut -c1-6)"
    if [ "$mode" = "100755" ]; then pass "$name: $ref is executable in git"; else fail "$name: $ref is executable in git (mode '${mode:-untracked}')"; fi
  done < <(cd "$skill_dir" && ls -1 scripts 2>/dev/null | sed 's#^#scripts/#')

  # --- leaks and voice --------------------------------------------------------
  local leaks user_hits
  leaks="$(grep -rn -E '/Users/|/home/|[A-Za-z]:[/\]Users|nilso' "$skill_dir" 2>/dev/null || true)"
  if [ -z "$leaks" ]; then pass "$name: no machine-specific paths or names"; else
    fail "$name: no machine-specific paths or names"; printf '%s\n' "$leaks" | head -5 | sed 's/^/    /'
  fi
  user_hits="$(grep -rn -i 'the user' "$skill_dir" 2>/dev/null || true)"
  if [ -z "$user_hits" ]; then pass "$name: says 'your human partner', not 'the user'"; else
    fail "$name: says 'your human partner', not 'the user'"; printf '%s\n' "$user_hits" | head -5 | sed 's/^/    /'
  fi
}

skills=("$@")
[ ${#skills[@]} -gt 0 ] || skills=(handover obsidian recommending-mcp-servers)
for s in "${skills[@]}"; do check_skill "$s"; done

echo
echo "Passed: $PASSES  Failed: $FAILURES"
[ "$FAILURES" -eq 0 ]
