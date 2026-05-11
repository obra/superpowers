#!/usr/bin/env bash
# Regression test: Codex test helpers must support a writable skill directory override.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "--- Sandbox Friendly Skill Dir ---"

tmp_root="$(mktemp -d)"
readonly tmp_root
readonly fake_home="$tmp_root/home"
readonly skills_dir="$tmp_root/agents-skills"
readonly codex_stub="$tmp_root/codex"
readonly output_file="$tmp_root/output.txt"

cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

mkdir -p "$fake_home"
cat >"$codex_stub" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'using-horspowers\nbrainstorming\nwriting-plans\n'
EOF
chmod +x "$codex_stub"

if HOME="$fake_home" AGENTS_SKILLS_DIR="$skills_dir" CODEX_BIN="$codex_stub" \
  bash "$SCRIPT_DIR/test-native-discovery.sh" >"$output_file" 2>&1; then
  :
else
  echo "  [FAIL] native discovery script should succeed with AGENTS_SKILLS_DIR override"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if [ -L "$skills_dir/horspowers" ]; then
  echo "  [PASS] script created symlink in overridden skills dir"
else
  echo "  [FAIL] script did not create symlink in overridden skills dir"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if [ -e "$fake_home/.agents/skills/horspowers" ]; then
  echo "  [FAIL] script should not write to default HOME skills dir when override is set"
  sed -n '1,160p' "$output_file"
  exit 1
fi

echo "  [PASS] script avoided default HOME skills dir"
