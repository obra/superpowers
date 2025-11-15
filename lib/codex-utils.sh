#!/usr/bin/env bash

# Get plugin root directory
get_plugin_root() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "$(cd "${script_dir}/.." && pwd)"
}

# Check if Codex delegation is enabled
is_codex_enabled() {
    local config_file="$(get_plugin_root)/config/codex-config.json"
    if [ ! -f "$config_file" ]; then
        echo "false"
        return 1
    fi

    local enabled=$(jq -r '.codex_enabled // false' "$config_file")
    echo "$enabled"
}

# Check if specific delegation type is enabled
is_delegation_enabled() {
    local delegation_type="$1"  # "code_review" or "debugging"
    local config_file="$(get_plugin_root)/config/codex-config.json"

    if [ ! -f "$config_file" ]; then
        echo "false"
        return 1
    fi

    local enabled=$(jq -r ".delegation_rules.${delegation_type}.enabled // false" "$config_file")
    echo "$enabled"
}

# Get delegation setting for specific type
should_delegate_to_codex() {
    local delegation_type="$1"
    local config_file="$(get_plugin_root)/config/codex-config.json"

    if [ "$(is_codex_enabled)" != "true" ]; then
        echo "false"
        return 1
    fi

    if [ "$(is_delegation_enabled "$delegation_type")" != "true" ]; then
        echo "false"
        return 1
    fi

    local delegate=$(jq -r ".delegation_rules.${delegation_type}.delegate_to_codex // false" "$config_file")
    echo "$delegate"
}

# Get prompt template
get_codex_prompt_template() {
    local template_name="$1"
    local config_file="$(get_plugin_root)/config/codex-config.json"

    jq -r ".codex_prompts.${template_name}" "$config_file"
}

# Replace placeholders in template
fill_template() {
    local template="$1"
    shift

    local result="$template"
    while [ $# -gt 0 ]; do
        local key="$1"
        local value="$2"
        result="${result//\{$key\}/$value}"
        shift 2
    done

    echo "$result"
}
