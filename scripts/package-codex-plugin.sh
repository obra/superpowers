#!/usr/bin/env bash
#
# Package the Superpowers Codex plugin as a rootless .tar.gz for portal upload.
#
# The Codex portal artifact differs from the old openai/plugins sync flow:
# it is a standalone archive, but it still needs the OpenAI-owned
# skills/*/agents/openai.yaml metadata that used to be preserved from the
# destination plugin repo. Seed that metadata from a prior official package.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

REF="HEAD"
OUTPUT=""
METADATA_SOURCE=""
ALLOW_DIRTY=0
KEEP_STAGE=0

usage() {
  cat <<'EOF'
Usage:
  scripts/package-codex-plugin.sh [options]

Options:
  --output PATH            Write archive to PATH.
                           Default: ../_tmp/sup-codex-packaging/superpowers-VERSION.tar.gz
  --metadata-source PATH   Prior official package directory or .tar.gz used to
                           seed skills/*/agents/openai.yaml.
                           Default: ../_tmp/sup-codex-packaging/superpowers,
                           falling back to ../_tmp/sup-codex-packaging/superpowers.tar.gz
  --ref REF                Git ref to package. Default: HEAD.
  --allow-dirty            Permit a dirty working tree. The archive still uses --ref.
  --keep-stage             Print and keep the temporary staging directory.
  -h, --help               Show this help.

The archive is rootless: .codex-plugin/, assets/, skills/, README.md, LICENSE,
and CODE_OF_CONDUCT.md sit at the tar root. Source-only repo files, hooks, tests,
docs, and other harness manifests are intentionally not shipped.
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      [[ $# -ge 2 ]] || die "--output requires a path"
      OUTPUT="$2"
      shift 2
      ;;
    --metadata-source)
      [[ $# -ge 2 ]] || die "--metadata-source requires a path"
      METADATA_SOURCE="$2"
      shift 2
      ;;
    --ref)
      [[ $# -ge 2 ]] || die "--ref requires a value"
      REF="$2"
      shift 2
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    --keep-stage)
      KEEP_STAGE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

command -v git >/dev/null || die "git not found in PATH"
command -v jq >/dev/null || die "jq not found in PATH"
command -v tar >/dev/null || die "tar not found in PATH"
command -v gzip >/dev/null || die "gzip not found in PATH"
command -v shasum >/dev/null || die "shasum not found in PATH"

[[ -d "$REPO_ROOT/.git" ]] || die "repo root is not a git checkout: $REPO_ROOT"
git -C "$REPO_ROOT" rev-parse --verify "$REF^{commit}" >/dev/null ||
  die "git ref does not resolve to a commit: $REF"

if [[ "$ALLOW_DIRTY" -ne 1 ]]; then
  dirty_status="$(git -C "$REPO_ROOT" status --porcelain --untracked-files=all)"
  if [[ -n "$dirty_status" ]]; then
    echo "Working tree has uncommitted changes:" >&2
    printf '%s\n' "$dirty_status" | sed 's/^/  /' >&2
    die "commit or stash changes first, or pass --allow-dirty to package $REF anyway"
  fi
fi

if [[ -z "$METADATA_SOURCE" ]]; then
  if [[ -d "$REPO_ROOT/../_tmp/sup-codex-packaging/superpowers" ]]; then
    METADATA_SOURCE="$REPO_ROOT/../_tmp/sup-codex-packaging/superpowers"
  elif [[ -f "$REPO_ROOT/../_tmp/sup-codex-packaging/superpowers.tar.gz" ]]; then
    METADATA_SOURCE="$REPO_ROOT/../_tmp/sup-codex-packaging/superpowers.tar.gz"
  else
    die "no metadata source found; pass --metadata-source <prior package dir or tar.gz>"
  fi
fi

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/superpowers-codex-package.XXXXXX")"
STAGE="$WORK_DIR/payload"
METADATA_WORK="$WORK_DIR/metadata"
TAR_LIST="$WORK_DIR/tar-list"

cleanup() {
  if [[ "$KEEP_STAGE" -eq 1 ]]; then
    echo "Keeping staging directory: $WORK_DIR" >&2
  else
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

mkdir -p "$STAGE" "$METADATA_WORK"

metadata_root_from_dir() {
  local candidate="$1"
  local nested

  if [[ -d "$candidate/skills" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  nested="$(find "$candidate" -mindepth 2 -maxdepth 2 -type d -name skills -print | head -n 1)"
  if [[ -n "$nested" ]]; then
    dirname "$nested"
    return 0
  fi

  return 1
}

prepare_metadata_root() {
  local source="$1"
  local root

  if [[ -d "$source" ]]; then
    root="$(cd "$source" && pwd)"
  elif [[ -f "$source" ]]; then
    case "$source" in
      *.tar.gz|*.tgz)
        tar -xzf "$source" -C "$METADATA_WORK"
        root="$METADATA_WORK"
        ;;
      *)
        die "metadata source must be a directory or .tar.gz: $source"
        ;;
    esac
  else
    die "metadata source does not exist: $source"
  fi

  metadata_root_from_dir "$root" ||
    die "metadata source does not contain a skills/ directory: $source"
}

METADATA_ROOT="$(prepare_metadata_root "$METADATA_SOURCE")"

git -C "$REPO_ROOT" archive --format=tar "$REF" -- \
  .codex-plugin \
  CODE_OF_CONDUCT.md \
  LICENSE \
  README.md \
  assets \
  skills \
  | tar -xf - -C "$STAGE"

VERSION="$(jq -r '.version // empty' "$STAGE/.codex-plugin/plugin.json")"
[[ -n "$VERSION" ]] || die "could not read version from .codex-plugin/plugin.json"

if jq -e 'has("hooks")' "$STAGE/.codex-plugin/plugin.json" >/dev/null; then
  die "Codex manifest must not declare hooks for the portal package"
fi

if [[ -z "$OUTPUT" ]]; then
  OUTPUT="$REPO_ROOT/../_tmp/sup-codex-packaging/superpowers-$VERSION.tar.gz"
fi
mkdir -p "$(dirname "$OUTPUT")"
OUTPUT="$(cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")"

missing_metadata=0
while IFS= read -r skill_dir; do
  skill_name="${skill_dir##*/}"
  metadata_file="$METADATA_ROOT/skills/$skill_name/agents/openai.yaml"

  if [[ ! -f "$metadata_file" ]]; then
    echo "Missing OpenAI agent metadata for skill: $skill_name" >&2
    missing_metadata=1
    continue
  fi

  mkdir -p "$skill_dir/agents"
  cp "$metadata_file" "$skill_dir/agents/openai.yaml"
