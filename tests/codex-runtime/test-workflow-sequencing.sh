#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

require_pattern() {
  local file="$1"
  local pattern="$2"
  if ! rg -n -F -- "$pattern" "$file" >/dev/null; then
    echo "Missing workflow sequencing pattern '$pattern' in $file"
    exit 1
  fi
}

require_absent_pattern() {
  local file="$1"
  local pattern="$2"
  if rg -n -F -- "$pattern" "$file" >/dev/null; then
    echo "Unexpected workflow sequencing pattern '$pattern' in $file"
    exit 1
  fi
}

require_pattern skills/brainstorming/SKILL.md "**Workflow State:** Draft"
require_pattern skills/brainstorming/SKILL.md "**Spec Revision:** 1"
require_pattern skills/brainstorming/SKILL.md "**Last Reviewed By:** brainstorming"
require_pattern skills/brainstorming/SKILL.md "record the intended spec path with `expect`"
require_pattern skills/brainstorming/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" expect --artifact spec --path'
require_pattern skills/brainstorming/SKILL.md "runs `sync --artifact spec`"
require_pattern skills/brainstorming/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact spec --path'

require_pattern skills/plan-ceo-review/SKILL.md "**Workflow State:** Draft | CEO Approved"
require_pattern skills/plan-ceo-review/SKILL.md 'If any header line is missing or malformed, normalize the spec to this contract before continuing and treat it as `Draft`.'
require_pattern skills/plan-ceo-review/SKILL.md 'When approving the written spec, set `**Workflow State:** CEO Approved`'
require_pattern skills/plan-ceo-review/SKILL.md "If this review materially changes a previously approved spec, increment the revision"
require_pattern skills/plan-ceo-review/SKILL.md '**The terminal state is invoking writing-plans.**'
require_pattern skills/plan-ceo-review/SKILL.md 'Do not draft a plan or offer implementation options from `plan-ceo-review`.'
require_pattern skills/plan-ceo-review/SKILL.md "runs `sync --artifact spec`"
require_pattern skills/plan-ceo-review/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact spec --path'

require_pattern skills/writing-plans/SKILL.md 'If the spec is missing these lines, or if `**Workflow State:**` is not `CEO Approved`, stop and direct the agent to `superpowers:plan-ceo-review`.'
require_pattern skills/writing-plans/SKILL.md "**Workflow State:** Draft"
require_pattern skills/writing-plans/SKILL.md "**Source Spec:** [Exact path to approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Source Spec Revision:** [Integer copied from approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Last Reviewed By:** writing-plans"
require_pattern skills/writing-plans/SKILL.md "record the intended plan path with `expect`"
require_pattern skills/writing-plans/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" expect --artifact plan --path'
require_pattern skills/writing-plans/SKILL.md "runs `sync --artifact plan`"
require_pattern skills/writing-plans/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact plan --path'
require_pattern skills/writing-plans/SKILL.md "**Plan Revision:** 1"
require_pattern skills/writing-plans/SKILL.md "**Execution Mode:** none"

require_pattern skills/plan-eng-review/SKILL.md "**Workflow State:** Draft | Engineering Approved"
require_pattern skills/plan-eng-review/SKILL.md "**Source Spec Revision:** <integer>"
require_pattern skills/plan-eng-review/SKILL.md 'If the plan'"'"'s `**Source Spec Revision:**` does not match the latest approved spec revision, stop and direct the agent back to `superpowers:writing-plans`.'
require_pattern skills/plan-eng-review/SKILL.md 'Only write `**Workflow State:** Engineering Approved` as the last step of a successful review'
require_pattern skills/plan-eng-review/SKILL.md "The handoff must include the exact approved plan path"
require_pattern skills/plan-eng-review/SKILL.md 'superpowers-plan-execution recommend --plan <approved-plan-path>'
require_pattern skills/plan-eng-review/SKILL.md 'Present the helper-recommended execution skill as the default path with the approved plan path.'
require_pattern skills/plan-eng-review/SKILL.md 'If isolated-agent workflows are unavailable, do not present `superpowers:subagent-driven-development` as an available override.'
require_pattern skills/plan-eng-review/SKILL.md 'if `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`'
require_pattern skills/plan-eng-review/SKILL.md 'If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually.'
require_pattern skills/plan-eng-review/SKILL.md 'If the helper returns `status` `implementation_ready`, present the normal execution handoff below.'

