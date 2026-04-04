#!/usr/bin/env bash
set -euo pipefail

test -d .agents/skills
test -f .agents/skills/using-superpowers/SKILL.md
test -f .agents/skills/brainstorming/SKILL.md

echo "skill discovery ok"
