#!/usr/bin/env bash
# Isolated-install check for the DeepSeek Harness integration.
#
# `dsh plugin --profile <name> add github:obra/superpowers` forwards to pnpm,
# which packs this repository the way npm would and then reads `dsh.bundle` from
# the installed manifest. So what a real user gets is decided by the pack list,
# not by the working tree: a plugin file that packs but a patch file that does
# not (or vice versa) installs a profile layer that cannot load.
#
# This packs the repository into a scratch directory and asserts the installed
# tree can satisfy the bundle declaration on its own. It also confirms the
# plugin's import surface is Node builtins only — dsh nests `@deepseek-ai/*`
# inside its own installation, so a profile plugin cannot resolve them, and a
# profile install pulls in one package; the plugin must not need a second one.
#
# CI-safe: needs npm (already required to pack), not dsh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

echo "test-dsh-install: packing the repository the way an install would"

if ! command -v npm >/dev/null 2>&1; then
  echo "SKIP: npm is not on PATH"
  exit 0
fi

# Staging directory in a path Node can resolve on every platform.
# `mktemp -d` on macOS/Linux produces a /tmp/... path; on Windows MSYS bash
# it produces a /tmp/... path that Node rejects. Going through Node's
# os.tmpdir() gives us a path Node knows about on every host.
# `process.stdout.write` (not bare expression) is required because Node
# in `-e` mode does not echo return values to stdout the way the REPL does.
STAGING="$(node -e "process.stdout.write(require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'dsh-prtest-')))")"
# Cleanup: prefer mavis-trash when available (faster, traces deletion),
# fall back to portable `rm -rf` on machines that don't have it (CI,
# contributor machines, Windows MSYS bash). The trap is defensive — the
# `[ -n "$STAGING" ] &&` guard prevents an empty arg if mkdtemp failed
# before the trap fires.
trap '[ -n "$STAGING" ] && (command -v mavis-trash >/dev/null 2>&1 && mavis-trash "$STAGING" || rm -rf "$STAGING")' EXIT

TARBALL="$(cd "$REPO_ROOT" && npm pack --silent --pack-destination "$STAGING")"
[ -n "$TARBALL" ] || fail "npm pack produced no tarball"

tar -xzf "$STAGING/$TARBALL" -C "$STAGING"
INSTALLED="$STAGING/package"
[ -d "$INSTALLED" ] || fail "packed tarball has no package/ root"

# 1. The installed manifest declares the bundle patch and it resolves to a
#    real file inside the installed tree.
PATCH_REL="$(node -p "require('$INSTALLED/package.json').dsh.bundle.patch")"
[ -n "$PATCH_REL" ] || fail "installed manifest declares no dsh.bundle.patch"

PATCH="$INSTALLED/$PATCH_REL"
[ -f "$PATCH" ] || fail "the installed tree is missing the bundle patch at $PATCH_REL"

# 2. The patch names its plugin as a package-relative deep import
#    (`superpowers/<path>`); resolve it back to a file inside the installed
#    tree, and confirm the file is valid JavaScript.
MODULE_REL="$(sed -n 's|^ *name: superpowers/||p' "$PATCH")"
[ -n "$MODULE_REL" ] || fail "the bundle patch names no superpowers/... plugin module"
[ -f "$INSTALLED/$MODULE_REL" ] || fail "the installed tree is missing the plugin at $MODULE_REL"

node --check "$INSTALLED/$MODULE_REL" || fail "the installed plugin is not valid JavaScript"

# 3. The bootstrap skill the plugin reads is present in the installed tree.
[ -f "$INSTALLED/skills/using-superpowers/SKILL.md" ] \
  || fail "the installed tree is missing the bootstrap skill the plugin reads"

# 4. A profile installs one package; the plugin must not need a second one.
#    Node builtins are all it gets.
DEPS="$(node -p "Object.keys(require('$INSTALLED/package.json').dependencies || {}).join(' ')")"
[ -z "$DEPS" ] || fail "the installed package pulls in runtime dependencies: $DEPS"

FOREIGN="$(node -e "
const source = require('fs').readFileSync(process.argv[1], 'utf8');
const specifiers = [...source.matchAll(/^import [^']*'([^']+)'/gm)].map((m) => m[1]);
process.stdout.write(specifiers.filter((s) => !s.startsWith('node:')).join(' '));
" "$INSTALLED/$MODULE_REL")"
[ -z "$FOREIGN" ] || fail "the plugin imports non-builtin modules: $FOREIGN"

# 5. The plugin source explicitly names the bootstrap skill, so the patch
#    from the installed manifest and the plugin agree on what they ship.
grep -q "using-superpowers" "$INSTALLED/$MODULE_REL" \
  || fail "the plugin source never names the using-superpowers bootstrap"

echo "PASS: DeepSeek Harness bundle installs as a self-contained profile layer"