require_pattern skills/using-superpowers/SKILL.md "## Superpowers Workflow Router"
require_pattern skills/using-superpowers/SKILL.md 'First, if `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`.'
require_pattern skills/using-superpowers/SKILL.md 'If the JSON result contains a non-empty `next_skill`, use that route.'
require_pattern skills/using-superpowers/SKILL.md 'If the JSON result reports `status` `implementation_ready`, proceed to the normal execution handoff using the exact approved plan path.'
require_pattern skills/using-superpowers/SKILL.md 'Choose between `superpowers:subagent-driven-development` and `superpowers:executing-plans` through the helper-backed execution recommendation contract, not a top-level isolated-agent shortcut.'
require_pattern skills/using-superpowers/SKILL.md "Only fall back to manual artifact inspection if the helper itself is unavailable or fails."
require_pattern skills/using-superpowers/SKILL.md "then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution."
require_pattern skills/using-superpowers/SKILL.md '"Fix this bug" → debugging first, then if it changes Superpowers product or workflow behavior follow the artifact-state workflow; otherwise continue to the appropriate implementation skill.'
require_pattern skills/using-superpowers/SKILL.md "For feature requests, bugfixes that materially change Superpowers product or workflow behavior, product requests, or workflow-change requests inside a Superpowers project, route by artifact state instead of skipping ahead based on the user's wording alone."
require_pattern skills/using-superpowers/SKILL.md "Do NOT jump from brainstorming straight to implementation. For workflow-routed work, every stage owns the handoff into the next one."
require_pattern skills/using-superpowers/SKILL.md 'Spec state: `^\*\*Workflow State:\*\* (Draft|CEO Approved)$`'
require_pattern skills/using-superpowers/SKILL.md 'Plan source revision: `^\*\*Source Spec Revision:\*\* ([0-9]+)$`'
require_pattern skills/using-superpowers/SKILL.md "If artifacts are ambiguous or incomplete, route to the earlier safe stage instead of skipping ahead."
require_pattern skills/using-superpowers/SKILL.md 'Plan is `Engineering Approved` and matches the latest approved spec revision: proceed to implementation through the normal execution handoff for that approved plan path.'

require_pattern skills/executing-plans/SKILL.md "Require the exact approved plan path as input."
require_pattern skills/executing-plans/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."
require_pattern skills/executing-plans/SKILL.md 'Workspace preparation is the user'"'"'s responsibility; `superpowers:using-git-worktrees` is optional, not automatic'
require_pattern skills/subagent-driven-development/SKILL.md 'calls `status --plan ...` during preflight'
require_pattern skills/subagent-driven-development/SKILL.md 'calls `begin` before starting work on a plan step'
require_pattern skills/subagent-driven-development/SKILL.md 'calls `complete` after each completed step'
require_pattern skills/subagent-driven-development/SKILL.md 'calls `note` when work is interrupted or blocked'
require_pattern skills/subagent-driven-development/SKILL.md 'The approved plan checklist is the execution progress record; do not create or maintain a separate authoritative task tracker.'
require_pattern skills/executing-plans/SKILL.md 'calls `status --plan ...` during preflight'
require_pattern skills/executing-plans/SKILL.md 'calls `begin` before starting work on a plan step'
require_pattern skills/executing-plans/SKILL.md 'calls `complete` after each completed step'
require_pattern skills/executing-plans/SKILL.md 'calls `note` when work is interrupted or blocked'
require_pattern skills/executing-plans/SKILL.md 'The approved plan checklist is the execution progress record; do not create or maintain a separate authoritative task tracker.'
require_absent_pattern skills/subagent-driven-development/SKILL.md "task-tracker checklist"
require_absent_pattern skills/subagent-driven-development/SKILL.md "Mark task complete in task tracker"
require_absent_pattern skills/executing-plans/SKILL.md "track the work in your platform's task checklist"
require_pattern skills/requesting-code-review/SKILL.md 'rejects final review if the plan has invalid execution state or required unfinished work not truthfully represented'
require_pattern skills/requesting-code-review/SKILL.md 'must fail closed when it detects a missed reopen or stale evidence, but must not call `reopen` itself'
require_pattern skills/requesting-code-review/SKILL.md 'For plan-routed final review, require the exact approved plan path from the current execution handoff or session context.'
require_pattern skills/requesting-code-review/SKILL.md 'Run `superpowers-plan-execution status --plan <approved-plan-path>` before dispatching the reviewer.'
require_pattern skills/requesting-code-review/SKILL.md 'If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state.'
require_pattern skills/requesting-code-review/SKILL.md 'Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'rejects branch-completion handoff if the approved plan is execution-dirty or malformed'
require_pattern skills/finishing-a-development-branch/SKILL.md 'must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence'
require_pattern skills/finishing-a-development-branch/SKILL.md 'If the current work was executed from an approved Superpowers plan, require the exact approved plan path from the current execution workflow context before presenting completion options.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Run `superpowers-plan-execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing.'
require_pattern skills/plan-eng-review/SKILL.md '**The terminal state is presenting the execution handoff with the approved plan path.**'
require_pattern skills/plan-eng-review/SKILL.md 'Do not start implementation inside `plan-eng-review`.'
require_pattern skills/subagent-driven-development/SKILL.md "## Implementation Preflight"
require_pattern skills/subagent-driven-development/SKILL.md "Have engineering-approved implementation plan?"
require_pattern skills/subagent-driven-development/SKILL.md "Return to using-superpowers artifact-state routing"
require_pattern skills/subagent-driven-development/SKILL.md 'Tasks mostly independent?" -> "executing-plans" [label="no - tightly coupled or better handled in one coordinator session"]'
require_pattern skills/subagent-driven-development/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."
require_pattern skills/subagent-driven-development/SKILL.md '"More tasks remain?" -> "Use superpowers:requesting-code-review for final review gate" [label="no"];'
require_pattern skills/subagent-driven-development/SKILL.md '[Announce: I'"'"'m using the requesting-code-review skill for the final review pass.]'
require_pattern skills/subagent-driven-development/SKILL.md '[Invoke superpowers:requesting-code-review]'
require_absent_pattern skills/subagent-driven-development/SKILL.md "Dispatch final code reviewer subagent for entire implementation"
require_absent_pattern skills/subagent-driven-development/SKILL.md "[Dispatch final code-reviewer]"

