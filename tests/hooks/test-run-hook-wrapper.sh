#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "=== Test: hooks.json uses run-hook.cmd wrapper ==="
if grep -Fq '"command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"' "${REPO_ROOT}/hooks/hooks.json"; then
  echo "  [PASS] SessionStart command points to run-hook.cmd"
else
  echo "  [FAIL] SessionStart command does not use run-hook.cmd"
  exit 1
fi

echo "=== Test: run-hook.cmd Windows branch does not use %* after shift semantics pitfall ==="
if grep -Fq '%*' "${REPO_ROOT}/hooks/run-hook.cmd"; then
  echo "  [FAIL] run-hook.cmd contains %* in CMD branch (unsafe with shift)"
  exit 1
else
  echo "  [PASS] run-hook.cmd avoids %* in CMD branch"
fi

echo "=== Test: run-hook.cmd handles spaced paths and spaced args on Unix path ==="
tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

hooks_dir="${tmp_root}/hooks with spaces"
mkdir -p "$hooks_dir"
cp "${REPO_ROOT}/hooks/run-hook.cmd" "${hooks_dir}/run-hook.cmd"
chmod +x "${hooks_dir}/run-hook.cmd"

cat > "${hooks_dir}/echo-args" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  exit 20
fi
if [ "$1" != "alpha beta" ]; then
  exit 21
fi
if [ "$2" != "gamma" ]; then
  exit 22
fi
exit 0
EOF
chmod +x "${hooks_dir}/echo-args"

"${hooks_dir}/run-hook.cmd" echo-args "alpha beta" gamma
echo "  [PASS] run-hook.cmd forwarded spaced args correctly"

echo "=== All run-hook wrapper tests passed ==="
