#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
sdd="$repo_root/skills/subagent-driven-development/SKILL.md"
task_prompt="$repo_root/skills/subagent-driven-development/task-reviewer-prompt.md"
requesting="$repo_root/skills/requesting-code-review/SKILL.md"
final_prompt="$repo_root/skills/requesting-code-review/code-reviewer.md"
implementer_prompt="$repo_root/skills/subagent-driven-development/implementer-prompt.md"

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

for prompt in "$task_prompt" "$final_prompt"; do
  assert_contains "$prompt" 'docs/REVIEW-GUIDANCE.md' \
    "review prompt discovers canonical project guidance"
  assert_contains "$prompt" '[REVIEW_NUANCE]' \
    "review prompt accepts orchestrator-supplied nuance"
  assert_contains "$prompt" 'does not override requirements,' \
    "review nuance cannot pre-judge findings"
  assert_contains "$prompt" '[SMELLS_FILE]' \
    "review prompt carries the smell baseline"
done

assert_contains "$sdd" 'or `None`' \
  "SDD omits invented review nuance"
assert_contains "$sdd" 'never tells a reviewer what not to flag' \
  "nuance cannot suppress findings"
for prompt in "$task_prompt" "$final_prompt"; do
  assert_contains "$prompt" 'one hop' "reviewer traces beyond the diff, within a boundary"
  assert_contains "$prompt" 'Go further' "reviewer may follow a concrete finding further"
  assert_contains "$prompt" 'lifecycle gaps' "reviewer looks past plan compliance"
  assert_contains "$prompt" 'Every finding names a concrete scenario' \
    "findings carry evidence, which curbs speculative review"
done
assert_contains "$implementer_prompt" 'docs/REVIEW-GUIDANCE.md' \
  "implementers follow the project's review conventions up front"
assert_not_contains "$implementer_prompt" 'smell-baseline' \
  "implementer prompt does not receive the smell baseline"

assert_contains "$task_prompt" 'a realistic mutation no test' "task reviewer runs the mutation check"
assert_contains "$task_prompt" 'a missing note alone is never a finding' "a missing first-run note never starts a fix loop"
assert_not_contains "$task_prompt" 'mutate-and-revert' "no mutate-and-revert demand"
assert_contains "$implementer_prompt" 'It is not the whole' "Proves is not the whole test list"
assert_contains "$implementer_prompt" 'run its mutation check before you report' "implementers run the mutation check"

echo "PASS"
