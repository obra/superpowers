#!/usr/bin/env bash
#
# Word-count ceilings, repo-wide.
#
# Prints every count and fails on the first file over its ceiling, then checks
# the total across skills/**/*.md.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)

ceilings=(
  "skills/using-toolbelt/SKILL.md:290"
  "skills/verification-before-completion/SKILL.md:220"
  "skills/receiving-code-review/SKILL.md:220"
  "skills/writing-skills/SKILL.md:990"
  "skills/writing-skills/testing-skills-with-subagents.md:540"
  "skills/systematic-debugging/SKILL.md:340"
  "skills/test-driven-development/SKILL.md:500"
  "skills/brainstorming/SKILL.md:630"
  "skills/finishing-a-development-branch/SKILL.md:520"
  "skills/using-git-worktrees/SKILL.md:630"
  "skills/requesting-code-review/SKILL.md:180"
  "skills/requesting-code-review/code-reviewer.md:525"
  "skills/interactive-design/SKILL.md:900"
  "skills/interactive-design/iteration-mode.md:240"
  "skills/writing-plans/SKILL.md:1500"
  "skills/ux-gate/SKILL.md:740"
  "skills/ux-gate/matrix.md:620"
  "skills/writing-specs/SKILL.md:592"
  "skills/delivery/SKILL.md:930"
  "skills/delivery/branch-lifecycle.md:360"
  "skills/delivery/implementer-prompt.md:443"
  "skills/pr-monitor/SKILL.md:728"
  "skills/agent-routing/SKILL.md:490"
  "skills/quick-task/SKILL.md:244"
  "skills/test-driven-development/writing-good-tests.md:530"
  "skills/using-toolbelt/references/codex-tools.md:210"
  "skills/quick-task/mini-plan-example.md:120"
  "skills/agent-routing/routing/claude.md:150"
  "skills/agent-routing/routing/codex.md:140"
  "skills/brainstorming/visual-companion.md:590"
  "skills/systematic-debugging/root-cause-tracing.md:150"
  "skills/systematic-debugging/condition-based-waiting.md:140"
  "docs/WORKFLOW.md:290"
)

for entry in "${ceilings[@]}"; do
  optional=0
  if [[ "$entry" == *:optional ]]; then
    optional=1
    entry=${entry%:optional}
  fi
  path=${entry%:*}
  ceiling=${entry##*:}
  file="$repo_root/$path"

  if [ ! -f "$file" ]; then
    if [[ "$optional" -eq 1 ]]; then
      echo "skip - $path (absent)"
      continue
    fi
    echo "not ok - $path missing" >&2
    exit 1
  fi

  count=$(wc -w <"$file")
  echo "$count/$ceiling $path"

  if [[ "$count" -gt "$ceiling" ]]; then
    echo "not ok - $path exceeds ceiling" >&2
    exit 1
  fi
done

# The whole skills tree stays under one budget, so a new file cannot dodge the ceilings.
total_ceiling=14494
total=$(find "$repo_root/skills" -name '*.md' -print0 | xargs -0 cat | wc -w)
echo "$total/$total_ceiling skills/**/*.md"
if [[ "$total" -ge "$total_ceiling" ]]; then
  echo "not ok - skills/**/*.md exceeds $total_ceiling words" >&2
  exit 1
fi
