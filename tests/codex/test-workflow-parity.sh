#!/usr/bin/env bash
set -euo pipefail

rg -q 'same implementer|same subagent' skills/subagent-driven-development/SKILL.md
rg -q 'Commit your work' skills/subagent-driven-development/implementer-prompt.md
rg -q 'send_input|resume_agent' skills/subagent-driven-development/SKILL.md
rg -q 'Spec reviewer reviews again|Code reviewer reviews again|Reviewer reviews again' skills/subagent-driven-development/SKILL.md
rg -q 'Task 2: Recovery modes' skills/subagent-driven-development/SKILL.md
rg -q 'Missing: Progress reporting' skills/subagent-driven-development/SKILL.md
rg -q 'Removed --json flag, added progress reporting' skills/subagent-driven-development/SKILL.md
rg -q 'Magic number \(100\)' skills/subagent-driven-development/SKILL.md
rg -q 'If the plan or your human partner asks for a review checkpoint' skills/executing-plans/SKILL.md
rg -q 'About to write a plan\?|Already brainstormed\?' skills/using-superpowers/SKILL.md
rg -q 'approved spec|use `brainstorming` first' skills/writing-plans/SKILL.md
rg -q '### Strengths|### Issues|### Recommendations|### Assessment' agents/code-reviewer.md
rg -q 'Strengths, Issues \(Critical/Important/Minor\), Recommendations, Assessment' skills/subagent-driven-development/code-quality-reviewer-prompt.md
rg -q '^description: Execute implementation plans with isolated task subagents and staged reviews' skills/subagent-driven-development/SKILL.md
rg -q '^description: Drive implementation from a failing test first' skills/test-driven-development/SKILL.md
rg -q '^description: Turn an approved spec into a detailed implementation plan' skills/writing-plans/SKILL.md

! rg -q 'fresh fix agent' skills/subagent-driven-development/SKILL.md
! rg -q 'coordinator owns the canonical workspace' skills/subagent-driven-development/SKILL.md
! rg -q 'Do not make handoff or checkpoint commits' skills/subagent-driven-development/implementer-prompt.md
! rg -q 'Commit the completed task or batch before the review checkpoint|fix-and-rereview loop|Run the review checkpoint required by the plan or batch using' skills/executing-plans/SKILL.md
! rg -q 'Findings, Open Questions, Summary' skills/subagent-driven-development/code-quality-reviewer-prompt.md agents/code-reviewer.md
! rg -q 'Clear skip reason in output' skills/subagent-driven-development/SKILL.md

echo "workflow parity ok"
