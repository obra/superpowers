#!/usr/bin/env bash
#
# sync-to-codex-plugin.sh
#
# Sync this superpowers checkout → prime-radiant-inc/openai-codex-plugins.
# Clones the fork fresh into a temp dir, rsyncs upstream content, regenerates
# the Codex overlay file (.codex-plugin/plugin.json) inline, commits, pushes a
# sync branch, and opens a PR.
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
#   ./scripts/sync-to-codex-plugin.sh --bootstrap --assets-src DIR # create initial plugin
#
# Bootstrap mode: skips the "plugin must exist on base" check and seeds
# plugins/superpowers/assets/ from --assets-src <dir> which must contain
# PrimeRadiant_Favicon.svg and PrimeRadiant_Favicon.png. Run once by one
# team member to create the initial PR; every subsequent run is a normal
# (non-bootstrap) sync.
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
# The Codex-only paths are here too — they're managed by generate/bootstrap
# steps, not by rsync.
#
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

  # Codex-only paths — managed outside rsync
  "/.codex-plugin/"
  "/assets/"
)

# =============================================================================
# Generated overlay file
# =============================================================================

# Writes the Codex plugin manifest to "$1" with the given upstream version.
# Args: dest_path, version
generate_plugin_json() {
  local dest="$1"
  local version="$2"
  mkdir -p "$(dirname "$dest")"
  cat > "$dest" <<EOF
{
  "name": "superpowers",
  "version": "$version",
  "description": "An agentic skills framework & software development methodology that works: planning, TDD, debugging, and collaboration workflows.",
  "author": {
    "name": "Jesse Vincent",
    "email": "jesse@fsck.com",
    "url": "https://github.com/obra"
  },
  "homepage": "https://github.com/obra/superpowers",
  "repository": "https://github.com/obra/superpowers",
  "license": "MIT",
  "keywords": [
    "brainstorming",
    "subagent-driven-development",
    "skills",
    "planning",
    "tdd",
    "debugging",
    "code-review",
    "workflow"
  ],
  "skills": "./skills/",
  "interface": {
    "displayName": "Superpowers",
    "shortDescription": "Planning, TDD, debugging, and delivery workflows for coding agents",
    "longDescription": "Use Superpowers to guide agent work through brainstorming, implementation planning, test-driven development, systematic debugging, parallel execution, code review, and finish-the-branch workflows.",
    "developerName": "Jesse Vincent",
    "category": "Coding",
    "capabilities": [
      "Interactive",
      "Read",
      "Write"
    ],
    "defaultPrompt": [
      "I've got an idea for something I'd like to build.",
      "Let's add a feature to this project."
    ],
    "brandColor": "#F59E0B",
    "composerIcon": "./assets/superpowers-small.svg",
    "logo": "./assets/app-icon.png",
    "screenshots": []
  }
}
EOF
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
ASSETS_SRC=""

usage() {
  sed -n 's/^# \{0,1\}//;2,27p' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)  DRY_RUN=1; shift ;;
    -y|--yes)      YES=1; shift ;;
    --local)       LOCAL_CHECKOUT="$2"; shift 2 ;;
    --base)        BASE="$2"; shift 2 ;;
    --bootstrap)   BOOTSTRAP=1; shift ;;
    --assets-src)  ASSETS_SRC="$2"; shift 2 ;;
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
[[ -f "$UPSTREAM/package.json" ]] || die "upstream has no package.json — cannot read version"

# Bootstrap-mode validation
if [[ $BOOTSTRAP -eq 1 ]]; then
  [[ -n "$ASSETS_SRC" ]] || die "--bootstrap requires --assets-src <path>"
  ASSETS_SRC="$(cd "$ASSETS_SRC" 2>/dev/null && pwd)" || die "assets source '$ASSETS_SRC' is not a directory"
  [[ -f "$ASSETS_SRC/PrimeRadiant_Favicon.svg" ]] || die "assets source missing PrimeRadiant_Favicon.svg"
  [[ -f "$ASSETS_SRC/PrimeRadiant_Favicon.png" ]] || die "assets source missing PrimeRadiant_Favicon.png"
