#!/usr/bin/env bash
#
# Render the Antigravity Marketplace logo from assets/superpowers-small.svg.
#
# Usage:
#   scripts/render-antigravity-logo.sh [--output PATH]
#
# Draws the Superpowers mark in near-black on a white rounded square with
# transparent corners, 512x512 PNG. Run it whenever superpowers-small.svg
# changes; tests/antigravity/test_logo.py fails if the committed PNG is stale.
# Requires rsvg-convert (Homebrew: librsvg).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_SVG="$REPO_ROOT/assets/superpowers-small.svg"
OUTPUT="$REPO_ROOT/assets/antigravity-logo.png"

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
}

die() {
  echo "error: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      [[ $# -ge 2 ]] || die "--output needs a path"
      OUTPUT="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      die "unknown argument: $1"
      ;;
  esac
done

command -v rsvg-convert >/dev/null 2>&1 \
  || die "rsvg-convert is not on PATH (install librsvg, e.g. 'brew install librsvg')"
[[ -r "$SOURCE_SVG" ]] || die "source mark not readable: $SOURCE_SVG"

# Everything inside the source <svg> element: the mark's paths and ellipse.
mark="$(sed -E 's/^.*<svg[^>]*>//; s#</svg>.*$##' "$SOURCE_SVG")"
[[ -n "$mark" ]] || die "could not extract the mark from $SOURCE_SVG"

# The mark's bounding box is centered at (256,256) in its 512 viewBox and is
# 348 units wide; scale 0.905 makes it ~70% of the 450-unit rounded square.
composed="$(mktemp)"
trap 'rm -f "$composed"' EXIT
cat >"$composed" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="31" y="31" width="450" height="450" rx="100" ry="100" fill="#ffffff"/>
  <g fill="#1a1a1a" transform="translate(256 256) scale(0.905) translate(-256 -256)">$mark</g>
</svg>
EOF

rsvg-convert -w 512 -h 512 "$composed" -o "$OUTPUT"
echo "wrote $OUTPUT"
