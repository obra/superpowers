#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/superpowers-upgrade/SKILL.md"

extract_bash_block() {
  local heading="$1"
  awk -v heading="$heading" '
    $0 == heading { in_heading = 1; next }
    in_heading && /^```bash$/ { in_block = 1; next }
    in_block && /^```$/ { exit }
    in_block { print }
  ' "$SKILL_FILE"
}

require_pattern() {
  local pattern="$1"
  if ! rg -n -F "$pattern" "$SKILL_FILE" >/dev/null; then
    echo "Missing expected upgrade-skill pattern: $pattern"
    exit 1
  fi
}

make_valid_install() {
  local dir="$1"
  local git_mode="$2"
  mkdir -p "$dir/bin"
  : > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  : > "$dir/bin/superpowers-config"
  chmod +x "$dir/bin/superpowers-config"
  printf '1.0.0\n' > "$dir/VERSION"
  if [[ "$git_mode" = "dir" ]]; then
    mkdir -p "$dir/.git"
  else
    printf 'gitdir: /tmp/fake-worktree\n' > "$dir/.git"
  fi
}

make_valid_worktree_install() {
  local base_dir="$1"
  local main_repo="$base_dir/main-repo"
  local worktree_root="$base_dir/worktree/superpowers"

  git init "$main_repo" >/dev/null 2>&1
  git -C "$main_repo" config user.name "Superpowers Test"
  git -C "$main_repo" config user.email "superpowers-tests@example.com"
  mkdir -p "$main_repo/bin"
  : > "$main_repo/bin/superpowers-update-check"
  chmod +x "$main_repo/bin/superpowers-update-check"
  : > "$main_repo/bin/superpowers-config"
  chmod +x "$main_repo/bin/superpowers-config"
  printf '1.0.0\n' > "$main_repo/VERSION"
  git -C "$main_repo" add VERSION bin/superpowers-update-check bin/superpowers-config
  git -C "$main_repo" commit -m "init" >/dev/null 2>&1

  mkdir -p "$(dirname "$worktree_root")"
  git -C "$main_repo" worktree add "$worktree_root" -b runtime-worktree >/dev/null 2>&1
  printf '%s\n' "$worktree_root"
}

run_step_one() {
  local cwd="$1"
  local home_dir="$2"
  local superpowers_root="${3:-}"
  local step_one
  step_one="$(extract_bash_block "### Step 1: Resolve install root")"
  (
    cd "$cwd"
    HOME="$home_dir" \
    _SUPERPOWERS_ROOT="$superpowers_root" \
    bash -euo pipefail -c "$step_one"
  )
}

run_version_step() {
  local install_dir="$1"
  local remote_url="${2:-}"
  local step_two
  step_two="$(extract_bash_block "### Step 2: Resolve versions and auto-upgrade preference")"
  (
    INSTALL_DIR="$install_dir" \
    SUPERPOWERS_REMOTE_URL="$remote_url" \
    bash -euo pipefail -c "$step_two"
  )
}

