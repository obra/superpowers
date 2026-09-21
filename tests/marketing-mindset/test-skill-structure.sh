#!/usr/bin/env bash
# Structural checks for skills/marketing-mindset. Behaviour is tested by
# scenario evals kept by the maintainer; this script only checks what a shell
# can check here: frontmatter, required sections, SKILL.md word budget, and
# that the house vocabulary and no machine-specific paths leaked in.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_DIR="$REPO_ROOT/skills/marketing-mindset"
SKILL_MD="$SKILL_DIR/SKILL.md"
WORD_BUDGET=1000

PASSES=0
FAILURES=0

pass() { echo "  [PASS] $1"; PASSES=$((PASSES + 1)); }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "marketing-mindset structure"

# --- SKILL.md frontmatter -------------------------------------------------
if [ -f "$SKILL_MD" ]; then
  pass "SKILL.md exists"
  frontmatter="$(awk 'NR==1 && $0!="---"{exit} NR>1 && $0=="---"{exit} NR>1{print}' "$SKILL_MD")"
  if printf '%s\n' "$frontmatter" | grep -q '^name: marketing-mindset$'; then
    pass "frontmatter name is marketing-mindset"
  else
    fail "frontmatter name is marketing-mindset"
  fi
  description="$(printf '%s\n' "$frontmatter" | awk '/^description:/{sub(/^description:[ ]*/,""); print; found=1; next} found && /^[ ]/{print} found && !/^[ ]/{exit}' | tr '\n' ' ')"
  if printf '%s' "$description" | grep -q '^Use when'; then
    pass "description starts with 'Use when'"
  else
    fail "description starts with 'Use when' (got: ${description:0:60})"
  fi
  if [ "${#description}" -le 1024 ]; then
    pass "description under 1024 characters"
  else
    fail "description under 1024 characters (${#description})"
  fi
  if [ "${#frontmatter}" -le 1024 ]; then
    pass "frontmatter under 1024 characters"
  else
    fail "frontmatter under 1024 characters (${#frontmatter})"
  fi
  for banned in "dispatch" "then" "step"; do
    if printf '%s' "$description" | grep -qiw "$banned"; then
      fail "description contains workflow word '$banned'"
    else
      pass "description avoids workflow word '$banned'"
    fi
  done

  # --- word budget --------------------------------------------------------
  body_words="$(awk 'BEGIN{fm=0} NR==1 && $0=="---"{fm=1; next} fm==1 && $0=="---"{fm=2; next} fm==2{print}' "$SKILL_MD" | wc -w | tr -d ' ')"
  if [ "$body_words" -le "$WORD_BUDGET" ]; then
    pass "SKILL.md body within $WORD_BUDGET words ($body_words)"
  else
    fail "SKILL.md body within $WORD_BUDGET words ($body_words)"
  fi

  # --- required sections --------------------------------------------------
  for heading in "## Overview" "## When to Use" "## Hard Rules" "## Red Flags" "## Verification"; do
    if grep -q "^$heading" "$SKILL_MD"; then
      pass "SKILL.md has section '$heading'"
    else
      fail "SKILL.md has section '$heading'"
    fi
  done
else
  fail "SKILL.md exists"
fi

# --- every referenced skill-local file exists -----------------------------
while IFS= read -r ref; do
  if [ -f "$SKILL_DIR/$ref" ]; then
    pass "referenced file exists: $ref"
  else
    fail "referenced file exists: $ref"
  fi
done < <(grep -o '\(references\|prompts\|templates\|scripts\)/[A-Za-z0-9._-]*\.[A-Za-z0-9]*' "$SKILL_MD" 2>/dev/null | sort -u)

# --- no local paths or names in shipped files -----------------------------
leaks="$(grep -rn -E '/Users/|/home/|/root/' "$SKILL_DIR" "$SCRIPT_DIR" --exclude=test-skill-structure.sh 2>/dev/null || true)"
if [ -z "$leaks" ]; then
  pass "no machine-specific paths in shipped files (skills + tests)"
else
  fail "no machine-specific paths in shipped files (skills + tests)"
  printf '%s\n' "$leaks" | head -10 | sed 's/^/    /'
fi

# --- "the user" never appears in skill prose ------------------------------
user_hits="$(grep -rn -i 'the user' "$SKILL_DIR" --include='*.md' 2>/dev/null || true)"
if [ -z "$user_hits" ]; then
  pass "skill files say 'your human partner', not 'the user'"
else
  fail "skill files say 'your human partner', not 'the user'"
  printf '%s\n' "$user_hits" | head -10 | sed 's/^/    /'
fi

echo
echo "Passed: $PASSES  Failed: $FAILURES"
[ "$FAILURES" -eq 0 ]
