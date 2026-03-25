#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_KEY="${FEATUREFORGE_PREBUILT_TARGET:-darwin-arm64}"
RUST_TARGET="${FEATUREFORGE_PREBUILT_RUST_TARGET:-aarch64-apple-darwin}"
BINARY_NAME="${FEATUREFORGE_PREBUILT_BINARY:-featureforge}"
VERSION="$(tr -d '[:space:]' < "$REPO_ROOT/VERSION")"
OUTPUT_DIR="$REPO_ROOT/bin/prebuilt/$TARGET_KEY"
OUTPUT_PATH="$OUTPUT_DIR/$BINARY_NAME"
CHECKSUM_PATH="$OUTPUT_PATH.sha256"
MANIFEST_PATH="$REPO_ROOT/bin/prebuilt/manifest.json"
BUILD_PATH="$REPO_ROOT/target/$RUST_TARGET/release/$BINARY_NAME"

command -v cargo >/dev/null 2>&1 || {
  echo "cargo is required to refresh the checked-in runtime." >&2
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required to update bin/prebuilt/manifest.json." >&2
  exit 1
}

cd "$REPO_ROOT"
cargo build --release --target "$RUST_TARGET" --bin featureforge

mkdir -p "$OUTPUT_DIR"
cp "$BUILD_PATH" "$OUTPUT_PATH"
chmod +x "$OUTPUT_PATH"

CHECKSUM="$(shasum -a 256 "$OUTPUT_PATH" | awk '{print $1}')"
printf '%s  %s\n' "$CHECKSUM" "$BINARY_NAME" > "$CHECKSUM_PATH"

python3 - "$MANIFEST_PATH" "$TARGET_KEY" "bin/prebuilt/$TARGET_KEY/$BINARY_NAME" "bin/prebuilt/$TARGET_KEY/$BINARY_NAME.sha256" "$VERSION" <<'PY'
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
target_key = sys.argv[2]
binary_path = sys.argv[3]
checksum_path = sys.argv[4]
version = sys.argv[5]

if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text())
else:
    manifest = {"runtime_revision": version, "targets": {}}

targets = manifest.setdefault("targets", {})
targets[target_key] = {
    "binary_path": binary_path,
    "checksum_path": checksum_path,
}
manifest["runtime_revision"] = version
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
PY

echo "Refreshed checked-in runtime for $TARGET_KEY at $OUTPUT_PATH"
