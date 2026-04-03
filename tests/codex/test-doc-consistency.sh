#!/usr/bin/env bash
set -euo pipefail

rg -q 'Codex-only|Codex-only fork' README.md
rg -q 'AGENTS.md' docs/README.codex.md
rg -q 'scripts/validate-codex-only.sh' docs/testing.md

echo "doc consistency ok"
