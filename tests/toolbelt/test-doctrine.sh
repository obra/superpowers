#!/usr/bin/env bash
#
# Writing doctrine, enforced repo-wide across skills/.
#
# Absence checks invert git grep: it exits 0 on a match, which is the failure.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

failures=0

fail() {
  echo "not ok - $1" >&2
  failures=$((failures + 1))
}

ok() {
  echo "ok - $1"
}

# no_extremely_important
if git grep -q -e "EXTREMELY-IMPORTANT" -e "EXTREMELY_IMPORTANT" -- skills hooks; then
  git grep -n -e "EXTREMELY-IMPORTANT" -e "EXTREMELY_IMPORTANT" -- skills hooks >&2
  fail "no_extremely_important: the EXTREMELY-IMPORTANT tag is gone from skills and hooks"
else
  ok "no_extremely_important"
fi

# no_letter_spirit
if git grep -q "Violating the letter" -- skills; then
  git grep -n "Violating the letter" -- skills >&2
  fail "no_letter_spirit: letter-and-spirit boilerplate is gone from skills"
else
  ok "no_letter_spirit"
fi

# no_threats
if git grep -q -e "you'll be replaced" -e "you will be replaced" -- skills; then
  git grep -n -e "you'll be replaced" -e "you will be replaced" -- skills >&2
  fail "no_threats: threat language is gone from skills"
else
  ok "no_threats"
fi

# iron_law_only_tdd
iron=$(git grep -l "Iron Law" -- skills || true)
if [ -n "$iron" ] && [ "$iron" != "skills/test-driven-development/SKILL.md" ]; then
  echo "$iron" >&2
  fail "iron_law_only_tdd: \"Iron Law\" appears outside test-driven-development"
else
  ok "iron_law_only_tdd"
fi

# one_rationalization_table
expected_tables="skills/test-driven-development/SKILL.md
skills/writing-skills/testing-skills-with-subagents.md"
tables=$(git grep -l -e "| Excuse | Reality |" -e "| Thought | Reality |" -- skills || true)
unexpected=$(comm -23 <(echo "$tables" | grep -v '^$' | sort) <(echo "$expected_tables" | sort) || true)
if [ -n "$unexpected" ]; then
  echo "$unexpected" >&2
  fail "one_rationalization_table: a rationalization table appears outside the allowed files"
else
  ok "one_rationalization_table"
fi

