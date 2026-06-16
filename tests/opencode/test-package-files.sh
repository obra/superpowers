#!/usr/bin/env bash
# Test: OpenCode package contents
# Verifies the git-backed package only ships runtime files.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Test: OpenCode Package Files ==="

pack_json="$(npm pack --dry-run --json "$ROOT_DIR")"

PACK_JSON="$pack_json" node <<'NODE'
const data = JSON.parse(process.env.PACK_JSON);
const files = data[0].files.map((file) => file.path);

const forbiddenPrefixes = [
  '.claude-plugin/',
  '.codex-plugin/',
  '.cursor-plugin/',
  '.github/',
  'docs/',
  'hooks/',
  'scripts/',
  'tests/',
];

const requiredFiles = [
  '.opencode/plugins/superpowers.js',
  'assets/app-icon.png',
  'assets/superpowers-small.svg',
  'skills/using-superpowers/SKILL.md',
  'skills/brainstorming/scripts/server.cjs',
  'package.json',
  'README.md',
  'LICENSE',
];

const failures = [];

for (const prefix of forbiddenPrefixes) {
  if (files.some((file) => file.startsWith(prefix))) {
    failures.push(`package includes forbidden path prefix: ${prefix}`);
  }
}

for (const file of requiredFiles) {
  if (!files.includes(file)) {
    failures.push(`package is missing required file: ${file}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`  [FAIL] ${failure}`);
  process.exit(1);
}
NODE

echo "  [PASS] Package contains only OpenCode runtime files"
echo ""
echo "=== All package file tests passed ==="
