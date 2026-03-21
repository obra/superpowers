#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

require_pattern() {
  local file="$1"
  local pattern="$2"
  if ! rg -n -F -- "$pattern" "$file" >/dev/null; then
    echo "Missing pattern '$pattern' in $file"
    exit 1
  fi
}

require_absent_pattern() {
  local file="$1"
  local pattern="$2"
  if rg -n -F -- "$pattern" "$file" >/dev/null; then
    echo "Unexpected pattern '$pattern' in $file"
    exit 1
  fi
}

for file in \
  review/checklist.md \
  qa/references/issue-taxonomy.md \
  qa/templates/qa-report-template.md \
  skills/document-release/SKILL.md \
  skills/document-release/SKILL.md.tmpl \
  skills/qa-only/SKILL.md \
  skills/qa-only/SKILL.md.tmpl; do
  [[ -f "$file" ]] || {
    echo "Expected workflow enhancement file to exist: $file"
    exit 1
  }
done

require_pattern review/checklist.md "Pre-Landing Review Checklist"
require_pattern review/checklist.md "SQL & Data Safety"
require_pattern review/checklist.md "Enum & Value Completeness"
require_pattern review/checklist.md "Documentation Staleness"
require_pattern review/checklist.md "TODO Cross-Reference"
require_pattern review/checklist.md "Built-in Before Bespoke / Known Pattern Footguns"
require_pattern review/checklist.md "custom auth or session handling that bypasses framework protections"
require_pattern review/checklist.md "custom retry, debounce, cache, queue, or state logic where the platform already offers a stable primitive"
require_pattern review/checklist.md "well-known failure modes in the current ecosystem"

for file in agents/code-reviewer.instructions.md agents/code-reviewer.md .codex/agents/code-reviewer.toml; do
  require_pattern "$file" "review/checklist.md"
  require_pattern "$file" "base branch"
  require_pattern "$file" "TODO cross-reference"
  require_pattern "$file" "Documentation staleness"
  require_pattern "$file" "Never search secrets, customer data, unsanitized stack traces, private URLs, or internal codenames"
  require_pattern "$file" "If search is unavailable, disallowed, or unsafe, say so and continue the review with the diff, checklist, plan, and repo-local evidence only"
done

require_pattern skills/requesting-code-review/SKILL.md "review checklist"
require_pattern skills/requesting-code-review/SKILL.md "{BASE_BRANCH}"
require_pattern skills/requesting-code-review/code-reviewer.md "{BASE_BRANCH}"
require_pattern skills/requesting-code-review/code-reviewer.md "built-in-before-bespoke"
require_pattern skills/requesting-code-review/code-reviewer.md "known pattern footguns"
require_pattern skills/requesting-code-review/code-reviewer.md "official documentation"
require_pattern skills/requesting-code-review/code-reviewer.md "issue trackers or maintainer guidance"
require_pattern skills/requesting-code-review/code-reviewer.md "primary-source technical references"
require_pattern skills/requesting-code-review/code-reviewer.md "Only fall back to secondary technical references when primary sources are absent or clearly insufficient for the specific review question"
require_pattern skills/requesting-code-review/code-reviewer.md "file:line"
require_pattern skills/requesting-code-review/code-reviewer.md "Never search secrets, customer data, unsanitized stack traces, private URLs, or internal codenames"
require_pattern skills/requesting-code-review/code-reviewer.md "If search is unavailable, disallowed, or unsafe, say so and continue the review with the diff, checklist, plan, and repo-local evidence only"
require_pattern skills/subagent-driven-development/code-quality-reviewer-prompt.md "BASE_BRANCH"

require_pattern skills/plan-eng-review/SKILL.md '$_SP_STATE_DIR/projects'
require_pattern skills/plan-eng-review/SKILL.md "test-plan"
require_pattern skills/plan-eng-review/SKILL.md 'This file is consumed by `superpowers:qa-only`'
require_pattern skills/plan-eng-review/SKILL.md "**Workflow State:** Draft | Engineering Approved"
require_pattern skills/plan-eng-review/SKILL.md "**Source Spec Revision:** <integer>"
require_pattern skills/plan-eng-review/SKILL.md 'bin/superpowers-slug'
require_pattern skills/plan-ceo-review/SKILL.md 'BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName'
require_pattern skills/plan-ceo-review/SKILL.md "**Workflow State:** Draft | CEO Approved"

