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
#   ./scripts/sync-to-codex-plugin.sh                  # full run with confirm
#   ./scripts/sync-to-codex-plugin.sh -n               # dry run, no clone/push/PR
#   ./scripts/sync-to-codex-plugin.sh -y               # skip confirmation
#   ./scripts/sync-to-codex-plugin.sh --local PATH     # use existing checkout
#   ./scripts/sync-to-codex-plugin.sh --base BRANCH    # target branch (default: main)
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
# The Codex-overlay file is here too — it's managed by the generate step,
# not by rsync.
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

  # Root ceremony files
  "AGENTS.md"
  "CHANGELOG.md"
  "CLAUDE.md"
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

  # Codex-overlay file — regenerated below, not synced
  ".codex-plugin/"
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
  "description": "Core skills library for Codex: planning, TDD, debugging, and collaboration workflows.",
  "author": {
    "name": "Jesse Vincent",
    "email": "jesse@fsck.com",
    "url": "https://github.com/obra"
  },
  "homepage": "https://github.com/obra/superpowers",
  "repository": "https://github.com/obra/superpowers",
  "license": "MIT",
  "keywords": [
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
    "longDescription": "Use Superpowers to guide agent work through brainstorming, implementation planning, test-driven development, systematic debugging, parallel execution, code review, and finish-the-branch workflows adapted for Codex.",
    "developerName": "Jesse Vincent",
    "category": "Coding",
    "capabilities": [
      "Interactive",
      "Read",
      "Write"
    ],
    "websiteURL": "https://github.com/obra/superpowers",
    "privacyPolicyURL": "https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement",
    "termsOfServiceURL": "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
    "defaultPrompt": [
      "Use Superpowers to plan this feature before we code",
      "Debug this bug with a systematic root-cause workflow",
      "Turn this approved design into an implementation plan"
    ],
    "brandColor": "#F59E0B",
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

usage() {
  sed -n 's/^# \{0,1\}//;2,20p' "$0"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run) DRY_RUN=1; shift ;;
    -y|--yes)     YES=1; shift ;;
    --local)      LOCAL_CHECKOUT="$2"; shift 2 ;;
    --base)       BASE="$2"; shift 2 ;;
    -h|--help)    usage 0 ;;
    *)            echo "Unknown arg: $1" >&2; usage 2 ;;
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

[[ -d "$UPSTREAM/.git" ]]            || die "upstream '$UPSTREAM' is not a git checkout"
[[ -f "$UPSTREAM/package.json" ]]    || die "upstream has no package.json — cannot read version"

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

[[ -d "$DEST" ]] || die "base branch '$BASE' has no '$DEST_REL/' — merge the bootstrap PR first, or pass --base <branch>"

# =============================================================================
# Create sync branch
# =============================================================================

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
SYNC_BRANCH="sync/superpowers-${UPSTREAM_SHORT}-${TIMESTAMP}"
git checkout -q -b "$SYNC_BRANCH"

# =============================================================================
# Build rsync args (excludes only — overlay is regenerated separately)
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
echo ""
echo "=== Preview (rsync --dry-run) ==="
rsync "${RSYNC_ARGS[@]}" --dry-run --itemize-changes "$UPSTREAM/" "$DEST/"
echo "=== End preview ==="
echo ""
echo "Overlay file (.codex-plugin/plugin.json) will be regenerated with"
echo "version $UPSTREAM_VERSION regardless of rsync output."

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
git commit --quiet -m "sync superpowers v$UPSTREAM_VERSION from upstream main @ $UPSTREAM_SHORT

Automated sync via scripts/sync-to-codex-plugin.sh
Upstream: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA
Branch:   $SYNC_BRANCH"

echo "Pushing $SYNC_BRANCH to $FORK..."
git push -u origin "$SYNC_BRANCH" --quiet

PR_TITLE="sync superpowers v$UPSTREAM_VERSION from upstream main @ $UPSTREAM_SHORT"
PR_BODY="Automated sync from superpowers upstream \`main\` @ \`$UPSTREAM_SHORT\` (v$UPSTREAM_VERSION).

Run via: \`scripts/sync-to-codex-plugin.sh\`
Upstream commit: https://github.com/obra/superpowers/commit/$UPSTREAM_SHA

Running the sync tool again against the same upstream SHA should produce a PR with an identical diff — use that to verify the tool is behaving."

echo "Opening PR..."
PR_URL="$(gh pr create \
  --repo "$FORK" \
  --base "$BASE" \
  --head "$SYNC_BRANCH" \
  --title "$PR_TITLE" \
  --body "$PR_BODY")"

PR_NUM="${PR_URL##*/}"
DIFF_URL="https://github.com/$FORK/pull/$PR_NUM/files"

echo ""
echo "PR opened: $PR_URL"
echo "Diff view: $DIFF_URL"
