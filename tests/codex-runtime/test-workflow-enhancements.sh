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

for file in agents/code-reviewer.instructions.md agents/code-reviewer.md .codex/agents/code-reviewer.toml; do
  require_pattern "$file" "review/checklist.md"
  require_pattern "$file" "base branch"
  require_pattern "$file" "TODO cross-reference"
  require_pattern "$file" "Documentation staleness"
done

require_pattern skills/requesting-code-review/SKILL.md "review checklist"
require_pattern skills/requesting-code-review/SKILL.md "{BASE_BRANCH}"
require_pattern skills/requesting-code-review/code-reviewer.md "{BASE_BRANCH}"
require_pattern skills/subagent-driven-development/code-quality-reviewer-prompt.md "BASE_BRANCH"

require_pattern skills/plan-eng-review/SKILL.md '$_SP_STATE_DIR/projects'
require_pattern skills/plan-eng-review/SKILL.md "test-plan"
require_pattern skills/plan-eng-review/SKILL.md 'This file is consumed by `superpowers:qa-only`'
require_pattern skills/plan-eng-review/SKILL.md "**Workflow State:** Draft | Engineering Approved"
require_pattern skills/plan-eng-review/SKILL.md "**Source Spec Revision:** <integer>"
require_pattern skills/plan-ceo-review/SKILL.md 'BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName'
require_pattern skills/plan-ceo-review/SKILL.md "**Workflow State:** Draft | CEO Approved"
require_pattern skills/plan-eng-review/SKILL.md 'SAFE_BRANCH=$(printf'

require_pattern skills/qa-only/SKILL.md "playwright"
require_pattern skills/qa-only/SKILL.md "diff-aware"
require_pattern skills/qa-only/SKILL.md "Health Score"
require_pattern skills/qa-only/SKILL.md '$_SP_STATE_DIR/projects'
require_pattern skills/qa-only/SKILL.md "qa-report"
require_pattern skills/qa-only/SKILL.md 'REPORT_DIR="${QA_OUTPUT_DIR:-.superpowers/qa-reports}"'
require_pattern skills/qa-only/SKILL.md 'origin/$BASE_BRANCH...HEAD'
require_pattern skills/qa-only/SKILL.md '| Tier | Standard | `Standard`, `Exhaustive` |'
require_pattern skills/qa-only/SKILL.md '| Mode | full | `--quick`, `--regression <baseline>` |'
require_pattern skills/qa-only/SKILL.md 'SAFE_BRANCH=$(printf'
require_pattern skills/qa-only/SKILL.md 'PLAN_ARTIFACT=$(ls -t'
require_pattern skills/qa-only/SKILL.md '*-"$SAFE_BRANCH"-test-plan-*.md'

require_pattern skills/document-release/SKILL.md "CHANGELOG"
require_pattern skills/document-release/SKILL.md "NEVER CLOBBER CHANGELOG ENTRIES"
require_pattern skills/document-release/SKILL.md "discoverability"
require_pattern skills/document-release/SKILL.md "TODOS.md"
require_pattern skills/document-release/SKILL.md "RELEASE-NOTES.md"
require_pattern skills/document-release/SKILL.md 'BASE_BRANCH=$(gh pr view --json baseRefName -q .baseRefName'
require_pattern skills/document-release/SKILL.md 'origin/$BASE_BRANCH...HEAD'

require_pattern skills/finishing-a-development-branch/SKILL.md "gh pr view --json baseRefName -q .baseRefName"
require_pattern skills/finishing-a-development-branch/SKILL.md "gh repo view --json defaultBranchRef -q .defaultBranchRef.name"
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:requesting-code-review'
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:qa-only'
require_pattern skills/finishing-a-development-branch/SKILL.md 'Optional Pre-Landing QA Gate'
require_pattern skills/finishing-a-development-branch/SKILL.md 'test-plan'
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers:document-release'
require_pattern skills/finishing-a-development-branch/SKILL.md 'FEATURE_WORKTREE=$(git worktree list --porcelain'
require_pattern skills/finishing-a-development-branch/SKILL.md "RELEASE-NOTES.md"
require_pattern skills/requesting-code-review/SKILL.md "target base branch"

if rg -n -F 'git diff main...HEAD --name-only' skills/qa-only/SKILL.md >/dev/null; then
  echo "qa-only should not hardcode main for diff-aware mode."
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

echo "Workflow enhancement assets and contracts are present."
