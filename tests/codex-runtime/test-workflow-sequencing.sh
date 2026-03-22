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

require_description_pattern() {
  local file="$1"
  local pattern="$2"
  if ! sed -n '1,6p' "$file" | rg -n -F -- "$pattern" >/dev/null; then
    echo "Missing workflow description pattern '$pattern' in $file"
    exit 1
  fi
}

require_description_absent_pattern() {
  local file="$1"
  local pattern="$2"
  if sed -n '1,6p' "$file" | rg -n -F -- "$pattern" >/dev/null; then
    echo "Unexpected workflow description pattern '$pattern' in $file"
    exit 1
  fi
}

require_pattern skills/brainstorming/SKILL.md "**Workflow State:** Draft"
require_pattern skills/brainstorming/SKILL.md "**Spec Revision:** 1"
require_pattern skills/brainstorming/SKILL.md "**Last Reviewed By:** brainstorming"
require_description_pattern skills/brainstorming/SKILL.md "exploring a feature idea, behavior change, or architecture direction"
require_pattern skills/brainstorming/SKILL.md "record the intended spec path with `expect`"
require_pattern skills/brainstorming/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" expect --artifact spec --path'
require_pattern skills/brainstorming/SKILL.md "runs `sync --artifact spec`"
require_pattern skills/brainstorming/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact spec --path'
require_pattern skills/brainstorming/SKILL.md "problem statement"
require_pattern skills/brainstorming/SKILL.md "failure and edge-case behavior"
require_pattern skills/brainstorming/SKILL.md "observability expectations"
require_pattern skills/brainstorming/SKILL.md "rollout and rollback expectations"
require_pattern skills/brainstorming/SKILL.md "testable acceptance criteria"
require_pattern skills/brainstorming/SKILL.md "Landscape Awareness"
require_pattern skills/brainstorming/SKILL.md "If the work is sensitive or stealthy, ask one explicit permission question before any external search"
require_pattern skills/brainstorming/SKILL.md "## Landscape Snapshot"
require_pattern skills/brainstorming/SKILL.md "### Decision impact"
require_pattern skills/brainstorming/SKILL.md 'superpowers-repo-safety check --intent write'
require_pattern skills/brainstorming/SKILL.md 'superpowers-repo-safety approve --stage'

require_description_pattern skills/using-superpowers/SKILL.md "deciding which skill or workflow stage applies"
require_description_pattern skills/systematic-debugging/SKILL.md "investigating a bug, regression, test failure, or unexpected behavior"
require_pattern skills/systematic-debugging/SKILL.md "Phase 2.5: External Pattern Search"
require_pattern skills/systematic-debugging/SKILL.md "Phase 3.2b: Search Escalation on failed hypothesis"
require_pattern skills/systematic-debugging/SKILL.md "treat results as candidate hypotheses, not conclusions"
require_description_pattern skills/document-release/SKILL.md "release notes, changelog, TODO, or handoff documentation"
require_description_pattern skills/qa-only/SKILL.md "browser-based QA, repro steps, screenshots, evidence, and reports"

