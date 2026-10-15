#!/usr/bin/env bash
# Literal shell snippets are contract text, not expressions to expand.
# shellcheck disable=SC2016
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
sdd="$repo_root/skills/subagent-driven-development/SKILL.md"
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
    echo "unexpected: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_contains "$sdd" 'dispatch [re-review-prompt.md](re-review-prompt.md)' \
  "every fix round is re-reviewed"
assert_contains "$sdd" 'run one more round of steps 1–2' \
  "an open finding gets a second round"
assert_contains "$sdd" 'Task <N>: fix round <R>' \
  "each fix round has its own ledger line"
assert_contains "$sdd" '**Real and load-bearing** — mark the task `Task N: blocked' \
  "a load-bearing residual escalates"
assert_contains "$sdd" 'Task N: in-progress (agent <id>, route <harness>/<model>/<effort>)' \
  "in-progress ledger line records the resolved route"
assert_contains "$sdd" 'route <harness>/<model>/<effort>, report <path>' \
  "complete ledger line records the resolved route"

assert_contains "$implementer" 'against code that lacks the guard' \
  "seen red means the guard failed against code missing the guard"
assert_contains "$implementer" 'first run failed: <command> — <key error line>; passes now' \
  "the implementer notes each new test's first failing run"
assert_contains "$implementer" '| Finding | Commit | Covering test command | Result |' \
  "the fix report uses the required findings table"
assert_contains "$rereview" 'never extend the fix loop' \
  "out-of-scope findings never extend the fix loop"

assert_contains "$implementer" 'You decide only how the code is written inside the brief' \
  "implementers make code decisions only"
assert_contains "$implementer" "Report a bug you find outside your task; don't fix it." \
  "implementers stay inside their task"
assert_contains "$sdd" 'A product or contract decision the plan doesn' \
  "missing decisions go to the human, not the orchestrator or implementer"

echo "PASS"
