#!/bin/sh
set -eu

REPOSITORY="obra/superpowers"
PAYLOAD_MARKER=".superpowers-kiro-install"
AGENT_MARKER="<!-- Managed by the Superpowers Kiro installer. -->"

die() { echo "error: $*" >&2; exit 1; }
for tool in cat curl dirname tar grep sed mkdir rm mv; do
  command -v "$tool" >/dev/null 2>&1 || die "required tool '$tool' is not on PATH"
done
[ "$#" -le 1 ] || die "usage: $0 [vMAJOR.MINOR.PATCH]"

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

tag="${1:-}"
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

work_dir="${TMPDIR:-/tmp}/superpowers-kiro.$$"
(umask 077 && mkdir "$work_dir") || die "cannot create temporary directory"
agents_dir="$HOME/.kiro/agents"
cleanup() { rm -rf "$work_dir"; rm -f "$agents_dir"/*.tmp.$$; }
trap cleanup 0
trap 'exit 1' 1 2 15

archive="$work_dir/release.tar.gz"
curl -fsSL --proto '=https' --proto-redir '=https' \
  "https://github.com/$REPOSITORY/archive/refs/tags/$tag.tar.gz" -o "$archive"
tar -xzf "$archive" --no-same-owner -C "$work_dir"
source_root="$work_dir/superpowers-$version"
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
archive_version="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$source_root/package.json" | sed -n '1p')"
[ "$archive_version" = "$version" ] || die "release version does not match $tag"
printf '%s\n' "$version" >"$source_root/$PAYLOAD_MARKER"

mkdir -p "$(dirname "$install_root")" "$(dirname "$agent_path")"
rm -rf "$install_root"
mv "$source_root" "$install_root"

# Generate each global agent from the tracked profile shipped in the payload,
# instead of embedding a second copy here. The only differences from the tracked
# file are absolute resource URIs (Kiro loads the global agent from unrelated
# project directories, so relative URIs would not resolve) and the ownership
# marker used by the collision guard. Keeping the tracked `.kiro/agents/*.md` as
# the single source means the installed agents cannot drift from them.
generate_agent() {
  name="$1"
  src="$install_root/.kiro/agents/$name.md"
  dest="$HOME/.kiro/agents/$name.md"
  tmp="$dest.tmp.$$"
  [ -f "$src" ] || die "payload is missing agent $name.md"
  (umask 077 && : >"$tmp")
  awk -v root="$install_root" -v marker="$AGENT_MARKER" '
    /^---$/ { print; fm++; if (fm == 2) print marker; next }
    fm == 1 && /^[[:space:]]*-[[:space:]]+(file|skill):\/\// {
      sub(/:\/\//, "://" root "/"); print; next
    }
    { print }
  ' "$src" >"$tmp"
  mv "$tmp" "$dest"
}
for name in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
  generate_agent "$name"
done

printf 'Installed Superpowers %s for Kiro CLI v3.\n' "$version"
printf 'Start it with: kiro-cli chat --agent superpowers --agent-engine v3\n'