require_pattern skills/plan-ceo-review/SKILL.md "**Workflow State:** Draft | CEO Approved"
require_description_pattern skills/plan-ceo-review/SKILL.md "written Superpowers design or architecture spec"
require_pattern skills/plan-ceo-review/SKILL.md 'If any header line is missing or malformed, normalize the spec to this contract before continuing and treat it as `Draft`.'
require_pattern skills/plan-ceo-review/SKILL.md 'When approving the written spec, set `**Workflow State:** CEO Approved`'
require_pattern skills/plan-ceo-review/SKILL.md "If this review materially changes a previously approved spec, increment the revision"
require_pattern skills/plan-ceo-review/SKILL.md '**The terminal state is invoking writing-plans.**'
require_pattern skills/plan-ceo-review/SKILL.md 'Do not draft a plan or offer implementation options from `plan-ceo-review`.'
require_pattern skills/plan-ceo-review/SKILL.md "runs `sync --artifact spec`"
require_pattern skills/plan-ceo-review/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact spec --path'
require_pattern skills/plan-ceo-review/SKILL.md "Gate A checklist"
require_pattern skills/plan-ceo-review/SKILL.md "explicit failure-mode thinking"
require_pattern skills/plan-ceo-review/SKILL.md "rollout and rollback expectations"
require_pattern skills/plan-ceo-review/SKILL.md "testable acceptance criteria"
require_pattern skills/plan-ceo-review/SKILL.md 'Accelerated review is available only when the user explicitly requests `accelerated` or `accelerator` mode for the current CEO review.'
require_pattern skills/plan-ceo-review/SKILL.md 'Do not activate accelerated review from heuristics, vague wording like "make this fast", saved preferences, or agent-only judgment.'
require_pattern skills/plan-ceo-review/SKILL.md 'Accelerated CEO review must process one canonical CEO section at a time through a section packet and explicit human section approval.'
require_pattern skills/plan-ceo-review/SKILL.md 'Use `skills/plan-ceo-review/accelerated-reviewer-prompt.md` when briefing the accelerated CEO reviewer subagent.'
require_pattern skills/plan-ceo-review/SKILL.md 'That reviewer prompt, together with `review/review-accelerator-packet-contract.md`, defines the required section-packet schema and keeps the reviewer limited to draft-only output.'
require_pattern skills/plan-ceo-review/SKILL.md 'In accelerated review, keep routine issues bundled inside the section packet. Break out only escalated high-judgment issues into direct human questions before section approval.'
require_pattern skills/plan-ceo-review/SKILL.md '* **Normal review:** one issue = one interactive user question. In accelerated review, this rule applies only to escalated high-judgment issues; routine issues may stay in the section packet.'
require_pattern skills/plan-ceo-review/SKILL.md 'Only the main review agent may write authoritative artifacts, apply approved patches, or change approval headers in accelerated CEO review.'
require_pattern skills/plan-ceo-review/SKILL.md 'Persist accelerated CEO section packets under `~/.superpowers/projects/<slug>/...`.'
require_pattern skills/plan-ceo-review/SKILL.md 'Resume accelerated CEO review only from the last approved-and-applied section boundary.'
require_pattern skills/plan-ceo-review/SKILL.md 'If the source artifact fingerprint changes, treat saved accelerated CEO packets as stale and regenerate them before reuse.'
require_pattern skills/plan-ceo-review/SKILL.md 'Accelerated CEO review must preserve required review outputs, including individual TODO and delight questions when they must remain human-owned.'
require_pattern skills/plan-ceo-review/SKILL.md 'Accelerator artifacts must use bounded retention rather than accumulate indefinitely.'
require_pattern skills/plan-ceo-review/SKILL.md 'Pre-Step 0: Landscape Check'
require_pattern skills/plan-ceo-review/SKILL.md "reuse the spec's \`Landscape Snapshot\` when it exists and is still relevant"
require_pattern skills/plan-ceo-review/SKILL.md 'If the refreshed Landscape Check materially changes the approved reasoning, update the spec'"'"'s `Landscape Snapshot` and `Decision impact` before approval'
require_pattern skills/plan-ceo-review/SKILL.md 'superpowers-repo-safety check --intent write'

require_pattern skills/writing-plans/SKILL.md 'If the spec is missing these lines, or if `**Workflow State:**` is not `CEO Approved`, stop and direct the agent to `superpowers:plan-ceo-review`.'
require_pattern skills/writing-plans/SKILL.md "**Workflow State:** Draft"
require_pattern skills/writing-plans/SKILL.md "**Source Spec:** [Exact path to approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Source Spec Revision:** [Integer copied from approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Last Reviewed By:** writing-plans"
require_description_pattern skills/writing-plans/SKILL.md "need to write the implementation plan"
require_pattern skills/writing-plans/SKILL.md "record the intended plan path with `expect`"
require_pattern skills/writing-plans/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" expect --artifact plan --path'
require_pattern skills/writing-plans/SKILL.md "runs `sync --artifact plan`"
require_pattern skills/writing-plans/SKILL.md '"$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status" sync --artifact plan --path'
require_pattern skills/writing-plans/SKILL.md "**Plan Revision:** 1"
require_pattern skills/writing-plans/SKILL.md "**Execution Mode:** none"
require_pattern skills/writing-plans/SKILL.md "preconditions"
require_pattern skills/writing-plans/SKILL.md "validation strategy"
require_pattern skills/writing-plans/SKILL.md "evidence expectations"
require_pattern skills/writing-plans/SKILL.md "rollout plan"
require_pattern skills/writing-plans/SKILL.md "rollback plan"
require_pattern skills/writing-plans/SKILL.md "risks and mitigations"
require_pattern skills/writing-plans/SKILL.md "## Existing Capabilities / Built-ins to Reuse"
require_pattern skills/writing-plans/SKILL.md "## Known Footguns / Constraints"
require_pattern skills/writing-plans/SKILL.md 'pull from the approved spec'"'"'s `Landscape Snapshot` when present'
require_pattern skills/writing-plans/SKILL.md "Do not make fresh search the default here."

