#!/usr/bin/env bash
# Planted-defect probe for the wordstat fixture: a non-UTF-8 input file must
# produce a stderr message and exit 1, not a traceback (design.md: "message
# to stderr, return 1" for a file that cannot be read; no task tests it).
set -u
tmp=$(mktemp -d); printf '\xff\xfe\x00\x01' > "$tmp/bin.bin"
out=$(python3 -c "import sys; from wordstat.cli import main; sys.exit(main(['$tmp/bin.bin']))" 2>&1); code=$?
rm -r "$tmp"
if [ "$code" -eq 1 ] && ! printf '%s' "$out" | grep -q "Traceback"; then echo "utf8-crash: handled"; exit 0; fi
echo "utf8-crash: exit=$code $(printf '%s' "$out" | tail -n 1 | cut -c1-80)"; exit 1
