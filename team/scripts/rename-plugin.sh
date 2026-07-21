#!/usr/bin/env bash
# Rename the team plugin from the placeholder 'team-workflow' to <new-slug>.
# Operates on files relative to the current working directory.
set -euo pipefail
NEW="${1:-}"
case "$NEW" in
  ''|*[!a-z0-9-]*|[!a-z]*) echo "invalid slug '$NEW' (use lowercase, digits, hyphens; start with a letter)" >&2; exit 2;;
esac
for f in team/.claude-plugin/plugin.json .claude-plugin/marketplace.json team/README.md; do
  [ -f "$f" ] || continue
  tmp="$f.tmp.$$"
  sed "s/team-workflow/$NEW/g" "$f" > "$tmp" && mv "$tmp" "$f"
  echo "renamed in $f"
done
echo "Team plugin is now '$NEW'."
