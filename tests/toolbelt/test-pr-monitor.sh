#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/pr-monitor/SKILL.md"
metadata="$repo_root/skills/pr-monitor/agents/openai.yaml"

assert_contains() {
  local file=$1 text=$2 description=$3
  if ! grep -Fq -- "$text" "$file"; then
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

assert_contains "$skill" "name: pr-monitor" "frontmatter name"
assert_contains "$skill" "Own one chain" "chain ownership"
assert_contains "$skill" "sole source of PR review, CI, fix-loop, and merge mechanics" "sole-source clause"
assert_contains "$skill" ".toolbelt/pr-policy.md" "project policy file location"
assert_contains "$skill" "exact-head green CI, zero unresolved review threads, and no requested-changes review" "default conditions without a policy file"
assert_contains "$skill" "Never hard-code a provider this file does not name." "no hard-coded providers"
assert_contains "$skill" "The local final gate must have approved this exact head before monitoring begins." "local gate precedes monitoring"
assert_contains "$skill" "Evidence belongs to one head" "exact-head evidence binding"
assert_contains "$skill" "Request each policy-named provider at most once per head" "single review request per head"
assert_contains "$skill" "fail closed on unavailable" "CI unavailable fails closed"
assert_contains "$skill" "Once every awaited provider has completed on the current head" "fix round waits for all awaited providers"
assert_contains "$skill" "judge it yourself" "monitor judges findings itself"
assert_contains "$skill" "fix what is real, inline in your own session" "monitor fixes inline"
assert_contains "$skill" "request no local review of a fix round and dispatch no fixer" "providers re-review fixes; no local gate"
assert_contains "$skill" "never on a round count or elapsed time" "no round-count handback"
assert_contains "$skill" "wait with one call" "one wait call per cycle"
assert_contains "$skill" "never poll, sleep-loop, tail logs, or emit keep-alive commands" "no polling between waits"
assert_contains "$skill" "Push all fixes as one batch" "one push per fix round"
assert_contains "$skill" "next round on the new head is the re-review" "providers re-review each push"
assert_contains "$skill" "drops out of the awaited set for that head" "fallback is per provider"
assert_contains "$skill" "Record the fallback reason" "fallback is recorded"
assert_contains "$skill" "confirm the remote PR is \`MERGED\`" "merge confirmation"
assert_contains "$skill" "The caller owns post-merge reconciliation." "reconciliation stays with caller"
assert_contains "$skill" "Do not nest another watcher." "no nested watchers"
assert_no_model_names "$skill"

assert_contains "$skill" "substantially change the design or the PR has diverged from its plan" \
  "only entangled findings escalate to the caller"
assert_contains "$skill" "the policy file decides whether a recorded fallback blocks" \
  "fallback adjudication belongs to the policy file"
assert_contains "$skill" "in the PR body before merging" \
  "fallback surfaces before the merge, not only in the return"

assert_contains "$skill" "## Chain rules" "chain rules section"
assert_contains "$skill" "**Lowest first.**" "lowest unmerged PR gets attention"
assert_contains "$skill" "**Fix in the owner.**" "findings land in the owning layer"
assert_contains "$skill" "**One topology writer.**" "only the monitor moves published branches"
assert_contains "$skill" "**Merge bottom-up.**" "merge order is bottom-up"
assert_contains "$skill" "--force-with-lease" "rebased layers are pushed with a lease"
assert_contains "$skill" "carries forward through your own fix pushes" "local gate survives the monitor's own pushes"
assert_contains "$skill" "rebases that leave \`git patch-id --verbatim\` unchanged" "only a whitespace-exact rebase carries the local gate"
assert_contains "$skill" "CI and provider reviews complete again on the new head" "provider reviews restart on every code head"
assert_contains "$skill" "gh pr edit --base" "retarget fallback after a bottom merge"
assert_contains "$skill" "Propagate upward through every PR above it, using each immediate parent's recorded old and new heads" \
  "a bottom merge propagates the rebase through every layer above"
assert_contains "$skill" "git rebase --abort" "conflicting rebase is aborted"
assert_contains "$skill" "default 20 minutes" "provider timeout default"

[ -f "$metadata" ] || { echo "not ok - committed OpenAI metadata missing" >&2; exit 1; }
grep -Fq "display_name" "$metadata" || { echo "not ok - metadata lacks display_name" >&2; exit 1; }
echo "ok - committed OpenAI metadata present"

echo "PASS"
