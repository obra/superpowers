#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${SUPERPOWERS_REPO_URL:-https://github.com/obra/superpowers.git}"
INSTALL_DIR="${SUPERPOWERS_INSTALL_DIR:-$HOME/.config/superpowers/superpowers}"
CONFIG_FILE=.aider.conf.yml
BOOT_FILE=.aider/superpowers.boot.commands
LOCAL_DOC=.aider/SUPERPOWERS.md

log() { printf '%s\n' "$*"; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }

require_git() {
  command -v git >/dev/null 2>&1 || die "git is required but was not found in PATH.";
}

check_writable() {
  local dir="$1"
  mkdir -p "$dir" || die "Cannot create $dir"
  local probe
  probe="$(mktemp "$dir/.superpowers-write-test-XXXX")" || die "Cannot create temp file in $dir"
  rm -f "$probe"
}

install_or_update_superpowers() {
  if [ -e "$INSTALL_DIR" ] && [ ! -d "$INSTALL_DIR" ]; then
    die "$INSTALL_DIR exists and is not a directory. Move it aside or set SUPERPOWERS_INSTALL_DIR."
  fi

  if [ ! -d "$INSTALL_DIR" ]; then
    mkdir -p "$(dirname "$INSTALL_DIR")"
    log "Cloning Superpowers into $INSTALL_DIR ..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    return
  fi

  [ -d "$INSTALL_DIR/.git" ] || die "$INSTALL_DIR exists but is not a git repo. Move it aside or set SUPERPOWERS_INSTALL_DIR."

  log "Updating Superpowers in $INSTALL_DIR ..."
  (cd "$INSTALL_DIR"
    git fetch --all
    current_branch="$(git rev-parse --abbrev-ref HEAD)"
    if ! git merge --ff-only "origin/$current_branch"; then
      log "Warning: could not fast-forward $current_branch. Keeping existing checkout; resolve manually if needed."
    fi
  )
}

write_local_doc() {
  local install_root="$1"
  cat > "$LOCAL_DOC" <<EOF_DOC
# Superpowers + Aider

This repo is wired to use Superpowers from:
- $install_root

What to expect
- Aider loads Superpowers guardrails from `.aider/superpowers.boot.commands` on start.
- Do not edit non-doc files until the user explicitly says: `approved, start implementation`.
- During brainstorming (Step 1) and plan writing/approval (Step 2), only edit `docs/plans/**` and `.aider/**`. Suggest changes elsewhere but wait for approval.
- Use `/read` to pull in skills from the Superpowers install before acting. The index is loaded automatically.

Updating
- Re-run this installer to refresh the Superpowers checkout and project wiring.
EOF_DOC
  log "Wrote $LOCAL_DOC"
}

write_boot_commands() {
  local install_root="$1"
  cat > "$BOOT_FILE" <<EOF_BOOT
/read .aider/SUPERPOWERS.md
/read $install_root/aider/CONVENTIONS.md
/read $install_root/aider/SKILLS-INDEX.md
EOF_BOOT
  log "Wrote $BOOT_FILE"
}

backup_file() {
  local src="$1"
  local backup="$src.bak.$(date +%Y%m%d%H%M%S)"
  cp "$src" "$backup"
  log "Backed up $src to $backup"
}

ensure_config() {
  if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" <<'EOF_CFG'
load: .aider/superpowers.boot.commands
auto-lint: true
auto-test: false
EOF_CFG
    log "Created $CONFIG_FILE with Superpowers boot commands."
    return
  fi

  if grep -q "superpowers.boot.commands" "$CONFIG_FILE"; then
    log "$CONFIG_FILE already references Superpowers boot commands."
    return
  fi

  if grep -q "^load:" "$CONFIG_FILE"; then
    log "Note: $CONFIG_FILE already defines a load directive. Please include .aider/superpowers.boot.commands in it."
    return
  fi

  backup_file "$CONFIG_FILE"
  printf "\n# Added by Superpowers installer on %s\nload: .aider/superpowers.boot.commands\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$CONFIG_FILE"
  log "Appended load directive to $CONFIG_FILE"
}

create_stub_script() {
  local path="$1"
  local role="$2"
  local examples="$3"
  if [ -f "$path" ]; then
    log "Keeping existing $path"
    return
  fi
  cat > "$path" <<EOF_STUB
#!/usr/bin/env bash
set -euo pipefail

echo "$role command is not configured yet. Edit $path with your project's real command." >&2
# Examples:
$examples
exit 1
EOF_STUB
  chmod +x "$path"
  log "Created stub $path"
}

main() {
  require_git
  check_writable "$HOME/.config/superpowers"
  check_writable "$PWD"

  install_or_update_superpowers

  mkdir -p .aider
  install_root="$(cd "$INSTALL_DIR" && pwd)"

  write_local_doc "$install_root"
  write_boot_commands "$install_root"
  ensure_config

  mkdir -p scripts
  create_stub_script scripts/test.sh "Test" "# Python: pytest -q\n# Node: npm test"
  create_stub_script scripts/lint.sh "Lint" "# Python: ruff check .\n# Python (compile-only): python -m compileall .\n# Node: npm run lint"

  log ""
  log "Next steps:"
  log "- Run 'aider' in this repo; it will auto-load Superpowers conventions and skills index."
  log "- During design/plan, stick to docs/plans/** and .aider/** until you say: approved, start implementation."
  log "- Before acting in each phase, /read the relevant skill from the loaded index."
}

main "$@"
