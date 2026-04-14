#!/usr/bin/env bash
#
# sync-to-codex-plugin.sh
#
# Syncs this superpowers checkout into a Codex plugin mirror directory.
# Pulls every file except the EXCLUDES list, never touches the PROTECTS list.
# Leaves changes unstaged in the destination so a human can review before committing.
#
# Usage:
#   ./scripts/sync-to-codex-plugin.sh                        # sync with confirmation
#   ./scripts/sync-to-codex-plugin.sh -n                     # dry run, show changes only
#   ./scripts/sync-to-codex-plugin.sh -y                     # skip confirmation prompt
#   ./scripts/sync-to-codex-plugin.sh --dest /path/to/plugins/superpowers
#
# Environment:
#   CODEX_PLUGIN_DEST   Destination plugin path (default: sibling openai-codex-plugins checkout)

set -euo pipefail

# =============================================================================
# Config — edit these lists as the upstream or canonical shape evolves
# =============================================================================

# Paths in upstream that should NOT land in the embedded plugin.
# Rsync --exclude patterns (trailing slash = directory).
EXCLUDES=(
  # Dotfiles and infra
  ".claude/"
  ".claude-plugin/"
  ".codex/"
  ".cursor-plugin/"
  ".git/"
  ".gitattributes"
  ".github/"
  ".gitignore"
  ".opencode/"
  ".version-bump.json"
  ".worktrees/"
  ".DS_Store"

  # Root ceremony files (not part of a canonical Codex plugin)
  "AGENTS.md"
  "CHANGELOG.md"
  "CLAUDE.md"
  "CODE_OF_CONDUCT.md"
  "GEMINI.md"
  "RELEASE-NOTES.md"
  "gemini-extension.json"
  "package.json"

  # Directories not shipped by canonical Codex plugins
  "commands/"
  "docs/"
  "hooks/"
  "lib/"
  "scripts/"
  "tests/"
  "tmp/"
)

# Paths in the destination that are hand-authored Codex overlays.
# Rsync will never touch these — including when --delete would otherwise
# remove them because they don't exist in upstream.
PROTECTS=(
  ".codex-plugin/"
  "agents/openai.yaml"
)

# =============================================================================
# Paths
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UPSTREAM="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default dest: sibling openai-codex-plugins checkout, if it exists
DEFAULT_DEST="${CODEX_PLUGIN_DEST:-$(dirname "$UPSTREAM")/openai-codex-plugins/plugins/superpowers}"

# =============================================================================
# Args
# =============================================================================

DEST="$DEFAULT_DEST"
DRY_RUN=0
YES=0

usage() {
  sed -n 's/^# \{0,1\}//;2,20p' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest)       DEST="$2"; shift 2 ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -y|--yes)     YES=1; shift ;;
    -h|--help)    usage 0 ;;
    *)            echo "Unknown arg: $1" >&2; usage 2 ;;
  esac
done

# =============================================================================
# Validate environment
# =============================================================================

if [[ ! -d "$UPSTREAM/.git" ]]; then
  echo "ERROR: Upstream '$UPSTREAM' is not a git checkout." >&2
  exit 1
fi

if [[ ! -d "$DEST" ]]; then
  echo "ERROR: Destination '$DEST' does not exist." >&2
  echo "Set CODEX_PLUGIN_DEST or pass --dest <path>." >&2
  exit 1
fi

confirm() {
  local prompt="$1"
  [[ $YES -eq 1 ]] && return 0
  read -rp "$prompt [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

# Check upstream branch
UPSTREAM_BRANCH="$(cd "$UPSTREAM" && git branch --show-current)"
UPSTREAM_SHA="$(cd "$UPSTREAM" && git rev-parse HEAD)"
UPSTREAM_SHORT="$(cd "$UPSTREAM" && git rev-parse --short HEAD)"

if [[ "$UPSTREAM_BRANCH" != "main" ]]; then
  echo "WARNING: Upstream is on branch '$UPSTREAM_BRANCH', not 'main'."
  confirm "Sync from '$UPSTREAM_BRANCH' anyway?" || exit 1
fi

# Check upstream working tree is clean
UPSTREAM_STATUS="$(cd "$UPSTREAM" && git status --porcelain)"
if [[ -n "$UPSTREAM_STATUS" ]]; then
  echo "WARNING: Upstream has uncommitted changes:"
  echo "$UPSTREAM_STATUS" | sed 's/^/  /'
  echo "Sync will use the working-tree state, not HEAD ($UPSTREAM_SHORT)."
  confirm "Continue anyway?" || exit 1
fi

# =============================================================================
# Build rsync args
# =============================================================================

RSYNC_ARGS=(-av --delete)

for pat in "${EXCLUDES[@]}"; do
  RSYNC_ARGS+=(--exclude="$pat")
done

for pat in "${PROTECTS[@]}"; do
  RSYNC_ARGS+=(--filter="protect $pat")
done

# =============================================================================
# Dry run first, always
# =============================================================================

echo ""
echo "Upstream: $UPSTREAM ($UPSTREAM_BRANCH @ $UPSTREAM_SHORT)"
echo "Dest:     $DEST"
echo ""
echo "=== Preview (rsync --dry-run) ==="
rsync "${RSYNC_ARGS[@]}" --dry-run --itemize-changes "$UPSTREAM/" "$DEST/"
echo "=== End preview ==="

if [[ $DRY_RUN -eq 1 ]]; then
  echo ""
  echo "Dry run only. Nothing was changed."
  exit 0
fi

# =============================================================================
# Apply
# =============================================================================

echo ""
confirm "Apply these changes?" || { echo "Aborted."; exit 1; }

echo ""
echo "Syncing..."
rsync "${RSYNC_ARGS[@]}" "$UPSTREAM/" "$DEST/"
echo "Done."
echo ""

# =============================================================================
# Report
# =============================================================================

DEST_GIT_ROOT="$(cd "$DEST" && git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -n "$DEST_GIT_ROOT" ]]; then
  DEST_REL="${DEST#$DEST_GIT_ROOT/}"
  CHANGES="$(cd "$DEST_GIT_ROOT" && git status --porcelain "$DEST_REL")"
  if [[ -z "$CHANGES" ]]; then
    echo "No changes — destination was already in sync with upstream $UPSTREAM_SHORT."
    exit 0
  fi

  echo "Changes pending review:"
  echo "$CHANGES" | sed 's/^/  /'
  echo ""
  echo "Upstream SHA: $UPSTREAM_SHA"
  echo ""
  echo "Suggested commit message:"
  echo "  sync superpowers from upstream main @ $UPSTREAM_SHORT"
  echo ""
  echo "Review with: git -C $DEST_GIT_ROOT diff -- $DEST_REL"
else
  echo "Destination is not a git checkout — cannot report changes."
fi
