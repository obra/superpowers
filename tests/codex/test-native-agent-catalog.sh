#!/usr/bin/env bash
# Test: native Superpowers Codex role catalog
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: native Superpowers Codex role catalog ==="
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

expected_roles=(
    "superpowers_implementer"
    "superpowers_explorer"
    "superpowers_verifier"
    "superpowers_reviewer"
    "superpowers_spec_reviewer"
    "superpowers_plan_reviewer"
    "superpowers_doc_reviewer"
)

echo "Test 1: Role TOML files exist in the repository..."
for role in "${expected_roles[@]}"; do
    role_file="$REPO_ROOT/.codex/agents/$role.toml"
    if [ -f "$role_file" ]; then
        echo "  [PASS] $role.toml exists"
    else
        echo "  [FAIL] Missing role file: $role_file"
        exit 1
    fi
done

echo ""
echo "Test 2: Role TOML files are installed into the isolated Codex home..."
for role in "${expected_roles[@]}"; do
    role_file="$CODEX_HOME/agents/$role.toml"
    if [ -f "$role_file" ]; then
        echo "  [PASS] $role.toml copied into test Codex home"
    else
        echo "  [FAIL] Missing installed role file: $role_file"
        exit 1
    fi
done

echo ""
echo "Test 3: Codex discovers the native Superpowers role catalog..."
roles_answer=$(run_codex "List every available spawn_agent role name that starts with superpowers_. Reply with one role name per line and nothing else." "$TEST_PROJECT" 90)

for role in "${expected_roles[@]}"; do
    if echo "$roles_answer" | grep -Eq "(^|[[:space:]])$role($|[[:space:]])"; then
        echo "  [PASS] Codex exposed role: $role"
    else
        echo "  [FAIL] Codex did not expose expected role: $role"
        echo "  Output:"
        echo "$roles_answer" | sed 's/^/    /'
        exit 1
    fi
done

echo ""
echo "=== Native Superpowers Codex role catalog test passed ==="
