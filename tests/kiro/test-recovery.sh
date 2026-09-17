#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALLER="$REPO_ROOT/scripts/install-kiro.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
mkdir -p "$TEST_ROOT/bin" "$TEST_ROOT/source/.kiro/agents"
cp -R "$REPO_ROOT/skills" "$TEST_ROOT/source/"
cp "$REPO_ROOT/package.json" "$TEST_ROOT/source/"
cp "$REPO_ROOT"/.kiro/agents/*.md "$TEST_ROOT/source/.kiro/agents/"
cat > "$TEST_ROOT/bin/mv" <<'MV'
#!/bin/sh
# Fail one chosen replacement; allow backup and recovery renames.
case "${FAIL_MODE:-replace}:$1" in
  rollback:*/old)
    [ "$2" != "$FAIL_DEST" ] || exit 76 ;;
  backup:*)
    if [ "$1" = "$FAIL_DEST" ]; then exit 77; fi ;;
esac
case "$1" in
  */new)
    if [ "$2" = "$FAIL_DEST" ] && [ ! -e "$FAIL_ONCE" ]; then
      : > "$FAIL_ONCE"
      if [ "${FAIL_MODE:-replace}" = signal ]; then kill -TERM "$PPID"; fi
      exit 74
    fi ;;
esac
exec /bin/mv "$@"
MV
cat > "$TEST_ROOT/bin/awk" <<'AWK'
#!/bin/sh
if [ "${FAIL_GENERATE:-0}" = 1 ]; then exit 75; fi
exec /usr/bin/awk "$@"
AWK
chmod +x "$TEST_ROOT/bin/"*
run() {
  HOME="$case_root/home" XDG_DATA_HOME="$case_root/data" \
    sh "$INSTALLER" --source "$TEST_ROOT/source"
}
for initial in existing fresh; do
  for target in generation payload main default lite; do
    case_root="$TEST_ROOT/$initial-$target"
    mkdir -p "$case_root"
    if [ "$initial" = existing ]; then
      run > /dev/null
      cp -R "$case_root/home" "$case_root/home-before"
      cp -R "$case_root/data" "$case_root/data-before"
    fi
    printf '%s\n' "$initial-$target" > "$TEST_ROOT/source/skills/update.txt"
    case "$target" in
      generation) dest=unused ;;
      payload) dest="$case_root/data/superpowers/kiro" ;;
      main) dest="$case_root/home/.kiro/agents/superpowers.md" ;;
      default) dest="$case_root/home/.kiro/agents/superpowers-worker-default-model.md" ;;
      lite) dest="$case_root/home/.kiro/agents/superpowers-worker-lite-model.md" ;;
    esac
    export FAIL_DEST="$dest" FAIL_ONCE="$case_root/failed-once" FAIL_GENERATE=0
    [ "$target" != generation ] || FAIL_GENERATE=1
    if PATH="$TEST_ROOT/bin:$PATH" run > "$case_root/log" 2>&1; then
      fail "did not inject $initial $target failure"
    fi
    if [ "$initial" = existing ]; then
      diff -r "$case_root/home-before" "$case_root/home" || fail "$target damaged existing agents"
      diff -r "$case_root/data-before" "$case_root/data" || fail "$target damaged existing payload"
    else
      [ ! -e "$case_root/data/superpowers/kiro" ] || fail "$target left fresh payload"
      for name in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
        [ ! -e "$case_root/home/.kiro/agents/$name.md" ] || fail "$target left fresh agent"
      done
    fi
    unset FAIL_GENERATE
    run > /dev/null
    cmp "$TEST_ROOT/source/skills/update.txt" "$case_root/data/superpowers/kiro/skills/update.txt"
  done
done
# Exercise failures before replacement, interruption, and recovery itself.
for mode in backup signal rollback; do
  case_root="$TEST_ROOT/$mode"
  mkdir -p "$case_root"
  run > /dev/null
  cp -R "$case_root/home" "$case_root/home-before"
  cp -R "$case_root/data" "$case_root/data-before"
  export FAIL_MODE="$mode" FAIL_DEST="$case_root/home/.kiro/agents/superpowers-worker-default-model.md"
  export FAIL_ONCE="$case_root/failed-once"
  printf '%s\n' "$mode" > "$TEST_ROOT/source/skills/update.txt"
  if PATH="$TEST_ROOT/bin:$PATH" run > "$case_root/log" 2>&1; then
    fail "did not inject $mode failure"
  fi
  if [ "$mode" = rollback ]; then
    grep -Fq 'recovery incomplete' "$case_root/log" || fail 'missing recovery diagnostic'
    backup=("$case_root/home/.kiro/agents/".superpowers-kiro-stage.*/2/old)
    [ "${#backup[@]}" -eq 1 ] && [ -f "${backup[0]}" ] || fail 'missing retained backup'
    cmp "$case_root/home-before/.kiro/agents/superpowers-worker-default-model.md" "${backup[0]}"
    grep -Fq "${backup[0]%/2/old}" "$case_root/log" || fail 'missing backup location'
  else
    diff -r "$case_root/home-before" "$case_root/home" || fail "$mode damaged agents"
    diff -r "$case_root/data-before" "$case_root/data" || fail "$mode damaged payload"
  fi
  unset FAIL_MODE
done
echo 'PASS: staging failures and every replacement failure restore or remove installed artifacts'