# gates_under_80_words
gate_failures=0
for file in skills/*/SKILL.md; do
  for tag in HARD-GATE ENTRY-GATE; do
    # Whole-line anchors only: an inline mention never opens a range.
    # The tag lines themselves are excluded from the count.
    while read -r words; do
      [ -n "$words" ] || continue
      if [ "$words" -gt 80 ]; then
        echo "$file <$tag> block is $words words (max 80)" >&2
        gate_failures=$((gate_failures + 1))
      fi
    done < <(awk -v tag="$tag" '
      $0 == "<" tag ">" { inblock = 1; n = 0; next }
      $0 == "</" tag ">" { if (inblock) print n; inblock = 0; next }
      inblock && $0 !~ /^</ { n += NF }
      END { if (inblock) print n }
    ' "$file")
  done
done
if [ "$gate_failures" -gt 0 ]; then
  fail "gates_under_80_words: $gate_failures gate block(s) over 80 words"
else
  ok "gates_under_80_words"
fi

# structure: references resolve and the prose carries no shouting or filler.
# Prints one "file:line: reason" per failure under the given skills root.
structure_failures() {
  local root=$1 file rel skill_dir kind line ref target
  while IFS= read -r file; do
    rel=${file#"$root"/}
    skill_dir="$root/${rel%%/*}"
    while IFS=$'\t' read -r kind line ref; do
      case "$kind" in
        link)
          target=${ref%%#*}
          [ -e "$(dirname "$file")/$target" ] || [ -e "$skill_dir/$target" ] ||
            echo "$file:$line: broken link $ref"
          ;;
        script)
          [ -e "$skill_dir/$ref" ] || [ -e "$repo_root/$ref" ] ||
            echo "$file:$line: missing script $ref"
          ;;
        name)
          [ -d "$root/$ref" ] || echo "$file:$line: unknown skill toolbelt:$ref"
          ;;
        caps) echo "$file:$line: all-caps $ref outside a gate block" ;;
        phrase) echo "$file:$line: stock phrase \"$ref\"" ;;
      esac
    done < <(awk '
      function each(re, kind, s, grp,   m) {
        while (match(s, re)) {
          m = substr(s, RSTART, RLENGTH)
          if (grp == "link") { sub(/^\]\(/, "", m); sub(/\)$/, "", m) }
          if (grp == "name") sub(/^toolbelt:/, "", m)
          if (grp == "script") sub(/\.+$/, "", m)
          if (grp == "caps") gsub(/[^A-Z]/, "", m)
          if (grp != "link" || (m !~ /^[a-z]+:/ && m ~ /\.md(#.*)?$/))
            printf "%s\t%d\t%s\n", kind, NR, m
          s = substr(s, RSTART + RLENGTH)
        }
      }
      # A fence closes only on a run of its own character at least as long.
      !fence && match($0, /^[ \t]*(```+|~~~+)/) {
        run = substr($0, RSTART, RLENGTH); sub(/^[ \t]*/, "", run)
        fence = 1; fchar = substr(run, 1, 1); flen = length(run); next
      }
      fence {
        line = $0; sub(/^[ \t]*/, "", line); sub(/[ \t]*$/, "", line)
        close_run = line; gsub(fchar, "", close_run)
        if (close_run == "" && length(line) >= flen) fence = 0
        next
      }
      /^<(HARD|ENTRY)-GATE>/ { gate = 1 }
      /^<\/(HARD|ENTRY)-GATE>/ { gate = 0 }
      {
        each("\\]\\([^) ]+\\)", "link", $0, "link")
        each("[A-Za-z0-9_./-]*scripts/[A-Za-z0-9_.-]+", "script", $0, "script")
        each("toolbelt:[a-z0-9-]+", "name", $0, "name")
        bare = $0
        gsub(/`[^`]*`/, "", bare)
        if (!gate) each("(^|[^A-Za-z_])(MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT)([^A-Za-z_]|$)", "caps", bare, "caps")
        low = tolower(bare)
        n = split("it'"'"'s important to|the whole point|in order to|make sure to", ps, "|")
        for (i = 1; i <= n; i++) if (index(low, ps[i])) printf "phrase\t%d\t%s\n", NR, ps[i]
        if (index(bare, "Remember,")) printf "phrase\t%d\tRemember,\n", NR
        if (index(bare, "Note that")) printf "phrase\t%d\tNote that\n", NR
      }
    ' "$file")
  done < <(find "$root" -name '*.md' | sort)
}

structure_out=$(structure_failures skills)
if [ -n "$structure_out" ]; then
  echo "$structure_out" >&2
  fail "structure: $(echo "$structure_out" | wc -l) failure(s) under skills/"
else
  ok "structure"
fi

# structure_fixtures: each bad fixture fails for its own reason; the good one passes.
fixtures=tests/toolbelt/fixtures/doctrine
for case in "broken-link:broken link" "missing-script:missing script" \
  "unknown-name:unknown skill" "stray-must:all-caps MUST" "stock-phrase:stock phrase"; do
  name=${case%%:*}
  want=${case#*:}
  if structure_failures "$fixtures/$name" | grep -qF -- "$want"; then
    ok "structure_fixtures: $name fails"
  else
    fail "structure_fixtures: $name should report \"$want\""
  fi
done
passing_out=$(structure_failures "$fixtures/passing")
if [ -z "$passing_out" ]; then
  ok "structure_fixtures: passing passes"
else
  echo "$passing_out" >&2
  fail "structure_fixtures: passing should report nothing"
fi

if [ "$failures" -gt 0 ]; then
  exit 1
fi

echo "PASS"
