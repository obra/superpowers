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
agent_path="$HOME/.kiro/agents/superpowers.md"
if { [ -e "$agent_path" ] || [ -L "$agent_path" ]; } \
  && ! grep -Fq "$AGENT_MARKER" "$agent_path" 2>/dev/null; then
  die "refusing to overwrite unmanaged agent: $agent_path"
fi
if { [ -e "$install_root" ] || [ -L "$install_root" ]; } \
  && [ ! -f "$install_root/$PAYLOAD_MARKER" ]; then
  die "refusing to overwrite unmanaged payload: $install_root"
fi

tag="${1:-}"
if [ -z "$tag" ]; then
  tag="$(curl -fsSL "https://api.github.com/repos/$REPOSITORY/releases/latest" \
    | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | sed -n '1p')"
fi
printf '%s\n' "$tag" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  || die "release must look like v6.2.0"
version="${tag#v}"

work_dir="${TMPDIR:-/tmp}/superpowers-kiro.$$"
(umask 077 && mkdir "$work_dir") || die "cannot create temporary directory"
agent_tmp="$agent_path.tmp.$$"
cleanup() { rm -rf "$work_dir"; rm -f "$agent_tmp"; }
trap cleanup 0
trap 'exit 1' 1 2 15

archive="$work_dir/release.tar.gz"
curl -fsSL "https://github.com/$REPOSITORY/archive/refs/tags/$tag.tar.gz" -o "$archive"
tar -xzf "$archive" -C "$work_dir"
source_root="$work_dir/superpowers-$version"
for required in \
  package.json \
  .kiro/agents/superpowers.md \
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

(umask 077 && : >"$agent_tmp")
cat >"$agent_tmp" <<EOF
---
description: Superpowers-enabled agent with native Kiro v3 skill activation for brainstorming, TDD, debugging, planning, and review.
tools: ["*"]
resources:
  - "file://$install_root/skills/using-superpowers/SKILL.md"
  - "file://$install_root/skills/using-superpowers/references/kiro-tools.md"
  - "skill://$install_root/skills/**/SKILL.md"
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
welcomeMessage: Superpowers is active. Relevant workflow skills load automatically.
---

$AGENT_MARKER
You are a software-engineering agent that follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.
EOF
mv "$agent_tmp" "$agent_path"
printf 'Installed Superpowers %s for Kiro CLI v3.\n' "$version"
printf 'Start it with: kiro-cli chat --agent superpowers --agent-engine v3\n'
