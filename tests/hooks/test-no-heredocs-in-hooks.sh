#!/usr/bin/env bash
set -euo pipefail

# Heredocs are banned from the hook delivery chain: bash >= 5.1 delivers
# them through a pre-fork pipe write that deadlocks on macOS under pipe
# pressure (issue #571; the #571 class). This fence fails the moment one
# returns. The operator is spelled out of a variable so this file does not
# trip its own check.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

OP='<''<'
FAILURES=0
for f in "$REPO_ROOT"/hooks/*; do
    case "$f" in *.json) continue;; esac
    [ -f "$f" ] || continue
    if hits="$(grep -nE "$OP" "$f")"; then
        echo "  [FAIL] heredoc operator in ${f#"$REPO_ROOT"/}:"
        printf '%s\n' "$hits" | sed 's/^/    /'
        FAILURES=$((FAILURES + 1))
    else
        echo "  [PASS] ${f#"$REPO_ROOT"/} is heredoc-free"
    fi
done

if [ "$FAILURES" -gt 0 ]; then
    echo "STATUS: FAILED ($FAILURES file(s))"
    exit 1
fi
echo "STATUS: PASSED"