require_pattern skills/plan-eng-review/SKILL.md "**Workflow State:** Draft | Engineering Approved"
require_pattern skills/plan-eng-review/SKILL.md "**Source Spec Revision:** <integer>"
require_pattern skills/plan-eng-review/SKILL.md 'Read the source spec named in `**Source Spec:**` and confirm both the path and revision match the latest approved spec before approving execution.'
require_pattern skills/plan-eng-review/SKILL.md 'Keep the plan in `Draft` while review issues remain open or while the source spec path or revision is stale.'
require_pattern skills/plan-eng-review/SKILL.md 'If the plan'"'"'s `**Source Spec:**` path or `**Source Spec Revision:**` does not match the latest approved spec, stop and direct the agent back to `superpowers:writing-plans`.'
require_pattern skills/plan-eng-review/SKILL.md 'Only write `**Workflow State:** Engineering Approved` as the last step of a successful review'
require_pattern skills/plan-eng-review/SKILL.md "The handoff must include the exact approved plan path"
require_pattern skills/plan-eng-review/SKILL.md 'superpowers-plan-execution recommend --plan <approved-plan-path>'
require_pattern skills/plan-eng-review/SKILL.md 'Present the helper-recommended execution skill as the default path with the approved plan path.'
require_pattern skills/plan-eng-review/SKILL.md 'If isolated-agent workflows are unavailable, do not present `superpowers:subagent-driven-development` as an available override.'
require_pattern skills/plan-eng-review/SKILL.md 'if `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`'
require_pattern skills/plan-eng-review/SKILL.md 'If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually.'
require_pattern skills/plan-eng-review/SKILL.md 'If the helper returns `status` `implementation_ready`, present the normal execution handoff below.'
require_pattern skills/plan-eng-review/SKILL.md "Step 0.4: Search Check"
require_pattern skills/plan-eng-review/SKILL.md "Does the framework, runtime, or platform already provide a built-in?"
require_pattern skills/plan-eng-review/SKILL.md "Is the chosen pattern still considered current best practice?"
require_pattern skills/plan-eng-review/SKILL.md "What are the known footguns or failure modes?"
require_pattern skills/plan-eng-review/SKILL.md "[Layer 1]"
require_pattern skills/plan-eng-review/SKILL.md "[Layer 2]"
require_pattern skills/plan-eng-review/SKILL.md "[Layer 3]"
require_pattern skills/plan-eng-review/SKILL.md "[EUREKA]"
require_pattern skills/plan-eng-review/SKILL.md "ordered implementation steps"
require_pattern skills/plan-eng-review/SKILL.md "documentation update expectations"
require_pattern skills/plan-eng-review/SKILL.md "evidence expectations"
require_pattern skills/plan-eng-review/SKILL.md "explicit risks"
require_pattern skills/plan-eng-review/SKILL.md "web/UI: user flow, navigation impact"
require_pattern skills/plan-eng-review/SKILL.md "API/service/backend: request/response contracts"
require_pattern skills/plan-eng-review/SKILL.md "data/ETL: schema evolution"
require_pattern skills/plan-eng-review/SKILL.md "infrastructure/IaC: blast radius"
require_pattern skills/plan-eng-review/SKILL.md "library/SDK: public API changes"
require_pattern skills/plan-eng-review/SKILL.md 'Accelerated review is available only when the user explicitly requests `accelerated` or `accelerator` mode for the current engineering review.'
require_pattern skills/plan-eng-review/SKILL.md 'Do not activate accelerated review from heuristics, vague wording like "make this fast", saved preferences, or agent-only judgment.'
require_pattern skills/plan-eng-review/SKILL.md 'Use `skills/plan-eng-review/accelerated-reviewer-prompt.md` when briefing the accelerated engineering reviewer subagent.'
require_pattern skills/plan-eng-review/SKILL.md 'That reviewer prompt, together with `review/review-accelerator-packet-contract.md`, defines the required section-packet schema and keeps the reviewer limited to draft-only output.'
require_pattern skills/plan-eng-review/SKILL.md 'Accelerated engineering review must process one canonical ENG section at a time through a section packet and explicit human section approval.'
require_pattern skills/plan-eng-review/SKILL.md 'Accelerated ENG `SMALL CHANGE` review must still limit the reviewer to one primary issue per canonical section and may not collapse into one bundled approval round.'
require_pattern skills/plan-eng-review/SKILL.md 'In accelerated review, keep routine issues bundled inside the section packet. Break out only escalated high-judgment issues into direct human questions before section approval.'
require_pattern skills/plan-eng-review/SKILL.md 'Persist accelerated engineering section packets under `~/.superpowers/projects/<slug>/...`.'
require_pattern skills/plan-eng-review/SKILL.md 'In accelerated review, `SMALL CHANGE` still uses canonical section packets and per-section approvals; only reviewer depth stays compressed.'
require_pattern skills/plan-eng-review/SKILL.md 'In normal non-accelerated `SMALL CHANGE` mode, batch one issue per section into a single interactive user question round at the end, but each issue in that batch still requires its own recommendation, WHY, and lettered options. Accelerated `SMALL CHANGE` does not use this bundled round.'
require_pattern skills/plan-eng-review/SKILL.md '* **Normal review:** one issue = one interactive user question. In accelerated review, this rule applies only to escalated high-judgment issues; routine issues may stay in the section packet.'
require_pattern skills/plan-eng-review/SKILL.md 'Accelerated engineering review must preserve QA handoff generation, TODO flow, failure-mode output, and the normal execution handoff.'
require_pattern skills/plan-eng-review/SKILL.md 'Only the main review agent may write authoritative artifacts, apply approved patches, or change approval headers in accelerated engineering review.'
require_pattern skills/plan-eng-review/SKILL.md 'Resume accelerated engineering review only from the last approved-and-applied section boundary.'
require_pattern skills/plan-eng-review/SKILL.md 'If the source artifact fingerprint changes, treat saved accelerated ENG packets as stale and regenerate them before reuse.'
require_pattern skills/plan-eng-review/SKILL.md 'Accelerator artifacts must use bounded retention rather than accumulate indefinitely.'

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
require_pattern skills/using-superpowers/SKILL.md 'Plan is `Engineering Approved` but its `Source Spec:` path or `Source Spec Revision:` does not match the latest approved spec: invoke `superpowers:writing-plans`.'
require_pattern skills/using-superpowers/SKILL.md 'Plan is `Engineering Approved` and its `Source Spec:` path plus `Source Spec Revision:` match the latest approved spec: proceed to implementation through the normal execution handoff for that approved plan path.'

