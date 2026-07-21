#!/usr/bin/env bash
# Render each *.html diagram source in this dir to a PNG in ../ via headless Chrome.
# Hand-drawn look is baked into the PNG (macOS handwriting font + SVG roughen filter),
# so it renders identically on GitHub. Sources kept in-repo so diagrams stay editable.
set -eu
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="$(cd "$SRC/.." && pwd)"

size_for() {
  case "$1" in
    1-hero)            echo "960 600" ;;
    2-architecture)    echo "1040 620" ;;
    3-setup-lifecycle) echo "1040 560" ;;
    4-daily-lifecycle) echo "1040 520" ;;
    *)                 echo "960 600" ;;
  esac
}

for html in "$SRC"/*.html; do
  base="$(basename "$html" .html)"
  read -r w h <<EOF
$(size_for "$base")
EOF
  echo "rendering $base at ${w}x${h}"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="${w},${h}" \
    --default-background-color=00000000 \
    --screenshot="$OUT/$base.png" "file://$html" >/dev/null 2>&1
done
echo "done -> $OUT"
