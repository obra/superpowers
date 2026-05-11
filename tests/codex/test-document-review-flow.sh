#!/usr/bin/env bash
# Smoke tests for Codex document review flow compatibility.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CODEX_BIN="${CODEX_BIN:-codex}"
AGENTS_SKILLS_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"

echo "--- Document Review Flow ---"

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "  [SKIP] codex CLI not found at: $CODEX_BIN"
  exit 0
fi

mkdir -p "$AGENTS_SKILLS_DIR"
ln -sfn "$REPO_ROOT/skills" "$AGENTS_SKILLS_DIR/horspowers"

output_file="$(mktemp)"
cleanup() {
  rm -f "$output_file"
}
trap cleanup EXIT

if ! timeout 180s "$CODEX_BIN" exec "According to the horspowers brainstorming skill in this session, after writing a design doc in docs/plans, what review must happen before the user review gate? Answer briefly." >"$output_file" 2>&1; then
  echo "  [FAIL] codex exec did not complete brainstorming review probe"
  sed -n '1,120p' "$output_file"
  exit 1
fi

if grep -qiE "spec-document-reviewer-prompt\.md|structured spec review|结构化.*审查|结构化.*评审" "$output_file"; then
  echo "  [PASS] Codex sees brainstorming spec review gate"
else
  echo "  [FAIL] Codex did not report brainstorming spec review gate"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if grep -qiE "before.*user review|user review gate|Only ask for user review after|用户审查.*之前|用户评审.*之前" "$output_file"; then
  echo "  [PASS] Codex orders spec review before user review"
else
  echo "  [FAIL] Codex did not preserve review ordering for brainstorming"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if ! timeout 180s "$CODEX_BIN" exec "According to the horspowers writing-plans skill in this session, after saving a plan in docs/plans, what review must happen before execution handoff? Answer briefly." >"$output_file" 2>&1; then
  echo "  [FAIL] codex exec did not complete writing-plans review probe"
  sed -n '1,120p' "$output_file"
  exit 1
fi

if grep -qiE "plan-document-reviewer-prompt\.md|plan review gate|Plan Review Gate|计划审查|计划评审" "$output_file"; then
  echo "  [PASS] Codex sees writing-plans review gate"
else
  echo "  [FAIL] Codex did not report writing-plans review gate"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if grep -qiE "before.*execution handoff|Only continue when.*Approved|related design/spec|docs/plans|执行交接之前|execution handoff.*before|Approved" "$output_file"; then
  echo "  [PASS] Codex preserves plan review approval rule"
else
  echo "  [FAIL] Codex did not preserve plan review approval rule"
  sed -n '1,160p' "$output_file"
  exit 1
fi