require_pattern '_SUPERPOWERS_ROOT'
require_pattern '_IS_SUPERPOWERS_RUNTIME_ROOT()'
require_pattern 'bin/superpowers-update-check'
require_pattern 'bin/superpowers-config'
require_pattern 'VERSION'
require_pattern '[ -d "$candidate/.git" ] || [ -f "$candidate/.git" ]'
require_pattern '"$HOME/.superpowers/install"'
require_pattern 'Read `$INSTALL_DIR/RELEASE-NOTES.md`.'
require_pattern 'git stash push --include-untracked'
require_pattern 'git stash pop'
require_pattern 'ERROR: superpowers upgrade failed during git pull'
require_pattern 'Run $CONFIG_BIN set update_check true to re-enable.'
require_pattern 'REMOTE_URL="${SUPERPOWERS_REMOTE_URL:-https://raw.githubusercontent.com/dmulcahey/superpowers/main/VERSION}"'
require_pattern 'REMOTE_STATUS='
require_pattern 'VERSION_RELATION='
require_pattern 'If `REMOTE_STATUS=unavailable` and this skill was invoked directly, stop before Step 3.'
require_pattern 'Superpowers couldn'\''t verify the latest version right now.'
require_pattern 'If `VERSION_RELATION=equal`, tell the user: `You'\''re already on the latest known version (v$LOCAL_VERSION).`'
require_pattern 'If `VERSION_RELATION=local_ahead`, tell the user: `Your local Superpowers install (v$LOCAL_VERSION) is newer than the fetched remote version (v$REMOTE_VERSION).`'
require_pattern 'If this skill was invoked from an `UPGRADE_AVAILABLE` handoff'
require_pattern 'You'\''re already on the latest known version (v$LOCAL_VERSION).'

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

home_dir="$tmp_root/home-active-root"
mkdir -p "$home_dir/.superpowers" "$home_dir/.codex" "$home_dir/.copilot"
shared_install="$home_dir/.superpowers/install"
codex_install="$home_dir/.codex/superpowers"
copilot_install="$home_dir/.copilot/superpowers"
make_valid_install "$shared_install" dir
make_valid_install "$codex_install" dir
make_valid_install "$copilot_install" dir
project_dir="$tmp_root/project"
mkdir -p "$project_dir"
active_output="$(run_step_one "$project_dir" "$home_dir" "$copilot_install")"
if [[ "$active_output" != *"INSTALL_DIR=$copilot_install"* ]]; then
  echo "Expected active _SUPERPOWERS_ROOT to win over fallback installs, got:"
  printf '%s\n' "$active_output"
  exit 1
fi

fallback_output="$(run_step_one "$project_dir" "$home_dir" "")"
if [[ "$fallback_output" != *"INSTALL_DIR=$shared_install"* ]]; then
  echo "Expected shared install root to beat legacy fallback installs, got:"
  printf '%s\n' "$fallback_output"
  exit 1
fi

renamed_home="$tmp_root/home-renamed-runtime"
mkdir -p "$renamed_home/.superpowers" "$renamed_home/.codex" "$renamed_home/.copilot"
renamed_shared="$renamed_home/.superpowers/install"
renamed_codex="$renamed_home/.codex/superpowers"
renamed_copilot="$renamed_home/.copilot/superpowers"
make_valid_install "$renamed_shared" dir
make_valid_install "$renamed_codex" dir
make_valid_install "$renamed_copilot" dir
renamed_root="$tmp_root/custom-runtime-name"
git init "$renamed_root" >/dev/null 2>&1
make_valid_install "$renamed_root" dir
renamed_root_resolved="$(cd "$renamed_root" && pwd -P)"
renamed_output="$(run_step_one "$renamed_root" "$renamed_home" "")"
if [[ "$renamed_output" != *"INSTALL_DIR=$renamed_root_resolved"* ]]; then
  echo "Expected a valid current repo with a non-superpowers basename to win install resolution, got:"
  printf '%s\n' "$renamed_output"
  exit 1
fi

invalid_home="$tmp_root/home-invalid-current"
mkdir -p "$invalid_home"
invalid_root="$tmp_root/invalid-current/superpowers"
mkdir -p "$invalid_root/.git"
set +e
invalid_output="$(run_step_one "$invalid_root" "$invalid_home" "" 2>&1)"
invalid_status=$?
set -e
if [[ "$invalid_status" -eq 0 ]]; then
  echo "Expected invalid current repo named superpowers to be rejected."
  exit 1
fi
if [[ "$invalid_output" != *"ERROR: superpowers install not found"* ]]; then
  echo "Expected invalid current repo failure message, got:"
  printf '%s\n' "$invalid_output"
  exit 1
fi

worktree_home="$tmp_root/home-worktree"
mkdir -p "$worktree_home"
worktree_root="$(make_valid_worktree_install "$tmp_root/worktree-current")"
worktree_root_resolved="$(cd "$worktree_root" && pwd -P)"
worktree_output="$(run_step_one "$worktree_root" "$worktree_home" "")"
if [[ "$worktree_output" != *"INSTALL_DIR=$worktree_root_resolved"* ]]; then
  echo "Expected current worktree install to be accepted, got:"
  printf '%s\n' "$worktree_output"
  exit 1
fi

version_root="$tmp_root/version-checks"
mkdir -p "$version_root"

behind_install="$version_root/behind"
make_valid_install "$behind_install" dir
printf '5.1.2\n' > "$behind_install/VERSION"
behind_remote="$(mktemp)"
printf '5.1.10\n' > "$behind_remote"
behind_output="$(run_version_step "$behind_install" "file://$behind_remote")"
if [[ "$behind_output" != *"LOCAL_VERSION=5.1.2"* || "$behind_output" != *"REMOTE_VERSION=5.1.10"* || "$behind_output" != *"VERSION_RELATION=upgrade"* ]]; then
  echo "Expected direct invocation to detect a real newer version, got:"
  printf '%s\n' "$behind_output"
  exit 1
fi

equal_install="$version_root/equal"
make_valid_install "$equal_install" dir
printf '5.1.0\n' > "$equal_install/VERSION"
equal_remote="$(mktemp)"
printf '5.1\n' > "$equal_remote"
equal_output="$(run_version_step "$equal_install" "file://$equal_remote")"
if [[ "$equal_output" != *"LOCAL_VERSION=5.1.0"* || "$equal_output" != *"REMOTE_VERSION=5.1"* || "$equal_output" != *"VERSION_RELATION=equal"* ]]; then
  echo "Expected direct invocation to treat normalized equal versions as up to date, got:"
  printf '%s\n' "$equal_output"
  exit 1
fi

ahead_install="$version_root/ahead"
make_valid_install "$ahead_install" dir
printf '5.2.0\n' > "$ahead_install/VERSION"
ahead_remote="$(mktemp)"
printf '5.1.9\n' > "$ahead_remote"
ahead_output="$(run_version_step "$ahead_install" "file://$ahead_remote")"
if [[ "$ahead_output" != *"LOCAL_VERSION=5.2.0"* || "$ahead_output" != *"REMOTE_VERSION=5.1.9"* || "$ahead_output" != *"VERSION_RELATION=local_ahead"* ]]; then
  echo "Expected direct invocation to stop on local-ahead installs, got:"
  printf '%s\n' "$ahead_output"
  exit 1
fi

unavailable_install="$version_root/unavailable"
make_valid_install "$unavailable_install" dir
printf '5.1.0\n' > "$unavailable_install/VERSION"
unavailable_output="$(run_version_step "$unavailable_install" "file://$version_root/does-not-exist")"
if [[ "$unavailable_output" != *"LOCAL_VERSION=5.1.0"* || "$unavailable_output" != *"REMOTE_VERSION="* || "$unavailable_output" != *"REMOTE_STATUS=unavailable"* || "$unavailable_output" != *"VERSION_RELATION=unknown"* ]]; then
  echo "Expected direct invocation to distinguish remote version lookup failure from an up-to-date install, got:"
  printf '%s\n' "$unavailable_output"
  exit 1
fi

echo "superpowers-upgrade skill regression test passed."
