#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATE_BIN="$REPO_ROOT/bin/superpowers-migrate-install"

make_source_repo() {
  local dir="$1"
  git init "$dir" >/dev/null 2>&1
  git -C "$dir" config user.name "Superpowers Test"
  git -C "$dir" config user.email "superpowers-tests@example.com"
  mkdir -p "$dir/bin" "$dir/agents" "$dir/.codex/agents"
  : > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  : > "$dir/bin/superpowers-config"
  chmod +x "$dir/bin/superpowers-config"
  printf '# reviewer\n' > "$dir/agents/code-reviewer.md"
  printf 'name = "code-reviewer"\ndescription = "reviewer"\ndeveloper_instructions = """review"""' > "$dir/.codex/agents/code-reviewer.toml"
  printf '1.0.0\n' > "$dir/VERSION"
  git -C "$dir" add VERSION bin/superpowers-update-check bin/superpowers-config agents/code-reviewer.md .codex/agents/code-reviewer.toml
  git -C "$dir" commit -m "init" >/dev/null 2>&1
}

make_install_repo() {
  local dir="$1"
  local version="$2"
  local commit_ts="${3:-}"
  git init "$dir" >/dev/null 2>&1
  git -C "$dir" config user.name "Superpowers Test"
  git -C "$dir" config user.email "superpowers-tests@example.com"
  mkdir -p "$dir/bin" "$dir/agents" "$dir/.codex/agents"
  : > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  : > "$dir/bin/superpowers-config"
  chmod +x "$dir/bin/superpowers-config"
  printf '# reviewer\n' > "$dir/agents/code-reviewer.md"
  printf 'name = "code-reviewer"\ndescription = "reviewer"\ndeveloper_instructions = """review"""' > "$dir/.codex/agents/code-reviewer.toml"
  printf '%s\n' "$version" > "$dir/VERSION"
  git -C "$dir" add VERSION bin/superpowers-update-check bin/superpowers-config agents/code-reviewer.md .codex/agents/code-reviewer.toml
  if [[ -n "$commit_ts" ]]; then
    GIT_AUTHOR_DATE="@$commit_ts" GIT_COMMITTER_DATE="@$commit_ts" \
      git -C "$dir" commit -m "init-$version" >/dev/null 2>&1
  else
    git -C "$dir" commit -m "init-$version" >/dev/null 2>&1
  fi
}

run_migrate() {
  local home_dir="$1"
  local shared_root="$2"
  local codex_root="$3"
  local copilot_root="$4"
  local repo_url="$5"
  HOME="$home_dir" \
    SUPERPOWERS_SHARED_ROOT="$shared_root" \
    SUPERPOWERS_CODEX_ROOT="$codex_root" \
    SUPERPOWERS_COPILOT_ROOT="$copilot_root" \
    SUPERPOWERS_REPO_URL="$repo_url" \
    "$MIGRATE_BIN"
}

require_contains() {
  local haystack="$1"
  local needle="$2"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "Expected output to contain: $needle"
    printf '%s\n' "$haystack"
    exit 1
  fi
}

require_valid_install() {
  local dir="$1"
  [[ -x "$dir/bin/superpowers-update-check" ]] || {
    echo "Expected $dir to contain bin/superpowers-update-check"
    exit 1
  }
  [[ -x "$dir/bin/superpowers-config" ]] || {
    echo "Expected $dir to contain bin/superpowers-config"
    exit 1
  }
  [[ -f "$dir/VERSION" ]] || {
    echo "Expected $dir to contain VERSION"
    exit 1
  }
  [[ -f "$dir/agents/code-reviewer.md" ]] || {
    echo "Expected $dir to contain agents/code-reviewer.md"
    exit 1
  }
  [[ -f "$dir/.codex/agents/code-reviewer.toml" ]] || {
    echo "Expected $dir to contain .codex/agents/code-reviewer.toml"
    exit 1
  }
}

make_legacy_install_without_config() {
  local dir="$1"
  local version="$2"
  git init "$dir" >/dev/null 2>&1
  git -C "$dir" config user.name "Superpowers Test"
  git -C "$dir" config user.email "superpowers-tests@example.com"
  mkdir -p "$dir/bin"
  : > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  printf '%s\n' "$version" > "$dir/VERSION"
  git -C "$dir" add VERSION bin/superpowers-update-check
  git -C "$dir" commit -m "legacy-$version" >/dev/null 2>&1
}

make_legacy_install_without_reviewers() {
  local dir="$1"
  local version="$2"
  git init "$dir" >/dev/null 2>&1
  git -C "$dir" config user.name "Superpowers Test"
  git -C "$dir" config user.email "superpowers-tests@example.com"
  mkdir -p "$dir/bin"
  : > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  : > "$dir/bin/superpowers-config"
  chmod +x "$dir/bin/superpowers-config"
  printf '%s\n' "$version" > "$dir/VERSION"
  git -C "$dir" add VERSION bin/superpowers-update-check bin/superpowers-config
  git -C "$dir" commit -m "legacy-no-reviewers-$version" >/dev/null 2>&1
}

require_link_target() {
  local path="$1"
  local target="$2"
  if [[ ! -L "$path" ]]; then
    echo "Expected $path to be a symlink"
    exit 1
  fi
  local resolved
  resolved="$(cd "$path/.." && cd "$(dirname "$(readlink "$path")")" && pwd -P)/$(basename "$(readlink "$path")")"
  local expected
  expected="$(cd "$target" && pwd -P)"
  if [[ "$resolved" != "$expected" ]]; then
    echo "Expected $path to point to $expected, got $resolved"
    exit 1
  fi
}

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

source_repo="$tmp_root/source.git"
make_source_repo "$source_repo"

