#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../.." && pwd -P)
orig_codex_home=${CODEX_HOME:-$HOME/.codex}

if ! command -v codex >/dev/null 2>&1; then
  echo "runtime smoke skipped: codex not installed"
  exit 0
fi

if [ ! -f "$orig_codex_home/auth.json" ]; then
  echo "runtime smoke skipped: $orig_codex_home/auth.json not found"
  exit 0
fi

tmpdir=$(mktemp -d)
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

temp_home="$tmpdir/home"
temp_codex_home="$temp_home/.codex"
mkdir -p "$temp_home/.agents/skills" "$temp_codex_home"
cp "$orig_codex_home/auth.json" "$temp_codex_home/auth.json"
ln -s "$repo_root/skills" "$temp_home/.agents/skills/superpowers"

prompt="From the repository root, report the absolute path for the using-superpowers skill you loaded and the absolute path for the active AGENTS.md instructions."

output=$(
  cd "$repo_root"
  HOME="$temp_home" CODEX_HOME="$temp_codex_home" \
    codex exec -c 'approval_policy="never"' --sandbox read-only "$prompt"
)

printf '%s\n' "$output"

printf '%s\n' "$output" | rg -F "$repo_root/skills/using-superpowers/SKILL.md" >/dev/null
printf '%s\n' "$output" | rg -F "$repo_root/AGENTS.md" >/dev/null

echo "runtime smoke ok"
