#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
LEGACY_STATE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/superpowers-differential-legacy.XXXXXX")
RUST_STATE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/superpowers-differential-rust.XXXXXX")
REPO_DIR=$(mktemp -d "${TMPDIR:-/tmp}/superpowers-differential-repo.XXXXXX")
FIXTURE_ROOT="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
EXPECTED_JSON="$REPO_ROOT/tests/fixtures/differential/workflow-status.json"
LEGACY_BIN="$REPO_ROOT/bin/superpowers-workflow-status"
RUST_BIN="$REPO_ROOT/target/debug/superpowers"

cleanup() {
  rm -rf "$LEGACY_STATE_DIR" "$RUST_STATE_DIR" "$REPO_DIR"
}
trap cleanup EXIT

if [[ ! -x "$LEGACY_BIN" ]]; then
  echo "Missing legacy workflow-status helper at $LEGACY_BIN" >&2
  exit 1
fi

if [[ ! -x "$RUST_BIN" ]]; then
  echo "Missing Rust runtime binary at $RUST_BIN. Build it first with cargo build --bin superpowers." >&2
  exit 1
fi

normalize_json() {
  python3 - "$1" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
normalized = dict(payload)
normalized.pop("manifest_path", None)
normalized.pop("root", None)
print(json.dumps(normalized, indent=2, sort_keys=True))
PY
}

git -C "$REPO_DIR" init -q
mkdir -p "$REPO_DIR/docs/superpowers/specs"
cp "$FIXTURE_ROOT/specs/2026-01-22-document-review-system-design.md" \
  "$REPO_DIR/docs/superpowers/specs/2026-01-22-document-review-system-design.md"
cp "$FIXTURE_ROOT/specs/2026-01-22-document-review-system-design-v2.md" \
  "$REPO_DIR/docs/superpowers/specs/2026-01-22-document-review-system-design-v2.md"

legacy_output="$(cd "$REPO_DIR" && SUPERPOWERS_STATE_DIR="$LEGACY_STATE_DIR" "$LEGACY_BIN" --refresh)"
rust_output="$(cd "$REPO_DIR" && SUPERPOWERS_STATE_DIR="$RUST_STATE_DIR" "$RUST_BIN" workflow status --refresh)"

legacy_normalized="$(normalize_json "$legacy_output")"
rust_normalized="$(normalize_json "$rust_output")"
expected_normalized="$(python3 - "$EXPECTED_JSON" <<'PY'
import json
import sys
from pathlib import Path

print(json.dumps(json.loads(Path(sys.argv[1]).read_text()), indent=2, sort_keys=True))
PY
)"

if [[ "$legacy_normalized" != "$rust_normalized" ]]; then
  echo "Legacy helper and canonical Rust output diverged." >&2
  echo "Mismatch triage: compare the normalized payloads below before changing the fixture." >&2
  echo "--- legacy ---" >&2
  echo "$legacy_normalized" >&2
  echo "--- rust ---" >&2
  echo "$rust_normalized" >&2
  exit 1
fi

if [[ "$rust_normalized" != "$expected_normalized" ]]; then
  echo "Canonical workflow differential fixture is stale." >&2
  echo "Mismatch triage: inspect the normalized output before updating tests/fixtures/differential/workflow-status.json." >&2
  echo "--- expected ---" >&2
  echo "$expected_normalized" >&2
  echo "--- actual ---" >&2
  echo "$rust_normalized" >&2
  exit 1
fi

echo "Differential workflow-status smoke passed."