done < <(find "$STAGE/skills" -mindepth 1 -maxdepth 1 -type d -print | sort)

if [[ "$missing_metadata" -ne 0 ]]; then
  die "metadata source is incomplete"
fi

skill_count="$(find "$STAGE/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
metadata_count="$(find "$STAGE/skills" -path '*/agents/openai.yaml' -type f | wc -l | tr -d ' ')"
[[ "$skill_count" == "$metadata_count" ]] ||
  die "metadata count mismatch: $metadata_count metadata files for $skill_count skills"

# Match the prior official archive's deterministic tar entry metadata.
TZ=UTC find "$STAGE" -exec touch -t 197001010000 {} +

(
  cd "$STAGE"
  {
    find . -mindepth 1 -type d | sed 's#^\./##' | LC_ALL=C sort
    find . -mindepth 1 -type f | sed 's#^\./##' | LC_ALL=C sort
  } >"$TAR_LIST"

  rm -f "$OUTPUT"
  COPYFILE_DISABLE=1 tar -cnf - --format ustar --uid 0 --gid 0 --uname '' --gname '' -T "$TAR_LIST" |
    gzip -9n >"$OUTPUT"
)

if command -v xattr >/dev/null 2>&1; then
  xattr -c "$OUTPUT" 2>/dev/null || true
fi

unexpected_paths="$(
  tar -tzf "$OUTPUT" |
    grep -E '(^superpowers/|^\.agents/|^hooks/|package\.json$|^\.git|^\.pytest_cache|^\.ruff_cache|^scripts/|^tests/|^docs/|^evals/|^lib/|^\.claude|^\.cursor|^\.kimi|^\.opencode|^\.pi|^AGENTS\.md$|^CLAUDE\.md$|^GEMINI\.md$|^RELEASE-NOTES\.md$|^CHANGELOG\.md$)' || true
)"
if [[ -n "$unexpected_paths" ]]; then
  printf '%s\n' "$unexpected_paths" | sed 's/^/  /' >&2
  die "archive contains source-only paths"
fi

entry_count="$(tar -tzf "$OUTPUT" | wc -l | tr -d ' ')"
checksum="$(shasum -a 256 "$OUTPUT" | awk '{print $1}')"

echo "Archive: $OUTPUT"
echo "Version: $VERSION"
echo "Entries: $entry_count"
echo "Skills:  $skill_count"
echo "SHA-256: $checksum"
