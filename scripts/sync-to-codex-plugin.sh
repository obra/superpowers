#!/usr/bin/env bash
#
# sync-to-codex-plugin.sh
#
# Sync this superpowers checkout → prime-radiant-inc/openai-codex-plugins.
# Clones the fork fresh into a temp dir, rsyncs tracked upstream plugin content
# (including committed Codex files under .codex-plugin/ and assets/), preserves
# OpenAI-owned marketplace metadata already in the destination plugin, commits,
# pushes a sync branch, and opens a PR.
# Path/user agnostic — auto-detects upstream from script location.
#
# Deterministic: running twice against the same upstream SHA produces PRs with
# identical diffs, so two back-to-back runs can verify the tool itself.
#
# Usage:
#   ./scripts/sync-to-codex-plugin.sh                              # full run
#   ./scripts/sync-to-codex-plugin.sh -n                           # dry run
#   ./scripts/sync-to-codex-plugin.sh -y                           # skip confirm
#   ./scripts/sync-to-codex-plugin.sh --local PATH                 # existing checkout
#   ./scripts/sync-to-codex-plugin.sh --base BRANCH                # default: main
#   ./scripts/sync-to-codex-plugin.sh --bootstrap                  # create plugin dir if missing
#
# Bootstrap mode: skips the "plugin must exist on base" requirement and creates
# plugins/superpowers/ when absent, then copies the tracked plugin files from
# upstream just like a normal sync.
#
# Requires: bash, rsync, git, gh (authenticated), python3.

set -euo pipefail

# =============================================================================
# Config — edit as upstream or canonical plugin shape evolves
# =============================================================================

FORK="prime-radiant-inc/openai-codex-plugins"
DEFAULT_BASE="main"
DEST_REL="plugins/superpowers"

# Paths in upstream that should NOT land in the embedded plugin.
# All patterns use a leading "/" to anchor them to the source root.
# Unanchored patterns like "scripts/" would match any directory named
# "scripts" at any depth — including legitimate nested dirs like
# skills/brainstorming/scripts/. Anchoring prevents that.
# (.DS_Store is intentionally unanchored — Finder creates them everywhere.)
EXCLUDES=(
  # Dotfiles and infra — top-level only
  "/.claude/"
  "/.claude-plugin/"
  "/.codex/"
  "/.cursor-plugin/"
  "/.git/"
  "/.gitattributes"
  "/.github/"
  "/.gitignore"
  "/.opencode/"
  "/.version-bump.json"
  "/.worktrees/"
  ".DS_Store"

  # Root ceremony files
  "/AGENTS.md"
  "/CHANGELOG.md"
  "/CLAUDE.md"
  "/GEMINI.md"
  "/RELEASE-NOTES.md"
  "/gemini-extension.json"
  "/package.json"

  # Directories not shipped by canonical Codex plugins
  "/commands/"
  "/docs/"
  "/hooks/"
  "/lib/"
  "/scripts/"
  "/tests/"
  "/tmp/"
)

# =============================================================================
# Ignored-path helpers
# =============================================================================

IGNORED_DIR_EXCLUDES=()

path_has_directory_exclude() {
  local path="$1"
  local dir

  if [[ ${#IGNORED_DIR_EXCLUDES[@]} -eq 0 ]]; then
    return 1
  fi

  for dir in "${IGNORED_DIR_EXCLUDES[@]}"; do
    [[ "$path" == "$dir"* ]] && return 0
  done

  return 1
}

ignored_directory_has_tracked_descendants() {
  local path="$1"

  [[ -n "$(git -C "$UPSTREAM" ls-files --cached -- "$path/")" ]]
}

append_git_ignored_directory_excludes() {
  local path
  local lookup_path

  while IFS= read -r -d '' path; do
    [[ "$path" == */ ]] || continue

    lookup_path="${path%/}"
    if ! ignored_directory_has_tracked_descendants "$lookup_path"; then
      IGNORED_DIR_EXCLUDES+=("$path")
      RSYNC_ARGS+=(--exclude="/$path")
    fi
  done < <(git -C "$UPSTREAM" ls-files --others --ignored --exclude-standard --directory -z)
}

append_git_ignored_file_excludes() {
  local path

  while IFS= read -r -d '' path; do
    path_has_directory_exclude "$path" && continue
    RSYNC_ARGS+=(--exclude="/$path")
  done < <(git -C "$UPSTREAM" ls-files --others --ignored --exclude-standard -z)
}

# =============================================================================
# Args
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UPSTREAM="$(cd "$SCRIPT_DIR/.." && pwd)"
BASE="$DEFAULT_BASE"
DRY_RUN=0
YES=0
LOCAL_CHECKOUT=""
BOOTSTRAP=0

usage() {
  sed -n '/^# Usage:/,/^# Requires:/s/^# \{0,1\}//p' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)  DRY_RUN=1; shift ;;
    -y|--yes)      YES=1; shift ;;
    --local)       LOCAL_CHECKOUT="$2"; shift 2 ;;
    --base)        BASE="$2"; shift 2 ;;
    --bootstrap)   BOOTSTRAP=1; shift ;;
    -h|--help)     usage 0 ;;
    *)             echo "Unknown arg: $1" >&2; usage 2 ;;
  esac
