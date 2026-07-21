#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
for p in docs/superpowers CODE_OF_CONDUCT.md RELEASE-NOTES.md .github/FUNDING.yml \
         .pi .opencode .cursor-plugin .kimi-plugin .codex-plugin \
         GEMINI.md AGENTS.md gemini-extension.json; do
  assert_absent "$p"
done
# Engine + license must survive.
assert_present skills/using-superpowers/SKILL.md
assert_present hooks/session-start
assert_present LICENSE
finish
