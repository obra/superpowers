#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

test_config_exists() {
    config_file="${PLUGIN_ROOT}/config/codex-config.json"
    if [ ! -f "$config_file" ]; then
        echo "FAIL: Config file does not exist"
        return 1
    fi
    echo "PASS: Config file exists"
}

test_config_valid_json() {
    config_file="${PLUGIN_ROOT}/config/codex-config.json"
    if ! jq empty "$config_file" 2>/dev/null; then
        echo "FAIL: Config is not valid JSON"
        return 1
    fi
    echo "PASS: Config is valid JSON"
}

test_config_has_required_fields() {
    config_file="${PLUGIN_ROOT}/config/codex-config.json"

    if ! jq -e '.codex_enabled' "$config_file" >/dev/null; then
        echo "FAIL: Missing codex_enabled field"
        return 1
    fi

    if ! jq -e '.delegation_rules' "$config_file" >/dev/null; then
        echo "FAIL: Missing delegation_rules field"
        return 1
    fi

    echo "PASS: Config has required fields"
}

# Run tests
test_config_exists
test_config_valid_json
test_config_has_required_fields
