#!/usr/bin/env bash

# Pre-commit Quality Gate (PreToolUse hook for Bash)
# Blocks git commit if lint or typecheck fails.
# Fast exit for non-commit commands. Fail-open if no tooling detected.

set -euo pipefail

# Fail-open if jq unavailable
command -v jq >/dev/null 2>&1 || { exit 0; }

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Extract the bash command
COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || true)

# Fast exit: only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit\b'; then
    exit 0
fi

# We're in a git commit — run quality checks
errors=""

# Find project root (where package.json or similar config lives)
project_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Detect and run lint
run_lint() {
    if [[ -f "$project_root/package.json" ]]; then
        # Check for npm scripts
        if jq -e '.scripts.lint' "$project_root/package.json" >/dev/null 2>&1; then
            local output
            if ! output=$(cd "$project_root" && npm run lint 2>&1); then
                errors+="Lint failed:\n$output\n\n"
                return 1
            fi
            return 0
        fi
        if jq -e '.scripts.check' "$project_root/package.json" >/dev/null 2>&1; then
            local output
            if ! output=$(cd "$project_root" && npm run check 2>&1); then
                errors+="Check failed:\n$output\n\n"
                return 1
            fi
            return 0
        fi
    fi

    # Fallback: detect common tools
    if command -v biome >/dev/null 2>&1 && [[ -f "$project_root/biome.json" || -f "$project_root/biome.jsonc" ]]; then
        local output
        if ! output=$(cd "$project_root" && biome check 2>&1); then
            errors+="Biome check failed:\n$output\n\n"
            return 1
        fi
        return 0
    fi

    if command -v eslint >/dev/null 2>&1 && [[ -f "$project_root/.eslintrc" || -f "$project_root/.eslintrc.js" || -f "$project_root/.eslintrc.json" || -f "$project_root/eslint.config.js" || -f "$project_root/eslint.config.mjs" ]]; then
        local staged_files
        staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|js|tsx|jsx)$' || true)
        if [[ -n "$staged_files" ]]; then
            local output
            if ! output=$(cd "$project_root" && echo "$staged_files" | xargs eslint 2>&1); then
                errors+="ESLint failed:\n$output\n\n"
                return 1
            fi
        fi
        return 0
    fi

    if command -v ruff >/dev/null 2>&1; then
        local staged_files
        staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.py$' || true)
        if [[ -n "$staged_files" ]]; then
            local output
            if ! output=$(cd "$project_root" && echo "$staged_files" | xargs ruff check 2>&1); then
                errors+="Ruff check failed:\n$output\n\n"
                return 1
            fi
        fi
        return 0
    fi

    # No lint tool detected — fail open
    return 0
}

# Detect and run typecheck
run_typecheck() {
    if [[ -f "$project_root/package.json" ]]; then
        if jq -e '.scripts.typecheck' "$project_root/package.json" >/dev/null 2>&1; then
            local output
            if ! output=$(cd "$project_root" && npm run typecheck 2>&1); then
                errors+="Typecheck failed:\n$output\n\n"
                return 1
            fi
            return 0
        fi
    fi

    # Fallback: detect common tools
    if [[ -f "$project_root/tsconfig.json" ]] && command -v tsc >/dev/null 2>&1; then
        local output
        if ! output=$(cd "$project_root" && tsc --noEmit 2>&1); then
            errors+="TypeScript check failed:\n$output\n\n"
            return 1
        fi
        return 0
    fi

    if command -v pyright >/dev/null 2>&1; then
        local staged_files
        staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.py$' || true)
        if [[ -n "$staged_files" ]]; then
            local output
            if ! output=$(cd "$project_root" && echo "$staged_files" | xargs pyright 2>&1); then
                errors+="Pyright failed:\n$output\n\n"
                return 1
            fi
        fi
        return 0
    fi

    if command -v cargo >/dev/null 2>&1 && [[ -f "$project_root/Cargo.toml" ]]; then
        local output
        if ! output=$(cd "$project_root" && cargo clippy -- -D warnings 2>&1); then
            errors+="Cargo clippy failed:\n$output\n\n"
            return 1
        fi
        return 0
    fi

    # No typecheck tool detected — fail open
    return 0
}

# Run checks
run_lint
run_typecheck

if [[ -n "$errors" ]]; then
    # Block the commit
    echo "$errors" >&2
    exit 2
fi

# All checks passed
exit 0
