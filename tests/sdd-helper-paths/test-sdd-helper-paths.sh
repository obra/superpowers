#!/usr/bin/env bash
# Fails when any file under skills/ tells the agent to run an SDD or
# executing-plans helper (sdd-workspace, task-brief, review-package,
# task-start, task-done) by a skill-relative `scripts/...` path without
# saying to run it by its absolute path from the working tree.
#
# The helpers act on the git working tree of the current directory, like
# git. A skill-relative path invites the agent to cd into the skill's own
# directory (the plugin cache) to make the path work, which puts the
# helpers outside the working tree it is executing in (#2429). Every such
# reference must carry the phrase "by its absolute path" within a few
# lines after it.
#
# Usage: tests/sdd-helper-paths/test-sdd-helper-paths.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# A backticked invocation whose path is relative: optional "bash ", then an
# optional ../<skill>/ prefix, then scripts/<helper>. Absolute paths ($S/...,
# /...) don't match.
invocation='`(bash )?(\.\./[a-z-]+/)?scripts/(sdd-workspace|task-brief|review-package|task-start|task-done)'
phrase='by its absolute path'

failed=0
checked=0
while IFS=: read -r file line _; do
  checked=$((checked + 1))
  # The phrase may wrap onto the next lines; look at this line and the two
  # after it, joined (whitespace squeezed, so line-wrap indentation doesn't
  # split the phrase), starting from the invocation itself.
  window=$(sed -n "${line},$((line + 2))p" "$file" | tr -s '[:space:]' ' ')
  after=$(printf '%s\n' "$window" | grep -oE "$invocation.*" | head -n 1)
  if [[ "${after:0:240}" != *"$phrase"* ]]; then
    echo "FAIL: ${file#"$REPO_ROOT"/}:$line runs a helper by a relative scripts/ path without \"$phrase\"" >&2
    failed=1
  fi
done < <(grep -rnE --include='*.md' "$invocation" "$REPO_ROOT/skills")

if ((checked == 0)); then
  echo "FAIL: found no helper invocations under skills/; the pattern is stale" >&2
  exit 1
fi
if ((failed)); then
  echo "Say to run the script by its absolute path, from the working tree you're executing in." >&2
  exit 1
fi
echo "PASS: all $checked relative helper references under skills/ say to run them by absolute path"