require_pattern skills/executing-plans/SKILL.md "Require the exact approved plan path as input."
require_pattern skills/executing-plans/SKILL.md 'default protected branch (`main`, `master`, `dev`, or `develop`)'
require_pattern skills/executing-plans/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."
require_pattern skills/executing-plans/SKILL.md "The later repo-safety checks still govern any additional protected branches declared through repo or user instructions."
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
require_description_pattern skills/requesting-code-review/SKILL.md 'Use after implementation work or a completed plan/task slice'
require_pattern skills/requesting-code-review/SKILL.md 'For plan-routed final review, require the exact approved plan path from the current execution handoff or session context.'
require_pattern skills/requesting-code-review/SKILL.md 'Run `superpowers-plan-execution status --plan <approved-plan-path>` before dispatching the reviewer.'
require_pattern skills/requesting-code-review/SKILL.md 'If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state.'
require_pattern skills/requesting-code-review/SKILL.md 'Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context.'
require_pattern skills/requesting-code-review/SKILL.md 'built-in-before-bespoke'
require_pattern skills/requesting-code-review/SKILL.md 'known ecosystem footguns'
require_description_absent_pattern skills/requesting-code-review/SKILL.md 'implementing major features'
require_pattern skills/receiving-code-review/SKILL.md 'novel rewrite, unfamiliar framework pattern, or a "best practice" that does not match repo reality'
require_pattern skills/receiving-code-review/SKILL.md 'do a quick capability or landscape check before implementing it'
require_pattern skills/finishing-a-development-branch/SKILL.md 'rejects branch-completion handoff if the approved plan is execution-dirty or malformed'
require_pattern skills/finishing-a-development-branch/SKILL.md 'must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence'
require_description_pattern skills/finishing-a-development-branch/SKILL.md 'verification passes'
require_pattern skills/finishing-a-development-branch/SKILL.md 'If the current work was executed from an approved Superpowers plan, require the exact approved plan path from the current execution workflow context before presenting completion options.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Run `superpowers-plan-execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing.'
require_pattern skills/plan-eng-review/SKILL.md '**The terminal state is presenting the execution handoff with the approved plan path.**'
require_pattern skills/plan-eng-review/SKILL.md 'Do not start implementation inside `plan-eng-review`.'
require_pattern skills/subagent-driven-development/SKILL.md "## Implementation Preflight"
require_pattern skills/subagent-driven-development/SKILL.md "Have engineering-approved implementation plan?"
require_pattern skills/subagent-driven-development/SKILL.md "Return to using-superpowers artifact-state routing"
require_pattern skills/subagent-driven-development/SKILL.md 'default protected branch (`main`, `master`, `dev`, or `develop`)'
require_pattern skills/subagent-driven-development/SKILL.md "The later repo-safety checks still govern any additional protected branches declared through repo or user instructions."
require_pattern skills/subagent-driven-development/SKILL.md 'Tasks mostly independent?" -> "executing-plans" [label="no - tightly coupled or better handled in one coordinator session"]'
require_pattern skills/subagent-driven-development/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."
require_pattern skills/subagent-driven-development/SKILL.md '"More tasks remain?" -> "Use superpowers:requesting-code-review for final review gate" [label="no"];'
require_pattern skills/subagent-driven-development/SKILL.md '[Announce: I'"'"'m using the requesting-code-review skill for the final review pass.]'
require_pattern skills/subagent-driven-development/SKILL.md '[Invoke superpowers:requesting-code-review]'
require_absent_pattern skills/subagent-driven-development/SKILL.md "Dispatch final code reviewer subagent for entire implementation"
require_absent_pattern skills/subagent-driven-development/SKILL.md "[Dispatch final code-reviewer]"

