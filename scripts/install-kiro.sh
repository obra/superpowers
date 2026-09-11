#!/bin/sh
set -eu

REPOSITORY="obra/superpowers"
PAYLOAD_MARKER=".superpowers-kiro-install"
AGENT_MARKER="<!-- Managed by the Superpowers Kiro installer. -->"

die() { echo "error: $*" >&2; exit 1; }
for tool in cat cp dirname grep sed mkdir rm mv awk; do
  command -v "$tool" >/dev/null 2>&1 || die "required tool '$tool' is not on PATH"
done
source_dir=""
tag=""
usage() { die "usage: $0 [vMAJOR.MINOR.PATCH] | --source <directory>"; }
case "${1:-}" in
  --source)
    [ "$#" -eq 2 ] && [ -n "$2" ] || usage
    source_dir="$(cd -- "$2" && pwd -P)" || die "source directory does not exist: $2"
    ;;
  *)
    [ "$#" -le 1 ] || usage
    tag="${1:-}"
    for tool in curl tar; do
      command -v "$tool" >/dev/null 2>&1 || die "required tool '$tool' is not on PATH"
    done
    ;;
esac

install_root="${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro"
# A relative XDG_DATA_HOME would install into the current directory and emit
# relative resource URIs, which defeats the absolute-path profile. A quote or
# newline in the path would produce unparseable YAML in the generated agents.
newline='
'
case "$install_root" in
  /*) ;;
  *) die "XDG_DATA_HOME must be an absolute path: $install_root" ;;
esac
case "$install_root" in
  *'"'*|*"$newline"*) die "install path must not contain quotes or newlines: $install_root" ;;
esac
agent_path="$HOME/.kiro/agents/superpowers.md"
worker_default_model_path="$HOME/.kiro/agents/superpowers-worker-default-model.md"
worker_lite_model_path="$HOME/.kiro/agents/superpowers-worker-lite-model.md"
for managed in "$agent_path" "$worker_default_model_path" "$worker_lite_model_path"; do
  if { [ -e "$managed" ] || [ -L "$managed" ]; } \
    && ! grep -Fq "$AGENT_MARKER" "$managed" 2>/dev/null; then
    die "refusing to overwrite unmanaged agent: $managed"
  fi
  # A same-named .json config defines the same agent and takes precedence, so
  # installing beside one would silently shadow the agent written here. The
  # suffix is hardcoded to .json because that is the only non-Markdown agent
  # form Kiro loads today; see the design spec's "Shadowing guard" open question.
  shadow="${managed%.md}.json"
  if [ -e "$shadow" ] || [ -L "$shadow" ]; then
    die "$shadow defines the same agent and would shadow $managed; move it aside first"
  fi
done
if { [ -e "$install_root" ] || [ -L "$install_root" ]; } \
  && [ ! -f "$install_root/$PAYLOAD_MARKER" ]; then
  die "refusing to overwrite unmanaged payload: $install_root"
fi

if [ -z "$source_dir" ]; then
  if [ -z "$tag" ]; then
    tag="$(curl -fsSL --proto '=https' --proto-redir '=https' "https://api.github.com/repos/$REPOSITORY/releases/latest" \
      | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
      | sed -n '1p')"
    # Distinguish a lookup failure from a malformed argument: the user gave none.
    [ -n "$tag" ] \
      || die "could not resolve the latest release; pass a tag explicitly, e.g. $0 v1.2.3"
  fi
  printf '%s\n' "$tag" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    || die "release must look like v1.2.3"
  version="${tag#v}"
fi

work_dir="${TMPDIR:-/tmp}/superpowers-kiro.$$"
(umask 077 && mkdir "$work_dir") || die "cannot create temporary directory"
agents_dir="$HOME/.kiro/agents"
payload_stage=""
agent_stage=""
replacing=0
# Each destination has its own same-filesystem staging slot with new/old entries.
select_slot() {
  case "$1" in
    0) slot="$payload_stage/0"; destination="$install_root" ;;
    1) slot="$agent_stage/1"; destination="$agent_path" ;;
    2) slot="$agent_stage/2"; destination="$worker_default_model_path" ;;
    3) slot="$agent_stage/3"; destination="$worker_lite_model_path" ;;
  esac
}
cleanup() {
  status=$?
  trap - 0
  trap '' 1 2 15
  set +e
  recovery_failed=0
  if [ "$replacing" -eq 1 ]; then
    for index in 3 2 1 0; do
      select_slot "$index"
      [ -f "$slot/started" ] || continue
      if [ -e "$slot/old" ] || [ -L "$slot/old" ]; then
        if ! rm -rf "$destination" || ! mv "$slot/old" "$destination"; then
          recovery_failed=1
        fi
      elif [ ! -f "$slot/had-original" ]; then
        rm -rf "$destination" || recovery_failed=1
      fi
    done
  fi
  if [ "$recovery_failed" -eq 1 ]; then
    printf 'error: recovery incomplete; preserve backups in %s and %s\n' \
      "$payload_stage" "$agent_stage" >&2
    status=1
  else
    [ -z "$payload_stage" ] || rm -rf "$payload_stage"
    [ -z "$agent_stage" ] || rm -rf "$agent_stage"
  fi
  rm -rf "$work_dir"
  exit "$status"
}
trap cleanup 0
trap 'exit 1' 1 2 15

if [ -n "$source_dir" ]; then
  source_root="$work_dir/source"
  mkdir -p "$source_root/.kiro/agents"
  cp -RL "$source_dir/skills" "$source_root/"
  cp "$source_dir/package.json" "$source_root/"
  for name in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
    cp "$source_dir/.kiro/agents/$name.md" "$source_root/.kiro/agents/"
  done
else
  archive="$work_dir/release.tar.gz"
  curl -fsSL --proto '=https' --proto-redir '=https' \
    "https://github.com/$REPOSITORY/archive/refs/tags/$tag.tar.gz" -o "$archive"
  tar -xzf "$archive" --no-same-owner -C "$work_dir"
  source_root="$work_dir/superpowers-$version"
fi
for required in \
  package.json \
  .kiro/agents/superpowers.md \
  .kiro/agents/superpowers-worker-default-model.md \
  .kiro/agents/superpowers-worker-lite-model.md \
  skills/using-superpowers/SKILL.md \
  skills/using-superpowers/references/kiro-tools.md \
  skills/brainstorming/SKILL.md; do
  [ -f "$source_root/$required" ] || die "release is missing $required"
done
archive_version="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$source_root/package.json" | sed -n '1p')"
[ -n "$archive_version" ] || die "source package.json is missing version metadata"
if [ -n "$source_dir" ]; then
  version="$archive_version"
  printf '%s\nsource: local\n' "$version" >"$source_root/$PAYLOAD_MARKER"
  # A commit identifies the checkout base; the snapshot also includes local edits.
  if command -v git >/dev/null 2>&1 && [ -e "$source_dir/.git" ]; then
    commit="$(git -C "$source_dir" rev-parse --verify HEAD 2>/dev/null || true)"
    [ -z "$commit" ] || printf 'base-commit: %s\n' "$commit" >>"$source_root/$PAYLOAD_MARKER"
  fi
else
  [ "$archive_version" = "$version" ] || die "release version does not match $tag"
  printf '%s\n' "$version" >"$source_root/$PAYLOAD_MARKER"
fi

mkdir -p "$(dirname "$install_root")" "$agents_dir"
stage_candidate="$(dirname "$install_root")/.superpowers-kiro-stage.$$"
(umask 077 && mkdir "$stage_candidate") || die "cannot stage payload"
payload_stage="$stage_candidate"
stage_candidate="$agents_dir/.superpowers-kiro-stage.$$"
(umask 077 && mkdir "$stage_candidate") || die "cannot stage agents"
agent_stage="$stage_candidate"
mkdir "$payload_stage/0" "$agent_stage/1" "$agent_stage/2" "$agent_stage/3"
# Copy before touching live paths, even when TMPDIR is on another filesystem.
cp -R "$source_root" "$payload_stage/0/new"

# Generate each global agent from the tracked profile shipped in the payload,
# instead of embedding a second copy here. The transform makes three defined
# changes: it substitutes the `{{SUPERPOWERS_SKILLS_DIR}}` placeholder with this
# installation's absolute skills directory, makes the resource URIs absolute
# (Kiro loads the global agent from unrelated project directories, so relative
# URIs would not resolve), and inserts the ownership marker used by the collision
# guard. Keeping the tracked `.kiro/agents/*.md` as the single source means the
# installed agents cannot drift from them.
generate_agent() {
  name="$1"
  src="$payload_stage/0/new/.kiro/agents/$name.md"
  tmp="$slot/new"
  [ -f "$src" ] || die "payload is missing agent $name.md"
  (umask 077 && : >"$tmp")
  KIRO_INSTALL_ROOT="$install_root" awk -v marker="$AGENT_MARKER" '
    BEGIN { root = ENVIRON["KIRO_INSTALL_ROOT"]; token = "{{SUPERPOWERS_SKILLS_DIR}}" }
    {
      line = $0; result = ""
      while ((at = index(line, token)) > 0) {
        result = result substr(line, 1, at - 1) root "/skills"
        line = substr(line, at + length(token))
      }
      $0 = result line
    }
    /^---$/ { print; fm++; if (fm == 2) print marker; next }
    fm == 1 && /^[[:space:]]*-[[:space:]]+(file|skill):\/\// {
      at = index($0, "://") + 3
      $0 = substr($0, 1, at - 1) root "/" substr($0, at); print; next
    }
    { print }
  ' "$src" >"$tmp"
}
for index in 1 2 3; do
  select_slot "$index"
  name="${destination##*/}"
  generate_agent "${name%.md}"
done

replacing=1
for index in 0 1 2 3; do
  select_slot "$index"
  if [ -e "$destination" ] || [ -L "$destination" ]; then
    : > "$slot/had-original"
  fi
  : > "$slot/started"
  if [ -f "$slot/had-original" ]; then
    mv "$destination" "$slot/old"
  fi
  mv "$slot/new" "$destination"
done
replacing=0

printf 'Installed Superpowers %s for Kiro CLI v3.\n' "$version"
printf 'Start it with: kiro-cli chat --agent superpowers --agent-engine v3\n'