require_pattern skills/qa-only/SKILL.md "playwright"
require_pattern skills/qa-only/SKILL.md "diff-aware"
require_pattern skills/qa-only/SKILL.md "Health Score"
require_pattern skills/qa-only/SKILL.md '$_SP_STATE_DIR/projects'
require_pattern skills/qa-only/SKILL.md "qa-report"
require_pattern skills/qa-only/SKILL.md 'REPORT_DIR="${QA_OUTPUT_DIR:-.superpowers/qa-reports}"'
require_pattern skills/qa-only/SKILL.md 'origin/$BASE_BRANCH...HEAD'
require_pattern skills/qa-only/SKILL.md '| Tier | Standard | `Standard`, `Exhaustive` |'
require_pattern skills/qa-only/SKILL.md '| Mode | full | `--quick`, `--regression <baseline>` |'
require_pattern skills/qa-only/SKILL.md 'bin/superpowers-slug'
require_pattern skills/qa-only/SKILL.md 'PLAN_ARTIFACT=$(ls -t'
require_pattern skills/qa-only/SKILL.md '*-"$BRANCH"-test-plan-*.md'
require_pattern skills/qa-only/SKILL.md 'Known ecosystem issue lookup (optional)'
require_pattern skills/qa-only/SKILL.md 'label the result as a hypothesis, not a fix'
require_pattern skills/qa-only/SKILL.md 'do not block the report if search is unavailable'

require_pattern skills/document-release/SKILL.md "CHANGELOG"
require_pattern skills/document-release/SKILL.md "NEVER CLOBBER CHANGELOG ENTRIES"
require_pattern skills/document-release/SKILL.md "discoverability"
require_pattern skills/document-release/SKILL.md "TODOS.md"
require_pattern skills/document-release/SKILL.md "RELEASE-NOTES.md"
require_pattern skills/document-release/SKILL.md 'BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName'
require_pattern skills/document-release/SKILL.md 'origin/$BASE_BRANCH...HEAD'
require_pattern skills/document-release/SKILL.md "release-readiness"
require_pattern skills/document-release/SKILL.md "rollout notes"
require_pattern skills/document-release/SKILL.md "rollback notes"
require_pattern skills/document-release/SKILL.md "known risks or operator-facing caveats"
require_pattern skills/document-release/SKILL.md "monitoring or verification expectations"

require_pattern skills/finishing-a-development-branch/SKILL.md "gh pr view --json baseRefName -q .baseRefName"
require_pattern skills/finishing-a-development-branch/SKILL.md "gh repo view --json defaultBranchRef -q .defaultBranchRef.name"
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:requesting-code-review'
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:qa-only'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Verify tests → Run required pre-completion gates → Present options → Execute choice → Clean up.'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Conditional Pre-Landing QA Gate'
require_pattern skills/finishing-a-development-branch/SKILL.md 'test-plan'
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:document-release'
require_pattern skills/finishing-a-development-branch/SKILL.md 'FEATURE_WORKTREE=$(git worktree list --porcelain'
require_pattern skills/finishing-a-development-branch/SKILL.md "RELEASE-NOTES.md"
require_pattern skills/finishing-a-development-branch/SKILL.md 'bin/superpowers-slug'
require_pattern skills/finishing-a-development-branch/SKILL.md 'require the `document-release` pass'
require_pattern skills/finishing-a-development-branch/SKILL.md 'For workflow-routed work, if the repo has release-facing docs or metadata'
require_pattern skills/finishing-a-development-branch/SKILL.md 'For ad-hoc or non-workflow-routed work, keep `document-release` available as an optional cleanup pass'
require_pattern skills/finishing-a-development-branch/SKILL.md "Gate F-style"
require_pattern skills/finishing-a-development-branch/SKILL.md "documentation has been refreshed"
require_pattern skills/finishing-a-development-branch/SKILL.md "release notes or equivalent release-history updates are ready"
require_pattern skills/finishing-a-development-branch/SKILL.md "**If tests pass:** Continue to Step 1.5."
require_pattern skills/finishing-a-development-branch/SKILL.md "When browser QA is warranted by the change type or test-plan artifact, require the existing QA handoff before presenting completion options."
require_pattern skills/finishing-a-development-branch/SKILL.md "When browser QA is clearly warranted, do not present a skip option."
require_pattern skills/finishing-a-development-branch/SKILL.md 'Possible options when browser QA is required:'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Possible options when browser QA is optional:'
require_pattern skills/finishing-a-development-branch/SKILL.md '- `B)` Skip QA handoff this time'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Required release-readiness pass for workflow-routed work before completion'
require_pattern skills/requesting-code-review/SKILL.md "target base branch"
require_pattern skills/executing-plans/SKILL.md 'Read the source spec named in the plan and confirm it is still `CEO Approved`, and that the latest approved spec still matches that exact source-spec path and revision.'
require_pattern skills/executing-plans/SKILL.md 'to `superpowers:writing-plans` if the source spec path or revision is stale'
require_pattern skills/executing-plans/SKILL.md 'Follow that skill to verify tests, require `qa-only` when browser QA is warranted, require `document-release` for workflow-routed work'
require_pattern skills/subagent-driven-development/SKILL.md 'Conditional completion gate:'
require_pattern skills/subagent-driven-development/SKILL.md 'Read the source spec named in the plan and confirm it is still `CEO Approved`, and that the latest approved spec still matches that exact source-spec path and revision.'
require_pattern skills/subagent-driven-development/SKILL.md 'to `superpowers:writing-plans` if the source spec path or revision is stale'
require_pattern skills/subagent-driven-development/SKILL.md 'Required release-readiness pass for workflow-routed work before completion'
require_pattern skills/subagent-driven-development/SKILL.md 'Let that skill require qa-only when browser QA is warranted, require document-release for workflow-routed work'
require_absent_pattern skills/executing-plans/SKILL.md 'offer optional `superpowers:qa-only` when appropriate'
require_absent_pattern skills/subagent-driven-development/SKILL.md 'Report-only browser QA offered from the branch-finishing flow when the branch has UI or route changes'
require_absent_pattern skills/subagent-driven-development/SKILL.md 'offer optional qa-only when appropriate'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Conditional pre-landing browser QA when the branch change surface or test-plan artifact warrants it'

