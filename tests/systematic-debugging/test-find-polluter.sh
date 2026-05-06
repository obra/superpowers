#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

mkdir -p "$TEST_DIR/tests" "$TEST_DIR/fake-bin"
touch "$TEST_DIR/tests/space name.test.js"

cat > "$TEST_DIR/fake-bin/npm" <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

if [[ "$1" != "test" ]]; then
  echo "unexpected npm command: $*" >&2
  exit 2
fi
shift

if [[ "$#" -eq 1 && "$1" == "./tests/space name.test.js" ]]; then
  touch pollution
fi
SCRIPT
chmod +x "$TEST_DIR/fake-bin/npm"

cd "$TEST_DIR"
set +e
PATH="$TEST_DIR/fake-bin:$PATH" bash "$REPO_ROOT/skills/systematic-debugging/find-polluter.sh" pollution './tests/*.test.js' > output.txt 2>&1
status=$?
set -e

if [[ "$status" -ne 1 ]]; then
  echo "Expected find-polluter.sh to exit 1 after finding the polluter, got $status"
  cat output.txt
  exit 1
fi

if ! grep -Fq "Test: ./tests/space name.test.js" output.txt; then
  echo "Expected output to identify the full test path with spaces"
  cat output.txt
  exit 1
fi

echo "PASS find-polluter handles test paths with spaces"