require_pattern README.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern README.md 'Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.'
require_pattern README.md 'User explicitly requests<br/>accelerated / accelerator mode?'
require_pattern README.md 'Accelerated CEO review inside the skill:'
require_pattern README.md 'Accelerated ENG review inside the skill:'
require_pattern README.md 'reviewer subagent drafts per-section packets<br/>human approves each section<br/>QA handoff and final approval still apply'
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
require_absent_pattern skills/plan-ceo-review/SKILL.md '**STOP.** Use one interactive user question per issue. Do NOT batch.'
require_absent_pattern skills/plan-eng-review/SKILL.md '**STOP.** For each issue found in this section, use one interactive user question individually. One issue per question.'

for file in \
  skills/plan-ceo-review/SKILL.md \
  skills/writing-plans/SKILL.md \
  skills/plan-eng-review/SKILL.md \
  skills/executing-plans/SKILL.md \
  skills/subagent-driven-development/SKILL.md \
  skills/requesting-code-review/SKILL.md \
  skills/finishing-a-development-branch/SKILL.md; do
  require_description_absent_pattern "$file" "implement this"
  require_description_absent_pattern "$file" "start coding"
  require_description_absent_pattern "$file" "build this"
  require_description_absent_pattern "$file" "plan this feature"
done

WORKFLOW_FIXTURE_DIR="tests/codex-runtime/fixtures/workflow-artifacts"

for file in \
  "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design.md" \
  "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design-v2.md" \
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

STALE_PATH_PLAN="$WORKFLOW_FIXTURE_DIR/plans/2026-01-22-document-review-system-stale-path.md"
require_pattern "$STALE_PATH_PLAN" "**Workflow State:** Engineering Approved"
require_pattern "$STALE_PATH_PLAN" '**Source Spec:** `tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-01-22-document-review-system-design.md`'
require_pattern "$STALE_PATH_PLAN" "**Source Spec Revision:** 1"
require_pattern "$STALE_PATH_PLAN" "**Last Reviewed By:** plan-eng-review"

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