done

# =============================================================================
# Preflight
# =============================================================================

die() { echo "ERROR: $*" >&2; exit 1; }

command -v rsync >/dev/null   || die "rsync not found in PATH"
command -v git >/dev/null     || die "git not found in PATH"
command -v gh >/dev/null      || die "gh not found — install GitHub CLI"
command -v python3 >/dev/null || die "python3 not found in PATH"

gh auth status >/dev/null 2>&1 || die "gh not authenticated — run 'gh auth login'"

[[ -d "$UPSTREAM/.git" ]]         || die "upstream '$UPSTREAM' is not a git checkout"
[[ -f "$UPSTREAM/.codex-plugin/plugin.json" ]] || die "committed Codex manifest missing at $UPSTREAM/.codex-plugin/plugin.json"

# Read the upstream version from the committed Codex manifest.
UPSTREAM_VERSION="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$UPSTREAM/.codex-plugin/plugin.json")"
[[ -n "$UPSTREAM_VERSION" ]] || die "could not read 'version' from committed Codex manifest"

UPSTREAM_BRANCH="$(cd "$UPSTREAM" && git branch --show-current)"
UPSTREAM_SHA="$(cd "$UPSTREAM" && git rev-parse HEAD)"
UPSTREAM_SHORT="$(cd "$UPSTREAM" && git rev-parse --short HEAD)"

