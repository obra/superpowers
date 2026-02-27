#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

info() {
    echo "[INFO] $*"
}

pass() {
    echo "[PASS] $*"
}

fail() {
    echo "[FAIL] $*" >&2
    exit 1
}

require_command() {
    local cmd="$1"
    command -v "$cmd" >/dev/null 2>&1 || fail "missing required command: $cmd"
}

hash_file() {
    local path="$1"
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$path" | awk '{print $1}'
        return
    fi

    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$path" | awk '{print $1}'
        return
    fi

    fail "missing required command: shasum or sha256sum"
}

file_state() {
    local path="$1"
    if [ -f "$path" ]; then
        local digest
        digest="$(hash_file "$path")"
        printf 'file:%s\n' "$digest"
    else
        printf 'missing\n'
    fi
}

info "Pi smoke test: isolated install + skill discovery"

require_command pi
require_command node

DEFAULT_SETTINGS="$HOME/.pi/agent/settings.json"
DEFAULT_STATE_BEFORE="$(file_state "$DEFAULT_SETTINGS")"

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/superpowers-pi-smoke.XXXXXX")"
cleanup() {
    rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

export PI_CODING_AGENT_DIR="$TMP_ROOT/agent"
mkdir -p "$PI_CODING_AGENT_DIR"

PI_BIN="$(command -v pi)"
if ! PI_REALPATH="$(node -e 'const fs=require("fs");console.log(fs.realpathSync(process.argv[1]))' "$PI_BIN" 2>/dev/null)"; then
    fail "unable to resolve pi binary path"
fi
PI_PACKAGE_ROOT="$(cd "$(dirname "$PI_REALPATH")/.." && pwd)"

info "Using isolated PI_CODING_AGENT_DIR: $PI_CODING_AGENT_DIR"
info "Installing package from: $REPO_ROOT"

if INSTALL_OUTPUT="$(pi install "$REPO_ROOT" 2>&1)"; then
    echo "$INSTALL_OUTPUT"
    pass "pi install succeeded in isolated agent dir"
else
    echo "$INSTALL_OUTPUT" >&2
    fail "pi install failed"
fi

SETTINGS_FILE="$PI_CODING_AGENT_DIR/settings.json"
[ -f "$SETTINGS_FILE" ] || fail "expected settings file not found: $SETTINGS_FILE"
pass "isolated settings file created"

export REPO_ROOT PI_PACKAGE_ROOT SETTINGS_FILE
if DISCOVERY_OUTPUT="$(node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(process.env.REPO_ROOT);
const settingsPath = process.env.SETTINGS_FILE;
const packageRoot = process.env.PI_PACKAGE_ROOT;
const agentDir = process.env.PI_CODING_AGENT_DIR;

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const packages = Array.isArray(settings.packages) ? settings.packages : [];
const sources = packages
  .map((entry) => (typeof entry === 'string' ? entry : entry?.source))
  .filter(Boolean);

const hasRepoSource = sources.some((source) => path.resolve(agentDir, source) === repoRoot);
if (!hasRepoSource) {
  console.error(`settings.json does not contain repository source for ${repoRoot}`);
  process.exit(1);
}

const { SettingsManager } = await import(
  pathToFileURL(path.join(packageRoot, 'dist/core/settings-manager.js')).href
);
const { DefaultPackageManager } = await import(
  pathToFileURL(path.join(packageRoot, 'dist/core/package-manager.js')).href
);

const settingsManager = SettingsManager.create(repoRoot, agentDir);
const packageManager = new DefaultPackageManager({
  cwd: repoRoot,
  agentDir,
  settingsManager,
});

const resolved = await packageManager.resolve();
const enabledSkillPaths = resolved.skills.filter((skill) => skill.enabled).map((skill) => path.resolve(skill.path));
const brainstormingSkill = path.join(repoRoot, 'skills', 'brainstorming', 'SKILL.md');

if (!enabledSkillPaths.includes(brainstormingSkill)) {
  console.error('brainstorming skill was not discoverable in resolved skills');
  process.exit(1);
}

console.log(`Resolved skills: ${enabledSkillPaths.length}`);
console.log(`Found: ${brainstormingSkill}`);
NODE
)"; then
    echo "$DISCOVERY_OUTPUT"
    pass "Pi resolves brainstorming skill from installed package"
else
    echo "$DISCOVERY_OUTPUT" >&2
    fail "skill discovery check failed"
fi

if LIST_OUTPUT="$(pi list 2>&1)"; then
    echo "$LIST_OUTPUT"
else
    echo "$LIST_OUTPUT" >&2
    fail "pi list failed"
fi

echo "$LIST_OUTPUT" | grep -Fq "$REPO_ROOT" || fail "pi list output did not include installed repository path"
pass "pi list reports installed package"

DEFAULT_STATE_AFTER="$(file_state "$DEFAULT_SETTINGS")"
[ "$DEFAULT_STATE_BEFORE" = "$DEFAULT_STATE_AFTER" ] || fail "global ~/.pi/agent/settings.json changed; install was not isolated"
pass "global ~/.pi/agent/settings.json unchanged"

echo "All Pi smoke checks passed."
