#!/usr/bin/env bash
# Simple manager for installing, migrating, updating, or removing the Superpowers skills on Codex as described in .codex/INSTALL.md.
set -euo pipefail
IFS=$'\n\t'

REPO_URL="https://github.com/obra/superpowers.git"
HOME_DIR="${HOME:?HOME not set}"
REPO_DIR="$HOME_DIR/.codex/superpowers"
SKILLS_LINK_DIR="$HOME_DIR/.agents/skills"
LINK_PATH="$SKILLS_LINK_DIR/superpowers"
REPO_SKILLS_DIR="$REPO_DIR/skills"

IS_WINDOWS=0
PWSH_BIN=()

info() {
  printf "[INFO] %s\n" "$1"
}

error() {
  printf "[ERROR] %s\n" "$1" >&2
}

fatal() {
  error "$1"
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_platform() {
  local uname
  uname=$(uname -s 2>/dev/null || echo unknown)
  case "$uname" in
    MINGW*|MSYS*|CYGWIN*)
      IS_WINDOWS=1
      if command_exists pwsh; then
        PWSH_BIN=(pwsh -NoProfile -NonInteractive -Command)
      elif command_exists powershell; then
        PWSH_BIN=(powershell -NoProfile -NonInteractive -Command)
      else
        fatal "PowerShell (pwsh/powershell) is required on Windows to manage functions."
      fi
      ;;
    *)
      IS_WINDOWS=0
      ;;
  esac
}

ps_escape() {
  printf "%s" "$1" | sed "s/'/''/g"
}

