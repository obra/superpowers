#!/usr/bin/env bash
# Consistency verification for #2292: GREEN must measure outcome, not only
# compliance, for skills that produce an artifact. Every place the skill
# text teaches GREEN must carry both dimensions — this script checks the
# structural invariants across SKILL.md and testing-skills-with-subagents.md.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../../skills/writing-skills" && pwd)"
SKILL="$DIR/SKILL.md"
TESTING="$DIR/testing-skills-with-subagents.md"
pass=0; fail=0

check() {
  local desc="$1"; shift
  if "$@"; then echo "  [PASS] $desc"; pass=$((pass+1));
  else echo "  [FAIL] $desc"; fail=$((fail+1)); fi
}

has() { grep -q "$1" "$2"; }

echo "=== #2292: outcome-GREEN consistency ==="
echo
echo "SKILL.md:"

check "TDD table splits GREEN into compliance row" \
  has 'Test passes (GREEN), compliance' "$SKILL"
check "TDD table splits GREEN into outcome row" \
  has 'Test passes (GREEN), outcome' "$SKILL"
check "outcome row says measured, not argued" \
  has 'measured, not argued' "$SKILL"
check "outcome row says compliance is a proxy" \
  has 'Compliance without this is a proxy' "$SKILL"
check "Watch-it-pass row mentions artifact verification" \
  has 'verify the artifact does what the skill exists for' "$SKILL"

for type in Technique Pattern Reference; do
  # each type section must contain both criteria lines after its heading
  section=$(sed -n "/^### ${type} Skills/,/^### /p" "$SKILL")
  check "$type: has Success criteria" \
    bash -c "echo \"\$0\" | grep -q 'Success criteria:'" "$section"
  check "$type: has Outcome criteria" \
    bash -c "echo \"\$0\" | grep -q 'Outcome criteria:'" "$section"
  check "$type: outcome requires explicit-unverified if unmeasurable" \
    bash -c "echo \"\$0\" | grep -qi 'say so explicitly\|state that explicitly\|flag what remains unverified'" "$section"
done

check "Discipline section states compliance IS the outcome" \
  has 'compliance IS the outcome' "$SKILL"
check "Rationalizations: followed-skill ≠ works" \
  has 'The agent followed the skill, so the skill works' "$SKILL"
check "Rationalizations: careful reasoning ≠ sound" \
  has 'The reasoning was careful, so the result is sound' "$SKILL"
check "GREEN phase: compliance alone is not GREEN" \
  has 'compliance alone is' "$SKILL"
check "GREEN phase: record unverified rather than silence" \
  has 'record that the' "$SKILL"
check "Checklist: artifact outcome verification item" \
  has 'For artifact-producing skills: verify the artifact' "$SKILL"

echo
echo "testing-skills-with-subagents.md:"
check "intro mentions artifact outcome" \
  has 'verify the artifact achieves what the skill exists for' "$TESTING"
check "GREEN phase: outcome paragraph present" \
  has 'compliance alone is' "$TESTING"
check "GREEN checklist: artifact item" \
  has 'For artifact-producing skills: verified the artifact' "$TESTING"
check "Verify-GREEN quick-ref row carries both dimensions" \
  has 'the artifact does what the skill exists for' "$TESTING"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
