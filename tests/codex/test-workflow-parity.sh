#!/usr/bin/env bash
set -euo pipefail

rg -q 'same implementer|same subagent' skills/subagent-driven-development/SKILL.md
rg -q 'Commit your work' skills/subagent-driven-development/implementer-prompt.md
rg -q 'send_input|resume_agent' skills/subagent-driven-development/SKILL.md
rg -q 'Spec reviewer reviews again|Code reviewer reviews again|Reviewer reviews again' skills/subagent-driven-development/SKILL.md
rg -q 'If the plan or your human partner asks for a review checkpoint' skills/executing-plans/SKILL.md

! rg -q 'fresh fix agent' skills/subagent-driven-development/SKILL.md
! rg -q 'coordinator owns the canonical workspace' skills/subagent-driven-development/SKILL.md
! rg -q 'Do not make handoff or checkpoint commits' skills/subagent-driven-development/implementer-prompt.md
! rg -q 'Commit the completed task or batch before the review checkpoint|fix-and-rereview loop|Run the review checkpoint required by the plan or batch using' skills/executing-plans/SKILL.md

echo "workflow parity ok"
