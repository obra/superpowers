#!/usr/bin/env bash
# Generate a review package: commit list, stat summary, and the net
# diff with extended context, written to a file the reviewer reads in one
# call. Using the recorded per-task BASE (not HEAD~1) keeps multi-commit
# tasks intact.
#
# Usage: review-package PLAN_FILE BASE HEAD [OUTFILE]
# Default OUTFILE: <repo-root>/.superpowers/sdd/<plan-basename>/review-<base7>..<head7>.diff
# (named per range, so a re-review after fixes gets a distinct fresh file).
set -euo pipefail

if [ $# -lt 3 ] || [ $# -gt 4 ]; then
  echo "usage: review-package PLAN_FILE BASE HEAD [OUTFILE]" >&2
  exit 2
fi

plan=$1
base=$2
head=$3
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }

git rev-parse --verify --quiet "$base" >/dev/null || { echo "bad BASE: $base" >&2; exit 2; }
git rev-parse --verify --quiet "$head" >/dev/null || { echo "bad HEAD: $head" >&2; exit 2; }

if [ $# -eq 4 ]; then
  out=$4
else
  dir=$("$(cd "$(dirname "$0")" && pwd)/sdd-workspace" "$plan")
  out="$dir/review-$(git rev-parse --short "$base")..$(git rev-parse --short "$head").diff"
fi

{
  echo "# Review package: ${base}..${head}"
  echo
  echo "## Commits"
  git log --oneline "${base}..${head}"
  echo
  echo "## Files changed"
  git diff --stat "${base}..${head}"
  echo
  echo "## Diff"
  git diff -U10 "${base}..${head}"
} > "$out"

commits=$(git rev-list --count "${base}..${head}")
echo "wrote ${out}: ${commits} commit(s), $(wc -c < "$out" | tr -d ' ') bytes"
