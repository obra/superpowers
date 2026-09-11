#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALLER="$REPO_ROOT/scripts/install-kiro.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
source_dir="$TEST_ROOT/local checkout"
mkdir -p "$source_dir/.kiro/agents" "$source_dir/.git" "$TEST_ROOT/bin"
cp -R "$REPO_ROOT/skills" "$source_dir/"
cp "$REPO_ROOT"/.kiro/agents/*.md "$source_dir/.kiro/agents/"
printf '{\n "version": "6.3.0-dev"\n}\n' > "$source_dir/package.json"
printf 'uncommitted content\n' > "$source_dir/skills/local-change.txt"
printf 'exclude me\n' > "$source_dir/unrelated.txt"
printf '#!/bin/sh\nexit 99\n' > "$TEST_ROOT/bin/curl"
chmod +x "$TEST_ROOT/bin/curl"
run() {
  HOME="$TEST_ROOT/home" XDG_DATA_HOME="$TEST_ROOT/data" \
    PATH="$TEST_ROOT/bin:$PATH" sh "$INSTALLER" "$@"
}
if ! (cd "$TEST_ROOT" && run --source './local checkout') > "$TEST_ROOT/log" 2>&1; then
  cat "$TEST_ROOT/log"; fail 'installs local source without network access'
fi
payload="$TEST_ROOT/data/superpowers/kiro"
agent="$TEST_ROOT/home/.kiro/agents/superpowers.md"
cmp "$source_dir/skills/local-change.txt" "$payload/skills/local-change.txt"
[ ! -e "$payload/.git" ] && [ ! -e "$payload/unrelated.txt" ] || fail 'copies unrelated files'
grep -Fq 'source: local' "$payload/.superpowers-kiro-install" || fail 'missing local provenance'
grep -Fq '6.3.0-dev' "$payload/.superpowers-kiro-install" || fail 'missing development version'
grep -Fq "file://$payload/skills/using-superpowers/SKILL.md" "$agent" || fail 'resources are not installed paths'
[ ! -e "$source_dir/.superpowers-kiro-install" ] || fail 'modified source checkout'
cp -R "$payload" "$TEST_ROOT/before"
cp "$agent" "$TEST_ROOT/agent-before"
# Invalid sources must preserve the managed installation.
for args in missing empty incomplete; do
  bad="$TEST_ROOT/$args"
  if [ "$args" != missing ]; then mkdir -p "$bad"; fi
  if run --source "$bad" > "$TEST_ROOT/log" 2>&1; then fail "accepts $args source"; fi
  diff -r "$TEST_ROOT/before" "$payload"
  cmp "$TEST_ROOT/agent-before" "$agent"
done
for form in missing-argument extra-tag reversed-tag; do
  case "$form" in
    missing-argument) set -- --source ;;
    extra-tag) set -- --source "$source_dir" v6.3.0 ;;
    reversed-tag) set -- v6.3.0 --source "$source_dir" ;;
  esac
  if run "$@" > "$TEST_ROOT/log" 2>&1; then fail "accepts $form"; fi
  grep -Fq 'usage:' "$TEST_ROOT/log" || fail "unclear $form error"
done
# Missing version metadata must not pass local validation.
printf '{}\n' > "$source_dir/package.json"
if run --source "$source_dir" > "$TEST_ROOT/log" 2>&1; then fail 'accepts missing version'; fi
diff -r "$TEST_ROOT/before" "$payload"
printf '{\n "version": "6.3.0-dev"\n}\n' > "$source_dir/package.json"
printf 'updated content\n' > "$source_dir/skills/local-change.txt"
run --source "$source_dir" > /dev/null
rm -rf "$source_dir"
grep -Fq 'updated content' "$payload/skills/local-change.txt" || fail 'does not install independent updated snapshot'
# The local route must still honor unmanaged destination guards.
printf 'personal agent\n' > "$agent"
if run --source "$REPO_ROOT" > "$TEST_ROOT/log" 2>&1; then fail 'overwrites unmanaged agent'; fi
grep -Fxq 'personal agent' "$agent" || fail 'damages unmanaged agent'
echo 'PASS: local source snapshots, validation, and ownership guards'
