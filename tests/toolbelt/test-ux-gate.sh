#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/ux-gate/SKILL.md"
metadata="$repo_root/skills/ux-gate/agents/openai.yaml"

assert_contains() {
  local file=$1 text=$2 description=$3
  if ! grep -Fq "$text" "$file"; then
    echo "not ok - $description" >&2
    echo "missing: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_no_model_names() {
  local file=$1
  if grep -Eq 'gpt-[0-9]|opus-|sonnet|haiku|-sol|Sol (high|medium|low)' "$file"; then
    echo "not ok - concrete model identifiers in $file" >&2
    exit 1
  fi
  echo "ok - no concrete model identifiers in $file"
}

[ -f "$skill" ] || { echo "not ok - skill file missing: $skill" >&2; exit 1; }

assert_contains "$skill" "name: ux-gate" "frontmatter name"
assert_contains "$skill" "\`Pass\` bound to the reviewed head SHA, or \`Changes Required\`" "verdict contract"
assert_contains "$skill" "The gate does not fix anything." "gate does not fix"
assert_contains "$skill" "nothing downstream may claim UX was verified" "runtime preflight is mandatory"
assert_contains "$skill" "smallest set of navigation pathways covering what this diff changed" "pathways derive from the diff"
assert_contains "$skill" "scripts/ux-capture" "capture runs the bundled script"
assert_contains "$skill" ".toolbelt/ux/" "script lives in ignored scratch"
assert_contains "$skill" "<pathway>-<step>-<state>-<width>-<theme>.png" "screenshot naming convention"
assert_contains "$skill" "Enumerate the capture matrix" "matrix enumerated before capture"
assert_contains "$skill" "including shared styling or layout the step consumes" "width trigger covers consumed shared styling"
assert_contains "$skill" "Capture every supported theme for every changed surface" "every theme, every time"
assert_contains "$skill" "Record the reason for omitted dimensions" "excluded dimensions are recorded"
assert_contains "$skill" "there is no fixed image-count limit" "evidence size scales with the feature"
assert_contains "$skill" "one nearest previously passing unchanged state for each affected component" "fix rounds capture a minimum comparison"
assert_contains "$skill" "a shared style or token change invalidates every consuming capture" "carry-forward invalidation"
assert_contains "$skill" "There is no second round" "one capture-and-fix round"
assert_contains "$skill" "pathways covered separately from raw screenshot count" "verdict reports pathways"
assert_contains "$skill" "Route one \`reviewer\` with specialty \`ux\` via agent-routing" "routed ux reviewer"
assert_contains "$skill" "vision-capable model" "reviewer route must handle images"
assert_contains "$skill" "without driving the browser" "reviewer judges images, not live UI"
assert_contains "$skill" "docs/REVIEW-GUIDANCE.md" "reviewer-only guidance is offered to the reviewer"
assert_contains "$skill" "visible inconsistencies or usability problems" "design pass asks for observable findings"
assert_contains "$skill" "a severity (blocker, should, nit), the evidence" "finding format"
assert_contains "$skill" "a finding, not a skip" "blocked step is a finding"
assert_contains "$skill" "rerun the capture script on the new head" "fix rounds rerun the script"
assert_contains "$skill" "a new push invalidates prior evidence" "head-bound evidence"
assert_contains "$skill" "before the final gate verdict" "UX gate precedes the final gate"
assert_contains "$skill" "One primary UX reviewer by default" "single primary reviewer"
assert_contains "$skill" "Do not manufacture states by editing app source" "no manufactured states"
assert_no_model_names "$skill"

[ -f "$metadata" ] || { echo "not ok - committed OpenAI metadata missing" >&2; exit 1; }
grep -Fq "display_name" "$metadata" || { echo "not ok - metadata lacks display_name" >&2; exit 1; }
echo "ok - committed OpenAI metadata present"

echo "PASS"
