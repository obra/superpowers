#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
loader="$repo_root/hooks/load-routing"
setup="$repo_root/scripts/setup-codex-routing"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

assert_equals() {
  local actual=$1 expected=$2 description=$3
  if [[ "$actual" != "$expected" ]]; then
    echo "not ok - $description" >&2
    echo "expected: $expected" >&2
    echo "actual:   $actual" >&2
    exit 1
  fi
  echo "ok - $description"
}

git init -q "$tmp/main"
mkdir -p "$tmp/main/.toolbelt/routing"
echo "main copy" > "$tmp/main/.toolbelt/routing/codex.md"
git -C "$tmp/main" add -A
git -C "$tmp/main" -c user.email=t@t -c user.name=t commit -qm init
git -C "$tmp/main" worktree add -q "$tmp/wt" -b wt
echo "stale branch copy" > "$tmp/wt/.toolbelt/routing/codex.md"

main_file=$(cd "$tmp/main" && pwd -P)/.toolbelt/routing/codex.md
expected=$(printf '<AGENT-ROUTING source="%s">\nmain copy\n</AGENT-ROUTING>' "$main_file")

assert_equals "$(cd "$tmp/main" && "$loader" codex)" "$expected" "prints the routing file in the main checkout"
assert_equals "$(cd "$tmp/wt" && "$loader" codex)" "$expected" "a worktree reads the main checkout's copy, not its own"
assert_equals "$(cd "$tmp/main" && "$loader" claude)" "" "prints nothing when the harness has no file"
mkdir "$tmp/plain"
assert_equals "$(cd "$tmp/plain" && "$loader" codex; echo "rc=$?")" "rc=0" "prints nothing and succeeds outside git"

# Unusual layouts: read the real checkout, or print nothing; never a parent's routing.
mkdir -p "$tmp/odd/.toolbelt/routing"
echo "unrelated parent" > "$tmp/odd/.toolbelt/routing/codex.md"
git init -q --bare "$tmp/odd/bare.git"
assert_equals "$(cd "$tmp/odd/bare.git" && "$loader" codex)" "" "a bare repository prints nothing"
git init -q --separate-git-dir="$tmp/odd/sep.git" "$tmp/odd/sepwt"
assert_equals "$(cd "$tmp/odd/sepwt" && "$loader" codex)" "" "a separate git dir reads its own checkout, not the parent"
git -C "$tmp/main" -c protocol.file.allow=always submodule add -q "$tmp/main" sub 2>/dev/null
mkdir -p "$tmp/main/sub/.toolbelt/routing"
echo "submodule copy" > "$tmp/main/sub/.toolbelt/routing/codex.md"
assert_equals "$(cd "$tmp/main/sub" && "$loader" codex | sed -n 2p)" "submodule copy" "a submodule reads its own checkout"

# Setup keeps unrelated hooks and registers the routing hook exactly once.
export CODEX_HOME="$tmp/codex"
mkdir -p "$CODEX_HOME"
echo '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"other"}]}]}}' > "$CODEX_HOME/hooks.json"
"$setup" >/dev/null
"$setup" >/dev/null
commands=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(",".join(h["command"] for g in d["hooks"]["SessionStart"] for h in g["hooks"]))' "$CODEX_HOME/hooks.json")
assert_equals "$commands" "other,$CODEX_HOME/hooks/toolbelt-load-routing codex" "setup registers the hook once and keeps existing hooks"
[[ -x "$CODEX_HOME/hooks/toolbelt-load-routing" ]] && echo "ok - setup installs an executable loader copy"

# The registered command must run as written, even from a path with a space.
export CODEX_HOME="$tmp/codex home"
"$setup" >/dev/null
command=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["hooks"]["SessionStart"][0]["hooks"][0]["command"])' "$CODEX_HOME/hooks.json")
assert_equals "$(cd "$tmp/wt" && sh -c "$command")" "$expected" "registered command runs from a path with a space"
