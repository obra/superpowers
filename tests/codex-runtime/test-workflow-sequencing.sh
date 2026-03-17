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

require_pattern skills/brainstorming/SKILL.md "**Workflow State:** Draft"
require_pattern skills/brainstorming/SKILL.md "**Spec Revision:** 1"
require_pattern skills/brainstorming/SKILL.md "**Last Reviewed By:** brainstorming"

require_pattern skills/plan-ceo-review/SKILL.md "**Workflow State:** Draft | CEO Approved"
require_pattern skills/plan-ceo-review/SKILL.md 'If any header line is missing or malformed, normalize the spec to this contract before continuing and treat it as `Draft`.'
require_pattern skills/plan-ceo-review/SKILL.md 'When approving the written spec, set `**Workflow State:** CEO Approved`'
require_pattern skills/plan-ceo-review/SKILL.md "If this review materially changes a previously approved spec, increment the revision"

require_pattern skills/writing-plans/SKILL.md 'If the spec is missing these lines, or if `**Workflow State:**` is not `CEO Approved`, stop and direct the agent to `superpowers:plan-ceo-review`.'
require_pattern skills/writing-plans/SKILL.md "**Workflow State:** Draft"
require_pattern skills/writing-plans/SKILL.md "**Source Spec:** [Exact path to approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Source Spec Revision:** [Integer copied from approved spec]"
require_pattern skills/writing-plans/SKILL.md "**Last Reviewed By:** writing-plans"

require_pattern skills/plan-eng-review/SKILL.md "**Workflow State:** Draft | Engineering Approved"
require_pattern skills/plan-eng-review/SKILL.md "**Source Spec Revision:** <integer>"
require_pattern skills/plan-eng-review/SKILL.md 'If the plan'"'"'s `**Source Spec Revision:**` does not match the latest approved spec revision, stop and direct the agent back to `superpowers:writing-plans`.'
require_pattern skills/plan-eng-review/SKILL.md 'Only write `**Workflow State:** Engineering Approved` as the last step of a successful review'
require_pattern skills/plan-eng-review/SKILL.md "The handoff must include the exact approved plan path"

require_pattern skills/using-superpowers/SKILL.md "## Superpowers Workflow Router"
require_pattern skills/using-superpowers/SKILL.md 'Spec state: `^\*\*Workflow State:\*\* (Draft|CEO Approved)$`'
require_pattern skills/using-superpowers/SKILL.md 'Plan source revision: `^\*\*Source Spec Revision:\*\* ([0-9]+)$`'
require_pattern skills/using-superpowers/SKILL.md "If artifacts are ambiguous or incomplete, route to the earlier safe stage instead of skipping ahead."

require_pattern skills/executing-plans/SKILL.md "Require the exact approved plan path as input."
require_pattern skills/executing-plans/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."
require_pattern skills/executing-plans/SKILL.md 'Workspace preparation is the user'"'"'s responsibility; `superpowers:using-git-worktrees` is optional, not automatic'
require_pattern skills/subagent-driven-development/SKILL.md "## Implementation Preflight"
require_pattern skills/subagent-driven-development/SKILL.md "Do not auto-clean the workspace and do not auto-create a worktree."

require_pattern README.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern docs/README.codex.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
require_pattern docs/README.copilot.md 'Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'

for file in \
  docs/superpowers/specs/2026-01-22-document-review-system-design.md \
  docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md \
  docs/superpowers/specs/2026-03-11-zero-dep-brainstorm-server-design.md; do
  require_pattern "$file" "**Workflow State:** CEO Approved"
  require_pattern "$file" "**Spec Revision:** 1"
  require_pattern "$file" "**Last Reviewed By:** plan-ceo-review"
done

for file in \
  docs/superpowers/plans/2026-01-22-document-review-system.md \
  docs/superpowers/plans/2026-02-19-visual-brainstorming-refactor.md \
  docs/superpowers/plans/2026-03-11-zero-dep-brainstorm-server.md; do
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