fi

# Read the upstream version from package.json
UPSTREAM_VERSION="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$UPSTREAM/package.json")"
[[ -n "$UPSTREAM_VERSION" ]] || die "could not read 'version' from upstream package.json"

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
  [[ -n "$CLEANUP_DIR" ]] && rm -rf "$CLEANUP_DIR"
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

# Checkout base branch
cd "$DEST_REPO"
git checkout -q "$BASE" 2>/dev/null || die "base branch '$BASE' doesn't exist in $FORK"

# Plugin-existence check depends on mode
if [[ $BOOTSTRAP -eq 1 ]]; then
  [[ ! -d "$DEST" ]] || die "--bootstrap but base branch '$BASE' already has '$DEST_REL/' — use normal sync instead"
  mkdir -p "$DEST"
else
  [[ -d "$DEST" ]] || die "base branch '$BASE' has no '$DEST_REL/' — use --bootstrap + --assets-src, or pass --base <branch>"
fi

# =============================================================================
# Create sync branch
# =============================================================================

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
if [[ $BOOTSTRAP -eq 1 ]]; then
  SYNC_BRANCH="bootstrap/superpowers-${UPSTREAM_SHORT}-${TIMESTAMP}"
else
  SYNC_BRANCH="sync/superpowers-${UPSTREAM_SHORT}-${TIMESTAMP}"
fi
git checkout -q -b "$SYNC_BRANCH"

# =============================================================================
# Build rsync args
# =============================================================================

RSYNC_ARGS=(-av --delete)
for pat in "${EXCLUDES[@]}"; do RSYNC_ARGS+=(--exclude="$pat"); done

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
  echo "Mode:     BOOTSTRAP (creating initial plugin from scratch)"
  echo "Assets:   $ASSETS_SRC"
fi
echo ""
echo "=== Preview (rsync --dry-run) ==="
rsync "${RSYNC_ARGS[@]}" --dry-run --itemize-changes "$UPSTREAM/" "$DEST/"
echo "=== End preview ==="
echo ""
echo "Overlay file (.codex-plugin/plugin.json) will be regenerated with"
echo "version $UPSTREAM_VERSION regardless of rsync output."
if [[ $BOOTSTRAP -eq 1 ]]; then
  echo "Assets (superpowers-small.svg, app-icon.png) will be seeded from:"
  echo "  $ASSETS_SRC"
fi

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
echo "Syncing upstream content..."
rsync "${RSYNC_ARGS[@]}" "$UPSTREAM/" "$DEST/"

if [[ $BOOTSTRAP -eq 1 ]]; then
  echo "Seeding brand assets..."
  mkdir -p "$DEST/assets"
  cp "$ASSETS_SRC/PrimeRadiant_Favicon.svg" "$DEST/assets/superpowers-small.svg"
  cp "$ASSETS_SRC/PrimeRadiant_Favicon.png" "$DEST/assets/app-icon.png"
fi

echo "Regenerating overlay file..."
generate_plugin_json "$DEST/.codex-plugin/plugin.json" "$UPSTREAM_VERSION"

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

Creates \`plugins/superpowers/\` from scratch: upstream content via rsync, \`.codex-plugin/plugin.json\` regenerated inline, brand assets seeded from a local Brand Assets directory.

Run via: \`scripts/sync-to-codex-plugin.sh --bootstrap --assets-src <path>\`
Upstream commit: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA

This is a one-time bootstrap. Subsequent syncs will be normal (non-bootstrap) runs and will not touch the \`assets/\` directory."
else
  COMMIT_TITLE="sync superpowers v$UPSTREAM_VERSION from upstream main @ $UPSTREAM_SHORT"
  PR_BODY="Automated sync from superpowers upstream \`main\` @ \`$UPSTREAM_SHORT\` (v$UPSTREAM_VERSION).

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