home_dir="$tmp_root/fresh-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$home_dir"
fresh_output="$(run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo")"
require_valid_install "$shared_root"
[[ ! -e "$codex_root" ]] || {
  echo "Expected no legacy Codex root for fresh install"
  exit 1
}
[[ ! -e "$copilot_root" ]] || {
  echo "Expected no legacy Copilot root for fresh install"
  exit 1
}
require_contains "$fresh_output" "Codex next step:"
require_contains "$fresh_output" "~/.agents/skills/superpowers"
require_contains "$fresh_output" "~/.codex/agents/code-reviewer.toml"
require_contains "$fresh_output" "GitHub Copilot next step:"
require_contains "$fresh_output" "~/.copilot/skills/superpowers"
require_contains "$fresh_output" "code-reviewer.agent.md"

home_dir="$tmp_root/codex-only-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$codex_root")"
make_install_repo "$codex_root" "2.0.0"
run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo" >/dev/null
require_valid_install "$shared_root"
require_link_target "$codex_root" "$shared_root"
[[ ! -e "$copilot_root" ]] || {
  echo "Expected untouched missing Copilot root when only Codex existed"
  exit 1
}

home_dir="$tmp_root/copilot-only-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$copilot_root")"
make_install_repo "$copilot_root" "3.0.0"
copilot_output="$(run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo")"
require_valid_install "$shared_root"
require_link_target "$copilot_root" "$shared_root"
[[ ! -e "$codex_root" ]] || {
  echo "Expected untouched missing Codex root when only Copilot existed"
  exit 1
}
require_contains "$copilot_output" "GitHub Copilot next step:"
require_contains "$copilot_output" "~/.copilot/agents/code-reviewer.agent.md"
require_contains "$copilot_output" "copy on Windows; symlink on Unix-like installs"

home_dir="$tmp_root/legacy-missing-config-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$codex_root")"
make_legacy_install_without_config "$codex_root" "4.9.0"
legacy_missing_output="$(run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo")"
require_valid_install "$shared_root"
if [[ "$(tr -d '[:space:]' < "$shared_root/VERSION")" != "1.0.0" ]]; then
  echo "Expected invalid legacy installs without superpowers-config to be replaced by a fresh shared clone"
  exit 1
fi
require_link_target "$codex_root" "$shared_root"
legacy_backup_count="$(find "$(dirname "$codex_root")" -maxdepth 1 -name 'superpowers.backup-*' | wc -l | tr -d ' ')"
if [[ "$legacy_backup_count" -lt 1 ]]; then
  echo "Expected invalid legacy install without superpowers-config to be backed up"
  exit 1
fi
require_contains "$legacy_missing_output" "Cloned shared install to $shared_root"
require_contains "$legacy_missing_output" "Backed up legacy install at $codex_root"

home_dir="$tmp_root/legacy-missing-reviewers-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$codex_root")"
make_legacy_install_without_reviewers "$codex_root" "4.9.1"
legacy_missing_reviewers_output="$(run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo")"
require_valid_install "$shared_root"
if [[ "$(tr -d '[:space:]' < "$shared_root/VERSION")" != "1.0.0" ]]; then
  echo "Expected legacy installs missing reviewer artifacts to be replaced by a fresh shared clone"
  exit 1
fi
require_link_target "$codex_root" "$shared_root"
legacy_reviewers_backup_count="$(find "$(dirname "$codex_root")" -maxdepth 1 -name 'superpowers.backup-*' | wc -l | tr -d ' ')"
if [[ "$legacy_reviewers_backup_count" -lt 1 ]]; then
  echo "Expected invalid legacy install missing reviewer artifacts to be backed up"
  exit 1
fi
require_contains "$legacy_missing_reviewers_output" "Cloned shared install to $shared_root"
require_contains "$legacy_missing_reviewers_output" "Backed up legacy install at $codex_root"

home_dir="$tmp_root/dual-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$codex_root")" "$(dirname "$copilot_root")"
make_install_repo "$codex_root" "4.0.0" "1700000000"
make_install_repo "$copilot_root" "5.0.0" "1700000100"
run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo" >/dev/null
require_valid_install "$shared_root"
if [[ "$(tr -d '[:space:]' < "$shared_root/VERSION")" != "5.0.0" ]]; then
  echo "Expected newer Copilot checkout to win dual-root migration"
  exit 1
fi
require_link_target "$codex_root" "$shared_root"
require_link_target "$copilot_root" "$shared_root"
backup_count="$(find "$(dirname "$codex_root")" -maxdepth 1 -name 'superpowers.backup-*' | wc -l | tr -d ' ')"
if [[ "$backup_count" -lt 1 ]]; then
  echo "Expected non-selected legacy checkout to be backed up"
  exit 1
fi

home_dir="$tmp_root/ambiguous-home"
shared_root="$home_dir/.superpowers/install"
codex_root="$home_dir/.codex/superpowers"
copilot_root="$home_dir/.copilot/superpowers"
mkdir -p "$(dirname "$codex_root")" "$(dirname "$copilot_root")"
make_install_repo "$codex_root" "6.0.0" "1700000200"
make_install_repo "$copilot_root" "7.0.0" "1700000200"
set +e
ambiguous_output="$(run_migrate "$home_dir" "$shared_root" "$codex_root" "$copilot_root" "$source_repo" 2>&1)"
ambiguous_status=$?
set -e
if [[ "$ambiguous_status" -eq 0 ]]; then
  echo "Expected ambiguous dual-root migration to fail"
  exit 1
fi
if [[ "$ambiguous_output" != *"manual reconciliation"* ]]; then
  echo "Expected ambiguous migration failure to mention manual reconciliation"
  printf '%s\n' "$ambiguous_output"
  exit 1
fi

echo "superpowers-migrate-install regression test passed."
