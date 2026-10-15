#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/orchestrating/SKILL.md"
delivery="$repo_root/skills/delivery/SKILL.md"
sdd="$repo_root/skills/subagent-driven-development/SKILL.md"
ux="$repo_root/skills/ux-gate/SKILL.md"
monitor="$repo_root/skills/pr-monitor/SKILL.md"
implementer="$repo_root/skills/subagent-driven-development/implementer-prompt.md"
rereview="$repo_root/skills/subagent-driven-development/re-review-prompt.md"

assert_contains() {
  local file=$1 text=$2 description=$3
  if ! grep -Fq -- "$text" "$file"; then
    echo "not ok - $description" >&2
    echo "missing: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_not_contains() {
  local file=$1 text=$2 description=$3
  if grep -Fq -- "$text" "$file"; then
    echo "not ok - $description" >&2
    echo "present: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

[[ -f "$skill" ]] || { echo "not ok - orchestrating skill missing" >&2; exit 1; }

assert_contains "$skill" "name: orchestrating" "frontmatter name"
assert_contains "$skill" "This list is complete:" "read list is closed"
assert_contains "$skill" "A skill named anywhere else is a dispatch target, not a read: pr-monitor, ux-gate, finishing-a-development-branch" "named skills are dispatch targets"
assert_contains "$skill" "Never open one to relay, verify, summarize, or re-judge it." "artifacts move by path"
assert_contains "$skill" "Escalations from a PR monitor or gate runner go to your human partner" "escalations reach the human"
assert_contains "$skill" "never poll, sleep-loop, or schedule check-ins" "one blocking wait"

assert_contains "$delivery" "Invoke toolbelt:orchestrating first" "delivery enters through orchestrating"
assert_contains "$sdd" "Invoke toolbelt:orchestrating" "SDD enters through orchestrating"
assert_not_contains "$sdd" "read [the UX matrix reference]" "orchestrator no longer authors smoke matrices"

assert_contains "$ux" "A dispatched gate runner (role \`errand\`) runs this skill" "gate runner runs ux-gate"
assert_not_contains "$ux" "The orchestrator runs this skill" "orchestrator does not run ux-gate"
assert_contains "$monitor" "For an unpublished branch, run toolbelt:finishing-a-development-branch" "monitor publishes the PR"

assert_contains "$implementer" "its Result is \`REBUTTED:\`" "implementer can rebut a finding"
assert_contains "$rereview" "A \`REBUTTED\` row is ADDRESSED when its reasoning holds" "re-review judges rebuttals"
assert_contains "$skill" "When a fix loop ends with findings still open, you rule on them" "open and rebutted findings are ruled on"
assert_contains "$skill" "## Keep going" "orchestrator names the early stops to avoid"
assert_contains "$skill" "scripts/ledger-append LEDGER_FILE" "ledger lines are appended by script"
assert_contains "$skill" "only at a gate" "ledger writes happen at gates only"
assert_contains "$skill" "never auto-merge or auto-decide it" "stale blockers go back to the human partner"
assert_contains "$sdd" "**Wrong, or its rebuttal holds** — park it" "SDD lists the rulings"

echo "PASS"
