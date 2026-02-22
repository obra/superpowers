#!/usr/bin/env bash
set -euo pipefail

SKILL_FILE="skills/end-to-end-validation/SKILL.md"

[[ -f "$SKILL_FILE" ]]
grep -q '^name: end-to-end-validation$' "$SKILL_FILE"
grep -q 'Failure taxonomy' "$SKILL_FILE"