require_pattern README.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern docs/README.codex.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern docs/README.copilot.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md 'skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status`'
require_pattern docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md '`next_skill` is only used when non-empty'
require_pattern docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md '`implementation_ready` is a terminal status'
require_pattern docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md '`status --summary` is human-oriented'
require_pattern docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md '`reason` is the canonical diagnostic field'
require_pattern docs/superpowers/plans/2026-03-17-workflow-state-runtime.md '`$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`'
require_pattern docs/superpowers/plans/2026-03-17-workflow-state-runtime.md 'If the helper returns a non-empty `next_skill`, use that route.'
require_pattern docs/superpowers/plans/2026-03-17-workflow-state-runtime.md 'If the helper returns `status` `implementation_ready`, present the normal execution handoff.'
require_pattern docs/superpowers/plans/2026-03-17-workflow-state-runtime.md '`status --summary` is human-oriented'
require_pattern docs/superpowers/plans/2026-03-17-workflow-state-runtime.md '`reason` is the canonical diagnostic field'
require_pattern skills/requesting-code-review/code-reviewer.md '**Approved plan path:** {APPROVED_PLAN_PATH}'
require_pattern skills/requesting-code-review/code-reviewer.md '**Execution evidence path:** {EXECUTION_EVIDENCE_PATH}'
require_pattern skills/requesting-code-review/code-reviewer.md 'When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced.'

WORKFLOW_FIXTURE_DIR="tests/codex-runtime/fixtures/workflow-artifacts"

for file in \
  "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design.md" \
  "$WORKFLOW_FIXTURE_DIR/specs/2026-02-19-visual-brainstorming-refactor-design.md" \
  "$WORKFLOW_FIXTURE_DIR/specs/2026-03-11-zero-dep-brainstorm-server-design.md"; do
  require_pattern "$file" "**Workflow State:** CEO Approved"
  require_pattern "$file" "**Spec Revision:** 1"
  require_pattern "$file" "**Last Reviewed By:** plan-ceo-review"
done

for file in \
  "$WORKFLOW_FIXTURE_DIR/plans/2026-01-22-document-review-system.md" \
  "$WORKFLOW_FIXTURE_DIR/plans/2026-02-19-visual-brainstorming-refactor.md" \
  "$WORKFLOW_FIXTURE_DIR/plans/2026-03-11-zero-dep-brainstorm-server.md"; do
  require_pattern "$file" "**Workflow State:** Engineering Approved"
  require_pattern "$file" "**Source Spec:**"
  require_pattern "$file" "**Source Spec Revision:** 1"
  require_pattern "$file" "**Last Reviewed By:** plan-eng-review"
done

if rg -n -F "created by brainstorming skill" skills/writing-plans/SKILL.md skills/writing-plans/SKILL.md.tmpl >/dev/null; then
  echo "writing-plans should not attribute worktree creation to brainstorming."
  exit 1
fi

if rg -n -F 'During implementation, `using-git-worktrees` prepares the isolated workspace' README.md docs/README.codex.md docs/README.copilot.md >/dev/null; then
  echo "Implementation docs should not treat using-git-worktrees as part of the enforced pipeline."
  exit 1
fi

if rg -n -F -- "- **superpowers:using-git-worktrees** - REQUIRED" skills/executing-plans/SKILL.md skills/executing-plans/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md skills/subagent-driven-development/SKILL.md.tmpl >/dev/null; then
  echo "Execution skills should not require using-git-worktrees."
  exit 1
fi

echo "Workflow sequencing and fail-closed routing contracts are present."