run_powershell() {
  local cmd="$1"
  if [ ${#PWSH_BIN[@]} -eq 0 ]; then
    fatal "PowerShell binary unavailable."
  fi
  "${PWSH_BIN[@]}" "$cmd"
}

ensure_git() {
  if ! command_exists git; then
    fatal "git is required but not installed."
  fi
}

check_condition() {
  local label="$1"
  shift
  if "$@"; then
    printf "  [OK] %s\n" "$label"
    return 0
  else
    printf "  [FAIL] %s\n" "$label"
    return 1
  fi
}

health_check() {
  if [ ! -d "$HOME_DIR" ]; then
    fatal "home directory $HOME_DIR does not exist."
  fi
  if [ ! -w "$HOME_DIR" ]; then
    fatal "no write permission for $HOME_DIR."
  fi
  ensure_git
  ensure_skills_link_dir
  if [ $IS_WINDOWS -eq 1 ] && [ ${#PWSH_BIN[@]} -eq 0 ]; then
    fatal "PowerShell is required on Windows."
  fi
  info "Health check passed."
}

doctor() {
  info "Doctor mode: verifying prerequisites for install/update/migrate/remove."
  local failures=0
  check_condition "Home directory $HOME_DIR exists (required by all commands)" test -d "$HOME_DIR" || failures=1
  check_condition "Home directory writable (needed to clone/pull and create links)" test -w "$HOME_DIR" || failures=1
  check_condition "Git command available (install/update/migrate)" command_exists git || failures=1
  local parent_dir
  parent_dir=$(dirname "$SKILLS_LINK_DIR")
  if [ -d "$SKILLS_LINK_DIR" ]; then
    check_condition "Skills directory $SKILLS_LINK_DIR writable (link target)" test -w "$SKILLS_LINK_DIR" || failures=1
  else
    if [ -d "$parent_dir" ]; then
      check_condition "Skills parent directory $parent_dir writable (needed to create link dir)" test -w "$parent_dir" || failures=1
    else
      local grandparent
      grandparent=$(dirname "$parent_dir")
      if [ -w "$grandparent" ]; then
        printf "  [INFO] Directory $parent_dir missing; grandparent $grandparent is writable and can host it.\n"
      else
        printf "  [FAIL] Cannot create $SKILLS_LINK_DIR; grandparent $grandparent is not writable.\n"
        failures=1
      fi
    fi
  fi
  if [ $IS_WINDOWS -eq 1 ]; then
    if command_exists pwsh; then
      check_condition "pwsh available (Windows linking)" command_exists pwsh || failures=1
    elif command_exists powershell; then
      check_condition "powershell available (Windows linking)" command_exists powershell || failures=1
    else
      printf "  [FAIL] PowerShell (pwsh/powershell) missing; Windows linking cannot work.\n"
      failures=1
    fi
  fi

  if [ -d "$REPO_DIR/.git" ]; then
    check_condition "Superpowers repo clone exists at $REPO_DIR" test -d "$REPO_DIR/.git" || failures=1
  else
    printf "  [INFO] Superpowers repo not cloned yet; install will create $REPO_DIR.\n"
  fi

  local agents_file="$HOME_DIR/.codex/AGENTS.md"
  if [ -f "$agents_file" ]; then
    if grep -q "superpowers-codex bootstrap" "$agents_file"; then
      printf "  [FAIL] %s still references the legacy bootstrap block; remove it.\n" "$agents_file"
      failures=1
    else
      printf "  [OK] %s contains no legacy bootstrap block.\n" "$agents_file"
    fi
  else
    printf "  [INFO] %s not present; no legacy bootstrap block to remove.\n" "$agents_file"
  fi

  if [ $failures -ne 0 ]; then
    error "Doctor found missing prerequisites. Fix the failures above before rerunning."
    exit 1
  fi
  info "Doctor check passed."
}

ensure_repo() {
  if [ -d "$REPO_DIR/.git" ]; then
    info "Updating existing superpowers repo..."
    git -C "$REPO_DIR" fetch --all --prune || fatal "git fetch failed."
    git -C "$REPO_DIR" pull --ff-only || fatal "git pull failed."
  else
    info "Cloning superpowers repo into $REPO_DIR..."
    git clone "$REPO_URL" "$REPO_DIR" || fatal "git clone failed."
  fi
}

ensure_skills_link_dir() {
  if [ ! -d "$SKILLS_LINK_DIR" ]; then
    info "Creating skills directory $SKILLS_LINK_DIR..."
    mkdir -p "$SKILLS_LINK_DIR" || fatal "failed to create skills directory."
  fi
}

remove_link() {
  if [ -L "$LINK_PATH" ] || [ -d "$LINK_PATH" ]; then
    if [ $IS_WINDOWS -eq 1 ]; then
      local link_path="$(ps_escape "$LINK_PATH")"
      info "Removing Windows link $LINK_PATH..."
      run_powershell "if (Test-Path -LiteralPath '$link_path') { Remove-Item -LiteralPath '$link_path' -Force -Recurse }"
    else
      info "Removing existing link $LINK_PATH..."
      rm -rf "$LINK_PATH" || fatal "failed to remove existing link."
    fi
  fi
}

create_link() {
  ensure_skills_link_dir
  if [ ! -d "$REPO_SKILLS_DIR" ]; then
    fatal "expected skills directory not found at $REPO_SKILLS_DIR. Run install first."
  fi
  remove_link
  if [ $IS_WINDOWS -eq 1 ]; then
    local target="$(ps_escape "$REPO_SKILLS_DIR")"
    local link_path="$(ps_escape "$LINK_PATH")"
    info "Creating PowerShell symbolic link from $LINK_PATH to $REPO_SKILLS_DIR..."
    run_powershell "New-Item -ItemType SymbolicLink -Path '$link_path' -Target '$target' -Force | Out-Null"
  else
    info "Linking $LINK_PATH -> $REPO_SKILLS_DIR..."
    ln -sfn "$REPO_SKILLS_DIR" "$LINK_PATH" || fatal "failed to create symlink."
  fi
  info "Link ready."
}

remove_clone() {
  if [ -d "$REPO_DIR" ]; then
    info "Removing local clone at $REPO_DIR..."
    rm -rf "$REPO_DIR" || fatal "failed to remove clone."
  fi
}

check_old_bootstrap() {
  local agents_file="$HOME_DIR/.codex/AGENTS.md"
  if [ -f "$agents_file" ]; then
    if grep -q "superpowers-codex bootstrap" "$agents_file"; then
      printf "\n[NOTICE] It looks like your %s still references the old superpowers-codex bootstrap block.\n" "$agents_file"
      printf "Please remove that block to avoid conflicts, then restart Codex.\n\n"
    fi
  fi
}

install_or_update() {
  ensure_repo
  create_link
}

run_install() {
  install_or_update
  check_old_bootstrap
  info "Install complete. Restart Codex to load the skills."
}

run_update() {
  install_or_update
  info "Install/update complete. Restart Codex if needed."
}

run_migrate() {
  install_or_update
  check_old_bootstrap
  info "Migration complete. Old bootstrap warnings cleared."
}

run_remove() {
  remove_link
  remove_clone
  info "Superpowers removal finished. Re-run install to start fresh."
}

print_usage() {
  cat <<'EOU'
Usage: ./codex/install.sh <command>
Commands:
  install/update  Clone or update the repo and refresh ~/.agents/skills/superpowers (same workflow).
  migrate         Same as install/update but also reminds you to remove any legacy bootstrap block.
  remove          Remove the skills link and delete the clone.
  doctor          Report whether folders, git, PowerShell, and symlink targets are ready for each task.
  help            Print this message.

Running without a command defaults to the install/update workflow.
EOU
}

main() {
  detect_platform
  if [ $# -eq 0 ]; then
    health_check
    info "No command provided; defaulting to install/update workflow."
    run_install
    exit 0
  fi

  local cmd="$1"
  shift

  case "$cmd" in
    install)
      health_check
      run_install
      ;;
    update)
      health_check
      run_update
      ;;
    migrate)
      health_check
      run_migrate
      ;;
    remove)
      health_check
      run_remove
      ;;
    doctor)
      doctor
      ;;
    help|-h|--help)
      print_usage
      ;;
    *)
      error "Unknown command: $cmd"
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
