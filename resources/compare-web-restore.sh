#!/usr/bin/env bash
# Compare restored web-frontend vs original after seal/unpack.
set -euo pipefail

ORIG="${ORIG:-/Users/isaaczhu/workspace/applifier/web-frontend}"
REST="${REST:-$HOME/Downloads/web}"
REPORT="${REPORT:-/Users/isaaczhu/workspace/isaac/superpowers/resources/web-restore-diff.txt}"

EXCLUDES=(
  --exclude=node_modules
  --exclude=.git
  --exclude=dist
  --exclude=.cursor
  --exclude=__pycache__
  --exclude='*.cpx'
  --exclude='*.age'
)

{
  echo "=== Web restore comparison ==="
  echo "original: $ORIG"
  echo "restored: $REST"
  echo "time: $(date -Iseconds)"
  echo ""

  if [[ ! -d "$ORIG" ]]; then echo "ERROR: original missing"; exit 1; fi
  if [[ ! -d "$REST" ]]; then echo "ERROR: restored missing"; exit 1; fi

  echo "=== Top-level names only in original ==="
  comm -23 <(ls -1a "$ORIG" | sort) <(ls -1a "$REST" | sort) || true
  echo ""
  echo "=== Top-level names only in restored ==="
  comm -13 <(ls -1a "$ORIG" | sort) <(ls -1a "$REST" | sort) || true
  echo ""

  count_files() {
    find "$1" -type f \
      ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/dist/*' \
      ! -path '*/.cursor/*' ! -path '*/__pycache__/*' \
      ! -name '*.cpx' ! -name '*.age' 2>/dev/null | wc -l | tr -d ' '
  }
  echo "=== File counts (same exclusions as seal) ==="
  echo "original: $(count_files "$ORIG")"
  echo "restored: $(count_files "$REST")"
  echo ""

  echo "=== diff -rq (content) ==="
  diff -rq "$ORIG" "$REST" "${EXCLUDES[@]}" || true
  echo ""

  echo "=== Checksum sample (package.json, tsconfig) ==="
  for f in package.json tsconfig.json next.config.ts; do
    if [[ -f "$ORIG/$f" && -f "$REST/$f" ]]; then
      if cmp -s "$ORIG/$f" "$REST/$f"; then
        echo "OK: $f identical"
      else
        echo "DIFF: $f"
      fi
    else
      echo "MISSING: $f (orig=$([[ -f $ORIG/$f ]] && echo y || echo n), rest=$([[ -f $REST/$f ]] && echo y || echo n))"
    fi
  done
} | tee "$REPORT"

echo ""
echo "Report written: $REPORT"
