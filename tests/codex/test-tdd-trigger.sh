#!/usr/bin/env bash
# Regression test: TDD-first prompts should route to the test-driven-development skill.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CODEX_BIN="${CODEX_BIN:-codex}"
tmp_root=""

if [ -n "${AGENTS_SKILLS_DIR:-}" ]; then
  skills_dir="$AGENTS_SKILLS_DIR"
else
  tmp_root="$(mktemp -d)"
  skills_dir="$tmp_root/agents-skills"
fi

echo "--- TDD Trigger ---"

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "  [SKIP] codex CLI not found at: $CODEX_BIN"
  exit 0
fi

mkdir -p "$skills_dir"
ln -sfn "$REPO_ROOT/skills" "$skills_dir/horspowers"

output_file="$(mktemp)"
cleanup() {
  rm -f "$output_file"
  if [ -n "$tmp_root" ]; then
    rm -rf "$tmp_root"
  fi
}
trap cleanup EXIT

prompt="先用一个 failing case 把问题固定住，后面实现可以再慢慢补。"

if ! AGENTS_SKILLS_DIR="$skills_dir" timeout 180s "$CODEX_BIN" exec "$prompt" >"$output_file" 2>&1; then
  echo "  [FAIL] codex exec did not complete TDD trigger probe"
  sed -n '1,120p' "$output_file"
  exit 1
fi

if grep -qiE "test-driven-development|测试驱动开发" "$output_file"; then
  echo "  [PASS] Codex routes failing-case-first prompt to TDD"
else
  echo "  [FAIL] Codex did not route failing-case-first prompt to TDD"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if grep -qiE "brainstorming|头脑风暴" "$output_file"; then
  echo "  [FAIL] Codex should not prefer brainstorming for failing-case-first prompt"
  sed -n '1,160p' "$output_file"
  exit 1
else
  echo "  [PASS] Codex avoids brainstorming for failing-case-first prompt"
fi