confirm() {
  [[ $YES -eq 1 ]] && return 0
  read -rp "$1 [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

if [[ "$UPSTREAM_BRANCH" != "main" ]]; then
  echo "WARNING: upstream is on '$UPSTREAM_BRANCH', not 'main'"
  confirm "Sync from '$UPSTREAM_BRANCH' anyway?" || exit 1
fi

UPSTREAM_STATUS="$(cd "$UPSTREAM" && git status --porcelain)"
if [[ -n "$UPSTREAM_STATUS" ]]; then
  echo "WARNING: upstream has uncommitted changes:"
  echo "$UPSTREAM_STATUS" | sed 's/^/  /'
  echo "Sync will use working-tree state, not HEAD ($UPSTREAM_SHORT)."
  confirm "Continue anyway?" || exit 1
fi

# =============================================================================
# Prepare destination (clone fork fresh, or use --local)
# =============================================================================

CLEANUP_DIR=""
cleanup() {
  if [[ -n "$CLEANUP_DIR" ]]; then
    rm -rf "$CLEANUP_DIR"
  fi
}
trap cleanup EXIT

if [[ -n "$LOCAL_CHECKOUT" ]]; then
  DEST_REPO="$(cd "$LOCAL_CHECKOUT" && pwd)"
  [[ -d "$DEST_REPO/.git" ]] || die "--local path '$DEST_REPO' is not a git checkout"
else
  echo "Cloning $FORK..."
  CLEANUP_DIR="$(mktemp -d)"
  DEST_REPO="$CLEANUP_DIR/openai-codex-plugins"
  gh repo clone "$FORK" "$DEST_REPO" >/dev/null
fi

DEST="$DEST_REPO/$DEST_REL"
PREVIEW_REPO="$DEST_REPO"
PREVIEW_DEST="$DEST"
SYNC_SOURCE=""

overlay_destination_paths() {
  local repo="$1"
  local path
  local source_path
  local preview_path

  while IFS= read -r -d '' path; do
    source_path="$repo/$path"
    preview_path="$PREVIEW_REPO/$path"

    if [[ -e "$source_path" ]]; then
      mkdir -p "$(dirname "$preview_path")"
      cp -R "$source_path" "$preview_path"
    else
      rm -rf "$preview_path"
    fi
  done
}

copy_local_destination_overlay() {
  overlay_destination_paths "$DEST_REPO" < <(
    git -C "$DEST_REPO" diff --name-only -z -- "$DEST_REL"
  )
  overlay_destination_paths "$DEST_REPO" < <(
    git -C "$DEST_REPO" diff --cached --name-only -z -- "$DEST_REL"
  )
  overlay_destination_paths "$DEST_REPO" < <(
    git -C "$DEST_REPO" ls-files --others --exclude-standard -z -- "$DEST_REL"
  )
  overlay_destination_paths "$DEST_REPO" < <(
    git -C "$DEST_REPO" ls-files --others --ignored --exclude-standard -z -- "$DEST_REL"
  )
}

local_checkout_has_uncommitted_destination_changes() {
  [[ -n "$(git -C "$DEST_REPO" status --porcelain=1 --untracked-files=all --ignored=matching -- "$DEST_REL")" ]]
}

prepare_preview_checkout() {
  if [[ -n "$LOCAL_CHECKOUT" ]]; then
    [[ -n "$CLEANUP_DIR" ]] || CLEANUP_DIR="$(mktemp -d)"
    PREVIEW_REPO="$CLEANUP_DIR/preview"
    git clone -q --no-local "$DEST_REPO" "$PREVIEW_REPO"
    PREVIEW_DEST="$PREVIEW_REPO/$DEST_REL"
  fi

  git -C "$PREVIEW_REPO" checkout -q "$BASE" 2>/dev/null || die "base branch '$BASE' doesn't exist in $FORK"
  if [[ -n "$LOCAL_CHECKOUT" ]]; then
    copy_local_destination_overlay
  fi
  if [[ $BOOTSTRAP -ne 1 ]]; then
    [[ -d "$PREVIEW_DEST" ]] || die "base branch '$BASE' has no '$DEST_REL/' — use --bootstrap, or pass --base <branch>"
  fi
}

prepare_apply_checkout() {
  git -C "$DEST_REPO" checkout -q "$BASE" 2>/dev/null || die "base branch '$BASE' doesn't exist in $FORK"
  if [[ $BOOTSTRAP -ne 1 ]]; then
    [[ -d "$DEST" ]] || die "base branch '$BASE' has no '$DEST_REL/' — use --bootstrap, or pass --base <branch>"
  fi
}

apply_to_preview_checkout() {
  if [[ $BOOTSTRAP -eq 1 ]]; then
    mkdir -p "$PREVIEW_DEST"
  fi

  rsync "${RSYNC_ARGS[@]}" "$SYNC_SOURCE/" "$PREVIEW_DEST/"
}

preview_checkout_has_changes() {
  [[ -n "$(git -C "$PREVIEW_REPO" status --porcelain "$DEST_REL")" ]]
}

prepare_preview_checkout

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
if [[ $BOOTSTRAP -eq 1 ]]; then
  SYNC_BRANCH="bootstrap/superpowers-${UPSTREAM_SHORT}-${TIMESTAMP}"
else
  SYNC_BRANCH="sync/superpowers-${UPSTREAM_SHORT}-${TIMESTAMP}"
fi

# =============================================================================
# Build rsync args
# =============================================================================

RSYNC_ARGS=(-av --delete --delete-excluded)
for pat in "${EXCLUDES[@]}"; do RSYNC_ARGS+=(--exclude="$pat"); done
append_git_ignored_directory_excludes
append_git_ignored_file_excludes

copy_preserved_destination_metadata() {
  local destination="$1"
  local source="$2"
  local path
  local rel

  [[ -d "$destination/skills" ]] || return 0

  while IFS= read -r -d '' path; do
    rel="${path#"$destination"/}"
    mkdir -p "$source/$(dirname "$rel")"
    cp -p "$path" "$source/$rel"
  done < <(find "$destination/skills" -path '*/agents/openai.yaml' -type f -print0)
}

prepare_sync_source() {
  local destination="$1"

  [[ -n "$CLEANUP_DIR" ]] || CLEANUP_DIR="$(mktemp -d)"

  SYNC_SOURCE="$CLEANUP_DIR/source-overlay"
  rm -rf "$SYNC_SOURCE"
  mkdir -p "$SYNC_SOURCE"

  rsync "${RSYNC_ARGS[@]}" "$UPSTREAM/" "$SYNC_SOURCE/" >/dev/null
  copy_preserved_destination_metadata "$destination" "$SYNC_SOURCE"
}

prepare_sync_source "$PREVIEW_DEST"

# =============================================================================
# Dry run preview (always shown)
# =============================================================================

echo ""
echo "Upstream: $UPSTREAM ($UPSTREAM_BRANCH @ $UPSTREAM_SHORT)"
echo "Version:  $UPSTREAM_VERSION"
echo "Fork:     $FORK"
echo "Base:     $BASE"
echo "Branch:   $SYNC_BRANCH"
if [[ $BOOTSTRAP -eq 1 ]]; then
  echo "Mode:     BOOTSTRAP (creating plugins/superpowers/ when absent)"
fi
echo ""
echo "=== Preview (rsync --dry-run) ==="
rsync "${RSYNC_ARGS[@]}" --dry-run --itemize-changes "$SYNC_SOURCE/" "$PREVIEW_DEST/"
echo "=== End preview ==="
echo ""

if [[ $DRY_RUN -eq 1 ]]; then
  echo ""
  echo "Dry run only. Nothing was changed or pushed."
  exit 0
fi

# =============================================================================
# Apply
# =============================================================================

echo ""
confirm "Apply changes, push branch, and open PR?" || { echo "Aborted."; exit 1; }

echo ""
if [[ -n "$LOCAL_CHECKOUT" ]]; then
  if local_checkout_has_uncommitted_destination_changes; then
    die "local checkout has uncommitted changes under '$DEST_REL' — commit, stash, or discard them before syncing"
  fi

  apply_to_preview_checkout
  if ! preview_checkout_has_changes; then
    echo "No changes — embedded plugin was already in sync with upstream $UPSTREAM_SHORT (v$UPSTREAM_VERSION)."
    exit 0
  fi
fi

prepare_apply_checkout
cd "$DEST_REPO"
git checkout -q -b "$SYNC_BRANCH"
echo "Syncing upstream content..."
if [[ $BOOTSTRAP -eq 1 ]]; then
  mkdir -p "$DEST"
fi
rsync "${RSYNC_ARGS[@]}" "$SYNC_SOURCE/" "$DEST/"

# Bail early if nothing actually changed
cd "$DEST_REPO"
if [[ -z "$(git status --porcelain "$DEST_REL")" ]]; then
  echo "No changes — embedded plugin was already in sync with upstream $UPSTREAM_SHORT (v$UPSTREAM_VERSION)."
  exit 0
fi

# =============================================================================
# Commit, push, open PR
# =============================================================================

git add "$DEST_REL"

if [[ $BOOTSTRAP -eq 1 ]]; then
  COMMIT_TITLE="bootstrap superpowers v$UPSTREAM_VERSION from upstream main @ $UPSTREAM_SHORT"
  PR_BODY="Initial bootstrap of the superpowers plugin from upstream \`main\` @ \`$UPSTREAM_SHORT\` (v$UPSTREAM_VERSION).

Creates \`plugins/superpowers/\` by copying the tracked plugin files from upstream, including \`.codex-plugin/plugin.json\` and \`assets/\`.

Run via: \`scripts/sync-to-codex-plugin.sh --bootstrap\`
Upstream commit: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA

This is a one-time bootstrap. Subsequent syncs will be normal (non-bootstrap) runs using the same tracked upstream plugin files."
else
  COMMIT_TITLE="sync superpowers v$UPSTREAM_VERSION from upstream main @ $UPSTREAM_SHORT"
  PR_BODY="Automated sync from superpowers upstream \`main\` @ \`$UPSTREAM_SHORT\` (v$UPSTREAM_VERSION).

Copies the tracked plugin files from upstream, including the committed Codex manifest and assets.

Run via: \`scripts/sync-to-codex-plugin.sh\`
Upstream commit: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA

Running the sync tool again against the same upstream SHA should produce a PR with an identical diff — use that to verify the tool is behaving."
fi

git commit --quiet -m "$COMMIT_TITLE

Automated sync via scripts/sync-to-codex-plugin.sh
Upstream: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA
Branch:   $SYNC_BRANCH"

echo "Pushing $SYNC_BRANCH to $FORK..."
git push -u origin "$SYNC_BRANCH" --quiet

echo "Opening PR..."
PR_URL="$(gh pr create \
  --repo "$FORK" \
  --base "$BASE" \
  --head "$SYNC_BRANCH" \
  --title "$COMMIT_TITLE" \
  --body "$PR_BODY")"

PR_NUM="${PR_URL##*/}"
DIFF_URL="https://github.com/$FORK/pull/$PR_NUM/files"

echo ""
echo "PR opened: $PR_URL"
echo "Diff view: $DIFF_URL"
