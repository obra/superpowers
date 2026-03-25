#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
RUST_STATE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/featureforge-differential-rust.XXXXXX")
REPO_DIR=$(mktemp -d "${TMPDIR:-/tmp}/featureforge-differential-repo.XXXXXX")
FIXTURE_ROOT="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
EXPECTED_JSON="$REPO_ROOT/tests/fixtures/differential/workflow-status.json"
RUST_BIN="$REPO_ROOT/target/debug/featureforge"

cleanup() {
  rm -rf "$RUST_STATE_DIR" "$REPO_DIR"
}
trap cleanup EXIT

if [[ ! -x "$RUST_BIN" ]]; then
  echo "Missing Rust runtime binary at $RUST_BIN. Build it first with cargo build --bin featureforge." >&2
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
mkdir -p "$REPO_DIR/docs/featureforge/specs"
cp "$FIXTURE_ROOT/specs/2026-01-22-document-review-system-design.md" \
  "$REPO_DIR/docs/featureforge/specs/2026-01-22-document-review-system-design.md"
cp "$FIXTURE_ROOT/specs/2026-01-22-document-review-system-design-v2.md" \
  "$REPO_DIR/docs/featureforge/specs/2026-01-22-document-review-system-design-v2.md"

rust_output="$(cd "$REPO_DIR" && FEATUREFORGE_STATE_DIR="$RUST_STATE_DIR" "$RUST_BIN" workflow status --refresh)"
rust_normalized="$(normalize_json "$rust_output")"
expected_normalized="$(python3 - "$EXPECTED_JSON" <<'PY'
import json
import sys
from pathlib import Path

print(json.dumps(json.loads(Path(sys.argv[1]).read_text()), indent=2, sort_keys=True))
PY
)"

if [[ "$rust_normalized" != "$expected_normalized" ]]; then
  echo "Checked-in workflow-status differential fixture is stale." >&2
  echo "Mismatch triage: inspect the normalized output before updating tests/fixtures/differential/workflow-status.json." >&2
  echo "--- expected ---" >&2
  echo "$expected_normalized" >&2
  echo "--- actual ---" >&2
  echo "$rust_normalized" >&2
  exit 1
fi

echo "Differential workflow-status smoke passed."
