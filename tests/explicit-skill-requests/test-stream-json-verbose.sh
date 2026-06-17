#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0

pass() {
    echo "  PASS: $1"
}

fail() {
    echo "  FAIL: $1"
    echo "    $2"
    FAILURES=$((FAILURES + 1))
}

check_file() {
    local file="$1"
    local basename
    local output

    basename="$(basename "$file")"

    if ! grep -q -- "--output-format stream-json" "$file"; then
        pass "$basename has no stream-json claude calls"
        return 0
    fi

    if output="$(awk '
      function finish_command() {
        if (in_command && has_stream_json && !has_verbose) {
          printf "%s:%d: stream-json claude -p command is missing --verbose\n", FILENAME, start_line
          failed = 1
        }
        in_command = 0
        has_stream_json = 0
        has_verbose = 0
      }

      /claude -p / {
        finish_command()
        in_command = 1
        start_line = NR
        has_verbose = 0
        has_stream_json = 0
      }

      in_command && /--verbose/ {
        has_verbose = 1
      }

      in_command && /--output-format[[:space:]]+stream-json/ {
        has_stream_json = 1
      }

      in_command && /\|\|[[:space:]]+true/ {
        finish_command()
      }

      END {
        finish_command()
        exit failed
      }
    ' "$file" 2>&1)"; then
        pass "$basename uses --verbose with stream-json"
    else
        fail "$basename uses --verbose with stream-json" "$output"
    fi
}

echo "Claude stream-json verbose guard"

for file in "$SCRIPT_DIR"/*.sh; do
    case "$(basename "$file")" in
        test-stream-json-verbose.sh)
            continue
            ;;
    esac
    check_file "$file"
done

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