require_pattern review/checklist.md "Spec / Plan Delivery Content"
require_pattern review/checklist.md "Release Readiness"

if rg -n -F 'git diff main...HEAD --name-only' skills/qa-only/SKILL.md >/dev/null; then
  echo "qa-only should not hardcode main for diff-aware mode."
  exit 1
fi

if rg -n -F 'SAFE_BRANCH=$(printf' skills/plan-eng-review/SKILL.md.tmpl skills/qa-only/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md.tmpl >/dev/null; then
  echo "Workflow templates should not inline branch sanitization fragments."
  exit 1
fi

if rg -n -F 'BRANCH=$(git rev-parse --abbrev-ref HEAD' skills/qa-only/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md.tmpl >/dev/null; then
  echo "Workflow templates should consume the shared slug helper instead of inlining branch capture."
  exit 1
fi

if rg -n -F 'SLUG=$(printf' skills/qa-only/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md.tmpl >/dev/null; then
  echo "Workflow templates should consume the shared slug helper instead of inlining repo slug derivation."
  exit 1
fi

if rg -n -F "Before merge to main" skills/requesting-code-review/SKILL.md >/dev/null; then
  echo "requesting-code-review should target the detected base branch, not hardcoded main."
  exit 1
fi

if rg -n -F 'git worktree list | grep $(git branch --show-current)' skills/finishing-a-development-branch/SKILL.md >/dev/null; then
  echo "finishing-a-development-branch should remove feature worktrees by feature branch, not the current branch."
  exit 1
fi

if rg -n -F '{user}-{branch}-test-plan-' skills/plan-eng-review/SKILL.md >/dev/null; then
  echo "plan-eng-review should sanitize branch names before writing test-plan artifacts."
  exit 1
fi

if rg -n -F '{user}-{branch}-test-outcome-' skills/qa-only/SKILL.md >/dev/null; then
  echo "qa-only should sanitize branch names before writing test-outcome artifacts."
  exit 1
fi

require_pattern README.md "document-release"
require_pattern README.md "qa-only"
require_pattern README.md "~/.superpowers/projects/"
require_pattern README.md 'required `document-release` handoff'
require_pattern README.md 'conditional `qa-only` handoff'
require_pattern README.md 'FINISH_BRANCH --> QA_GATE["conditional qa-only for browser-facing work<br/>required when browser interaction or test-plan context warrants it"]'
require_pattern README.md 'QA_GATE --> DOC_RELEASE["workflow-routed work: required document-release<br/>ad-hoc work: optional release/doc cleanup"]'
require_pattern README.md 'DOC_RELEASE --> COMPLETE_FLOW["PR / merge / keep-branch completion flow"]'
require_pattern README.md 'The completion flow then runs `requesting-code-review`, requires `qa-only` when browser QA is warranted, requires `document-release` for workflow-routed work'
require_pattern docs/README.codex.md "document-release"
require_pattern docs/README.codex.md "qa-only"
require_pattern docs/README.copilot.md "document-release"
require_pattern docs/README.copilot.md "qa-only"

echo "Workflow enhancement assets and contracts are present."
