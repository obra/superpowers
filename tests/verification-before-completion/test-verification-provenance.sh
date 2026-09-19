#!/usr/bin/env bash
# Consistency verification for #2286: verification-before-completion must
# ask where evidence came from (provenance), must not read silence as
# absence without an independent probe, and must not declare the user's
# own controls broken without a must-fire test. Checks the structural
# invariants across every section of the skill.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../../skills/verification-before-completion" && pwd)"
SKILL="$DIR/SKILL.md"
pass=0; fail=0

check() {
  local desc="$1"; shift
  if "$@"; then echo "  [PASS] $desc"; pass=$((pass+1));
  else echo "  [FAIL] $desc"; fail=$((fail+1)); fi
}
has() { grep -q "$1" "$SKILL"; }

echo "=== #2286: evidence-provenance consistency ==="
echo

check "Gate Function: ATTRIBUTE step present" \
  has 'ATTRIBUTE: What process wrote this output'
check "Gate Function: hand-run proves instrument only" \
  has 'proves the instrument works'
check "Gate Function: step count updated to 6" \
  has '^6\. ONLY THEN: Make the claim'

check "Common Failures: hand-run row" \
  has 'An entry your own hand-run probe wrote earlier'
check "Common Failures: silence-as-absence row" \
  has 'Silence from an instrument whose output path depends on env vars'
check "Common Failures: user-control row" \
  has 'An ask-pattern command ran without a visible prompt'

check "Red Flags: cite-without-provenance" \
  has 'Citing an artifact without naming the process that wrote it'
check "Red Flags: silence-as-absence" \
  has 'Reading silence as absence without an independent positive probe'
check "Red Flags: user-control-must-fire" \
  has 'without a must-fire test'

check "Rationalizations: ran-and-read" \
  has '"I ran the command and read the output"'
check "Rationalizations: empty-log" \
  has '"The log is empty, so it never ran"'
check "Rationalizations: must-not-be-running" \
  has '"It must not be running"'

check "Key Patterns: diagnostic-probes pattern" \
  has 'clear it → let the system act'
check "Key Patterns: reading-absence pattern" \
  has 'Independent positive probe in the target environment'
check "Key Patterns: user-tooling pattern" \
  has 'enumerate what could swallow the signal'

check "When To Apply: absence claims covered" \
  has 'Claims about absence'
check "When To Apply: user-tooling claims covered" \
  has 'Claims about the user.s own tooling'

check "Frontmatter description mentions attribution" \
  has 'evidence must be attributed'

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
