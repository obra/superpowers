#!/usr/bin/env bash
# RED baseline / GREEN signal runner: project standards authoring prompt.
set -euo pipefail

MODE="${1:-red}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

case "$MODE" in
  green)
    PROMPT_FILE="$SCRIPT_DIR/prompts/project-standards-authoring-green.txt"
    OUT_DIR="${OUT_DIR:-$REPO_ROOT/docs/testing-reports/project-standards-authoring-green}"
    LABEL="GREEN"
    ;;
  red)
    PROMPT_FILE="$SCRIPT_DIR/prompts/project-standards-authoring-baseline.txt"
    OUT_DIR="${OUT_DIR:-$REPO_ROOT/docs/testing-reports/project-standards-authoring-red}"
    LABEL="RED baseline"
    ;;
  *)
    echo "ERROR: unknown MODE '$MODE' (use red or green)" >&2
    exit 1
    ;;
esac

OUTPUT_FILE="$OUT_DIR/claude-output.txt"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
ALLOW_SKIP_ON_CLAUDE_UNAVAILABLE="${ALLOW_SKIP_ON_CLAUDE_UNAVAILABLE:-1}"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: missing prompt file: $PROMPT_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "========================================"
echo " Project Standards Authoring ($LABEL)"
echo "========================================"
echo "MODE: $MODE"
echo "TIMEOUT_SECONDS: $TIMEOUT_SECONDS"
echo "ALLOW_SKIP_ON_CLAUDE_UNAVAILABLE: $ALLOW_SKIP_ON_CLAUDE_UNAVAILABLE"
echo "REPO_ROOT: $REPO_ROOT"
echo "PROMPT_FILE: $PROMPT_FILE"
echo "OUT_DIR: $OUT_DIR"
echo ""

PROMPT_TEXT=$(cat "$PROMPT_FILE")

run_with_timeout() {
  local secs="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$secs" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$secs" "$@"
  else
    python3 - "$secs" "$@" <<'PY'
import subprocess
import sys

seconds = int(sys.argv[1])
command = sys.argv[2:]

try:
    raise SystemExit(subprocess.call(command, timeout=seconds))
except subprocess.TimeoutExpired:
    raise SystemExit(124)
PY
  fi
}

cd "$REPO_ROOT"
set +e
run_with_timeout "$TIMEOUT_SECONDS" claude -p "$PROMPT_TEXT" \
  --permission-mode bypassPermissions \
  2>&1 | tee "$OUTPUT_FILE"
CLAUDE_EXIT="${PIPESTATUS[0]}"
set -e

if [[ "$CLAUDE_EXIT" -eq 124 ]]; then
  echo "ERROR: claude command timed out after ${TIMEOUT_SECONDS}s." >&2
  echo "Hint: rerun with TIMEOUT_SECONDS=<larger-value> if needed." >&2
  exit 124
fi

if [[ "$CLAUDE_EXIT" -ne 0 ]]; then
  if [[ "$ALLOW_SKIP_ON_CLAUDE_UNAVAILABLE" == "1" ]] && rg -q -i \
    -e '404 page not found' \
    -e 'api error' \
    -e 'not authenticated' \
    -e 'unauthorized' \
    -e 'forbidden' \
    "$OUTPUT_FILE" 2>/dev/null; then
    echo "SKIPPED: claude endpoint unavailable in this environment." >&2
    echo "SKIPPED: this script requires a working Claude Code runtime." >&2
    exit 0
  fi
  echo "ERROR: claude command failed with exit code $CLAUDE_EXIT." >&2
  exit "$CLAUDE_EXIT"
fi

if [[ "$MODE" == "green" ]]; then
  echo ""
  echo "--- Green mode checks (fail on miss) ---"
  fail=0

  if ! rg -n -q -i \
    -e '2[[:space:]-]+3' \
    -e 'two or three' \
    -e '2 to 3' \
    -e 'classification' \
    -e 'taxonomy' \
    -e 'categorization' \
    -e 'categorisation' \
    -e 'classify' \
    "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL: expected 2-3 / classification-related content in output." >&2
    fail=1
  fi

  if ! rg -n -q -i \
    -e 'standards-context-retrieval' \
    -e 'Constraints Summary' \
    "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL: expected standards-context-retrieval or Constraints Summary in output." >&2
    fail=1
  fi

  if ! rg -q -F '.cursor/rules/' "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL: expected .cursor/rules/ in output." >&2
    fail=1
  fi

  if ! rg -q -F 'docs/checklist/' "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL: expected docs/checklist/ in output." >&2
    fail=1
  fi

  if ! rg -q -i -e 'reuse-inventory' -e 'reuse inventory' "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL: expected reuse-inventory (or reuse inventory) in output." >&2
    fail=1
  fi

  if [[ "$fail" -ne 0 ]]; then
    exit 1
  fi
  echo "Green mode checks passed."
else
  echo ""
  echo "--- Heuristic checks (informational only; no fail on match) ---"

  classification_matches=$(
    rg -n -i \
      -e 'classification' \
      -e 'taxonomy' \
      -e 'categorization' \
      -e 'classify' \
      "$OUTPUT_FILE" 2>/dev/null || true
  )
  if [[ -n "$classification_matches" ]]; then
    echo "INFO: Possible classification-scheme-related lines (rg):"
    echo "$classification_matches"
  else
    echo "INFO: No classification-scheme-related keyword matches (rg)."
  fi

  skill_matches=$(
    rg -n -i \
      -e 'standards-context-retrieval' \
      -e 'Constraints Summary' \
      "$OUTPUT_FILE" 2>/dev/null || true
  )
  if [[ -n "$skill_matches" ]]; then
    echo "INFO: standards-context-retrieval / Constraints Summary mentions (rg):"
    echo "$skill_matches"
  else
    echo "INFO: No standards-context-retrieval or Constraints Summary matches (rg)."
  fi
fi

echo ""
echo "Output file: $OUTPUT_FILE"
