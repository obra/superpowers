#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/delivery/SKILL.md"
lifecycle="$repo_root/skills/delivery/branch-lifecycle.md"
metadata="$repo_root/skills/delivery/agents/openai.yaml"
workflow="$repo_root/docs/WORKFLOW.md"
routing="$repo_root/skills/agent-routing/SKILL.md"
monitor="$repo_root/skills/pr-monitor/SKILL.md"
plans="$repo_root/skills/writing-plans/SKILL.md"

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

assert_before() {
  local file=$1 first=$2 second=$3 description=$4
  local first_line second_line
  first_line=$(grep -Fn -- "$first" "$file" | head -1 | cut -d: -f1)
  second_line=$(grep -Fn -- "$second" "$file" | head -1 | cut -d: -f1)
  if [[ -z "$first_line" || -z "$second_line" || "$first_line" -ge "$second_line" ]]; then
    echo "not ok - $description" >&2
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

[[ -f "$skill" ]] || { echo "not ok - delivery skill missing: $skill" >&2; exit 1; }
[[ -f "$workflow" ]] || { echo "not ok - workflow document missing: $workflow" >&2; exit 1; }

assert_contains "$skill" "name: delivery" "frontmatter name"
assert_contains "$skill" "Use when an approved implementation plan is ready to be implemented and shipped" "approved-plan trigger"
assert_contains "$skill" "one branch, one PR" "one PR per boundary"
assert_not_contains "$skill" '## Agent Routing' "plans carry no routing section"
assert_contains "$plans" "The plan decides contracts, risks, and scope" "plans hold decisions, not code"
assert_contains "$skill" "session agent remains the orchestrator" "plan cannot route orchestrator"
assert_contains "$skill" "toolbelt:using-git-worktrees" "isolated worktree handoff"
assert_before "$skill" "fetch its remote head" "toolbelt:using-git-worktrees" \
  "the source ref is chosen before the worktree is created"
assert_contains "$skill" "toolbelt:subagent-driven-development" "SDD handoff"
assert_contains "$skill" "ux-gate" "conditional UX gate"
assert_contains "$skill" "UI smoke of the touched pathway" "implementer owns its task's smoke pass"
assert_contains "$skill" "Boundary UX capture" "gate operator owns boundary capture"
assert_contains "$skill" "SDD's final review is the boundary's gate" "SDD final review is the slice gate"
assert_contains "$monitor" "toolbelt:finishing-a-development-branch" "monitor runs branch completion"
assert_contains "$skill" "pr-monitor" "PR monitor handoff"
assert_contains "$skill" "starts its monitor in the background" "background monitoring is allowed"
assert_contains "$skill" "<plan-slug>/pr-<N>" "boundary branch naming"
assert_contains "$lifecycle" "Boundary <N>: branch" "ledger line per boundary"
assert_contains "$skill" "exactly one pr-monitor" "one monitor per chain"
assert_contains "$lifecycle" "Ownership follows publication" "rebase ownership rule"
assert_contains "$lifecycle" "Boundary <N>: rebased" "ledger line per rebase"
assert_contains "$skill" "Never report the work complete or end the session while a monitor runs" "monitor is never orphaned"
assert_contains "$lifecycle" "rebase before the boundary's final review" "rebase precedes the final review"
assert_contains "$skill" "reconcile the issue tracker only when the plan is linked to one" "optional issue-tracker reconciliation"
assert_contains "$lifecycle" "git worktree remove <path>" "post-merge cleanup"
assert_before "$skill" "ux-gate" "SDD's final review is the boundary's gate" "UX runs before broad final review"
assert_before "$skill" "SDD's final review is the boundary's gate" "toolbelt:pr-monitor" "review precedes PR completion"
assert_not_contains "$skill" "workstack-slice-gate" "no replacement slice-gate skill"
assert_not_contains "$skill" "no stacked branches" "stacked branches are no longer forbidden"
assert_not_contains "$skill" "At most one PR" "no single-monitor cap"
assert_not_contains "$skill" "progress ledger" "no delivery ledger state machine"
assert_no_model_names "$skill"

[[ -f "$metadata" ]] || { echo "not ok - committed OpenAI metadata missing" >&2; exit 1; }
assert_contains "$metadata" "display_name" "committed OpenAI metadata present"

assert_contains "$routing" "Plans carry no routing" "routing lives only in the routing text"
assert_contains "$routing" "never overrides the current routing text" "ledger routes are audit metadata"
assert_contains "$routing" "the routing text overrides the bundled default" "routing documents public precedence"

assert_contains "$workflow" '`brainstorming` and `writing-plans`' "planning policy"
assert_contains "$workflow" "one coherent delivery slice" "slice policy"
assert_contains "$workflow" "plans carry no routing" "workflow routes only from the routing text"
assert_contains "$workflow" "implementation report and review-package path" "controller context discipline"
assert_contains "$workflow" "never reports, reviews, diffs, or logs" "controller avoids duplicate review context"
assert_contains "$workflow" "No separate resume state machine" "recovery avoids resume machinery"
assert_contains "$workflow" "one pr-monitor per chain" "workflow documents one monitor per chain"
assert_not_contains "$workflow" "workstack-resume" "workflow does not revive resume skill"

assert_contains "$plans" "must not edit the same files: make them one PR or chain them" \
  "independent boundaries never share files"
assert_contains "$skill" "is not grounds to start a second one" \
  "a dead-looking monitor does not justify a second owner"
assert_contains "$skill" "check that state directly" \
  "external state is checked before re-dispatch"
assert_contains "$skill" "never commit ancestry" \
  "squash merges are not confirmed from ancestry"
assert_contains "$repo_root/skills/orchestrating/SKILL.md" "act on its final message, not a notice that it finished" \
  "terminality is verified, not inferred from a completion notification"

echo "PASS"
