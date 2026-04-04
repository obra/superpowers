#!/usr/bin/env bash
set -euo pipefail

test -f AGENTS.md
test ! -L AGENTS.md
test ! -e CLAUDE.md
test -d .agents
test ! -d .claude-plugin
test ! -d .cursor-plugin
test ! -d .opencode
test ! -d hooks
test ! -f GEMINI.md
test ! -f gemini-extension.json

echo "repo surface ok"
