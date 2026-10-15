#!/usr/bin/env bash
# Literal shell snippets are contract text, not expressions to expand.
# shellcheck disable=SC2016
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/writing-plans/SKILL.md"

assert_contains() {
  local text=$1 description=$2
  if ! grep -Fq -- "$text" "$skill"; then
    echo "not ok - $description" >&2
    echo "missing: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_not_contains() {
  local text=$1 description=$2
  if grep -Fq -- "$text" "$skill"; then
    echo "not ok - $description" >&2
    echo "unexpected: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

# Exploration happens before drafting; explorers are routed and sparing.
assert_contains 'nearest instructions' "exploration starts from local instructions"
assert_contains 'Keep searching until you can name exact paths, signatures, and precedents' \
  "exploration has a completion condition, not a search budget"
assert_contains "agent-routing's \`explorer\` role" \
  "explorers are routed, not hand-picked"
assert_contains 'most plans need one explorer or none' \
  "explorer fan-out stays small"
assert_contains 'Ask for checkable answers' \
  "explorer briefs request checkable evidence"
assert_contains 'get wrong here?' "explorer briefs end with the forcing question"
assert_not_contains 'fan out explorers — one per surface the plan will touch' \
  "unconditional per-surface fan-out is absent"

line_of() { grep -n -- "$1" "$skill" | head -1 | cut -d: -f1; }
assert_order() {
  local a b
  a=$(line_of "$1"); b=$(line_of "$2")
  if [ -z "$a" ] || [ -z "$b" ] || [ "$a" -ge "$b" ]; then
    echo "not ok - $3" >&2
    exit 1
  fi
  echo "ok - $3"
}
assert_order '^## Explore first' '^## Shape the work' "exploration precedes shaping the work"
assert_order '^## PR Boundaries' '^### Task 1:' "PR Boundaries precede tasks in the plan document"

# Traps are resolved or named.
assert_contains 'An absence check must exclude its own evidence' \
  "trap list covers unpassable absence checks"
assert_contains 'a precondition read from output the gated command itself produces' \
  "a gate cannot observe the command it gates"
assert_contains 'Coverage that leaves with the code' \
  "deletions relocate coverage for kept code"
assert_contains 'or named with an instruction to escalate' \
  "every trap is resolved or named"

# Shared plan sections reach implementers through task-brief.
assert_contains '## Known Gotchas' "plan header carries cross-cutting gotchas"
assert_contains '**Gotchas:**' "task structure carries task-local gotchas"
assert_contains '`scripts/task-brief` copies `## Global Constraints`, `## Known Gotchas`, and `## Data Model`' \
  "shared sections are copied into every brief"
assert_contains '> Execute with toolbelt:delivery.' \
  "the plan header points at delivery, not SDD"

# PR boundaries partition tasks into independently verifiable outcomes.
assert_contains '| PR | Outcome | Tasks | Depends on | Independent verification |' \
  "each PR row carries the required boundary fields"
assert_contains 'Every task number appears in exactly one boundary' \
  "boundaries cover tasks without overlap"
assert_contains 'core plus one representative consumer' \
  "shared substrate starts with one representative consumer"
assert_contains 'repeat the same reviewer judgment' \
  "later consumers share a PR only when review is repetitive"
assert_contains 'Novel lifecycle, export, or rollout work stays separate' \
  "novel consumer work gets its own boundary"
assert_contains 'at most one predecessor whose PR may still be open when the boundary starts' \
  "a boundary depends on at most one still-open predecessor"

# Task shape.
assert_contains "A task's **Files:** block lists every file" \
  "a task lists every file it touches"
assert_contains 'past roughly 40 files or 2,500 changed lines, split it' "task size is a high tripwire, not a small target"
assert_contains 'Split when two parts could run in parallel on disjoint files' \
  "bigger tasks never swallow parallel work"
assert_contains 'For any boundary with more than three tasks, look for tracks' \
  "planners actively look for parallel work"
assert_contains '`test-first`' "tasks can be test-first"
assert_contains '`checks-only`' "tasks can be verified by commands alone"
assert_contains '**Verify:** test-first' "the task template names its verify mode"
assert_contains 'Mechanical sweep:' "mechanical sweeps are marked and verified"
assert_contains '**Proves:**' "each task lists the behaviors it must prove"
assert_contains 'is test-first whatever the task' "a guard is test-first in every mode"
assert_contains 'records each one'"'"'s first failing run in its report' \
  "the implementer records first failing runs; review does not re-litigate them"
assert_contains '`**Review:** per-task`; the rest are reviewed in the boundary' \
  "risky tasks get per-task review, the rest the boundary's final review"
assert_contains 'never the implementation code' "plans hold contracts, not code"
assert_contains 'it never blocks other merges' "a sweep never blocks other merges"
assert_contains 'Produces: none' \
  "a task with no downstream dependents says so"

# Review and handoff.
assert_contains 'It may dispatch its own explorers' "plan reviewer may explore too"
assert_contains 'ask it to judge:' "plan reviewer gets an explicit rubric, not this skill's handoff"
assert_contains 'Unless your human partner or the session' \
  "handoff waits for approval unless told otherwise"
assert_contains 'invoke toolbelt:delivery' "the whole plan is handed to delivery"
assert_not_contains 'No need to re-review' \
  "stale no-re-review clause no longer contradicts the plan gate"

echo "PASS"
