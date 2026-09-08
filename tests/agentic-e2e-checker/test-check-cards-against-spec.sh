#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHECKER="$REPO_ROOT/skills/agentic-end-to-end-testing/scripts/check-cards-against-spec"

FAILURES=0
TEST_ROOT="$(mktemp -d)"
cleanup() { rm -rf "$TEST_ROOT"; }
trap cleanup EXIT

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

assert_exit() { # expected_code description -- command...
  local expected="$1" desc="$2"; shift 2
  local code=0
  "$@" >"$TEST_ROOT/out.txt" 2>&1 || code=$?
  if [ "$code" -eq "$expected" ]; then pass "$desc"; else
    fail "$desc (expected exit $expected, got $code)"; sed 's/^/    /' "$TEST_ROOT/out.txt"; fi
}

assert_out_contains() { # needle description
  if grep -Fq -- "$1" "$TEST_ROOT/out.txt"; then pass "$2"; else
    fail "$2 (output missing: $1)"; sed 's/^/    /' "$TEST_ROOT/out.txt"; fi
}

# ---- fixture builders ----------------------------------------------------

make_spec() { # dir  (spec with 2-row table; row 2 has \| and regex chars)
  mkdir -p "$1"
  cat > "$1/spec.md" <<'EOF'
# Widget Design

## Requirements

Widgets render a table with a TOTAL row.

## E2E scenario cards

| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Rendered table incl. TOTAL row | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
| widget-status-flags | Status output | If `widget status` does not print exactly `OK \| DEGRADED` (a literal pipe) with dots . and stars * intact, the scenario FAILS. |
EOF
}

good_card_1() {
  cat <<'EOF'
# widget-show-table: table renders with TOTAL

**What this covers**: the rendered table.

## Pre-state
A built widget binary.

## Steps
1. Run `widget show`.

## Expected
If stdout's last line is not `TOTAL` followed by the
two-decimal sum (20.85 for the seed
fixture), or the TOTAL row is absent entirely, the scenario FAILS.

## Cleanup
Nothing to clean.
EOF
}

good_card_2() {
  cat <<'EOF'
# widget-status-flags: status output

**What this covers**: status flags.

## Pre-state
A built widget binary.

## Steps
1. Run `widget status`.

## Expected
If `widget status` does not print exactly `OK | DEGRADED` (a literal pipe) with dots . and stars * intact, the scenario FAILS.

## Cleanup
Nothing to clean.
EOF
}

make_cards() { # dir
  mkdir -p "$1"
  good_card_1 > "$1/widget-show-table.md"
  good_card_2 > "$1/widget-status-flags.md"
}

# ---- tests ----------------------------------------------------------------

echo "happy path"
make_spec "$TEST_ROOT/t1"; make_cards "$TEST_ROOT/t1/cards"
assert_exit 0 "2 rows, 2 conforming cards -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t1/spec.md" "$TEST_ROOT/t1/cards"

echo "re-wrapped falsification line still matches (whitespace normalization)"
# good_card_1 already wraps the line across three lines; covered above. Prove
# the inverse too: collapse the card line to one line, still passes.
make_spec "$TEST_ROOT/t2"; make_cards "$TEST_ROOT/t2/cards"
perl -0pi -e 's/\n(two-decimal)/ $1/; s/\n(fixture\))/ $1/' "$TEST_ROOT/t2/cards/widget-show-table.md" 2>/dev/null || \
  sed -i '' -e ':a' -e 'N;$!ba' -e 's/the\ntwo-decimal/the two-decimal/' "$TEST_ROOT/t2/cards/widget-show-table.md"
assert_exit 0 "single-line variant -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t2/spec.md" "$TEST_ROOT/t2/cards"

echo "escaped pipe in table cell matches literal pipe in card"
# covered by widget-status-flags in the happy path; also prove failure when
# the card drops the pipe phrase entirely:
make_spec "$TEST_ROOT/t3"; make_cards "$TEST_ROOT/t3/cards"
sed -i.bak 's/OK | DEGRADED/OK or DEGRADED/' "$TEST_ROOT/t3/cards/widget-status-flags.md"
assert_exit 1 "reworded falsification -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t3/spec.md" "$TEST_ROOT/t3/cards"
assert_out_contains "widget-status-flags" "failure names the card"

echo "verbatim line outside Expected does not count"
make_spec "$TEST_ROOT/t3b"; make_cards "$TEST_ROOT/t3b/cards"
cat > "$TEST_ROOT/t3b/cards/widget-show-table.md" <<'EOF'
# widget-show-table: table renders with TOTAL

**What this covers**: If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS.

## Pre-state
A built widget binary.

## Steps
1. Run `widget show`.

## Expected
The widget prints a friendly banner and exits zero.

## Cleanup
Nothing to clean.
EOF
assert_exit 1 "line only outside Expected -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t3b/spec.md" "$TEST_ROOT/t3b/cards"
assert_out_contains "widget-show-table" "failure names the card"

echo "level-1 heading after Expected does not extend the section (false-PASS regression)"
# ## Expected is vague; a later # Appendix (level-1 heading, no intervening
# ##+ heading) carries the verbatim falsification line. The Expected section
# must end at the level-1 heading, so this must FAIL, not false-PASS.
make_spec "$TEST_ROOT/t3c"; make_cards "$TEST_ROOT/t3c/cards"
cat > "$TEST_ROOT/t3c/cards/widget-show-table.md" <<'EOF'
# widget-show-table: table renders with TOTAL

**What this covers**: the rendered table.

## Pre-state
A built widget binary.

## Steps
1. Run `widget show`.

## Expected
The widget prints something on screen.

# Appendix

If stdout's last line is not `TOTAL` followed by the
two-decimal sum (20.85 for the seed
fixture), or the TOTAL row is absent entirely, the scenario FAILS.

## Cleanup
Nothing to clean.
EOF
assert_exit 1 "level-1 heading terminates Expected section -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t3c/spec.md" "$TEST_ROOT/t3c/cards"
assert_out_contains "widget-show-table" "failure names the card"

echo "missing card file"
make_spec "$TEST_ROOT/t4"; make_cards "$TEST_ROOT/t4/cards"
rm "$TEST_ROOT/t4/cards/widget-show-table.md"
assert_exit 1 "missing card -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t4/spec.md" "$TEST_ROOT/t4/cards"
assert_out_contains "widget-show-table.md" "failure names the missing file"

echo "missing required section"
make_spec "$TEST_ROOT/t5"; make_cards "$TEST_ROOT/t5/cards"
sed -i.bak '/^## Cleanup/,$d' "$TEST_ROOT/t5/cards/widget-show-table.md"
assert_exit 1 "card without Cleanup heading -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t5/spec.md" "$TEST_ROOT/t5/cards"
assert_out_contains "Cleanup" "failure names the section"

echo "presence grep requires exact Expected heading, not a prefix match"
make_spec "$TEST_ROOT/t9"; make_cards "$TEST_ROOT/t9/cards"
sed -i.bak 's/^## Expected$/## Expectedly odd heading/' "$TEST_ROOT/t9/cards/widget-show-table.md"
assert_exit 1 "prefix-matching heading -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t9/spec.md" "$TEST_ROOT/t9/cards"
assert_out_contains "missing ## Expected section" "failure names the Expected section"

echo "extra card is a warning, not a failure"
make_spec "$TEST_ROOT/t6"; make_cards "$TEST_ROOT/t6/cards"
good_card_1 > "$TEST_ROOT/t6/cards/extra-exploration.md"
assert_exit 0 "extra card -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t6/spec.md" "$TEST_ROOT/t6/cards"
assert_out_contains "extra-exploration" "warning names the extra card"

echo "scenario table requires a delimiter row"
make_spec "$TEST_ROOT/t10"; make_cards "$TEST_ROOT/t10/cards"
sed -i.bak '/^| --- | --- | --- |$/d' "$TEST_ROOT/t10/spec.md"
assert_exit 1 "header followed by data without delimiter -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t10/spec.md" "$TEST_ROOT/t10/cards"

echo "scenario table requires a valid delimiter row"
make_spec "$TEST_ROOT/t11"; make_cards "$TEST_ROOT/t11/cards"
sed -i.bak 's/^| --- | --- | --- |$/| -- | --- | --- |/' "$TEST_ROOT/t11/spec.md"
assert_exit 1 "delimiter cells require at least three hyphens -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t11/spec.md" "$TEST_ROOT/t11/cards"

echo "scenario table inside a fenced example does not count"
mkdir -p "$TEST_ROOT/t12/cards"
make_cards "$TEST_ROOT/t12/cards"
cat > "$TEST_ROOT/t12/spec.md" <<'EOF'
# Widget Design

## E2E scenario cards

```markdown
| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Rendered table incl. TOTAL row | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
| widget-status-flags | Status output | If `widget status` does not print exactly `OK \| DEGRADED` (a literal pipe) with dots . and stars * intact, the scenario FAILS. |
```
EOF
assert_exit 2 "fenced-only table -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t12/spec.md" "$TEST_ROOT/t12/cards"

echo "fenced example before a real table is ignored"
mkdir -p "$TEST_ROOT/t13/cards"
make_cards "$TEST_ROOT/t13/cards"
cat > "$TEST_ROOT/t13/spec.md" <<'EOF'
# Widget Design

## E2E scenario cards

~~~markdown
| Card | Covers | Falsification |
| --- | --- | --- |
| fake-card | Example only | If the example is absent, the scenario FAILS. |
~~~

| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Rendered table incl. TOTAL row | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
| widget-status-flags | Status output | If `widget status` does not print exactly `OK \| DEGRADED` (a literal pipe) with dots . and stars * intact, the scenario FAILS. |
EOF
assert_exit 0 "real table after fenced example -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t13/spec.md" "$TEST_ROOT/t13/cards"

echo "card structure inside a fenced example does not count"
make_spec "$TEST_ROOT/t14"; make_cards "$TEST_ROOT/t14/cards"
cat > "$TEST_ROOT/t14/cards/widget-show-table.md" <<'EOF'
# widget-show-table: illustrative card only

~~~markdown
**What this covers**: the rendered table.

## Pre-state
A built widget binary.

## Steps
1. Run `widget show`.

## Expected
If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS.

## Cleanup
Nothing to clean.
~~~
EOF
assert_exit 1 "required card content found only inside a fence -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t14/spec.md" "$TEST_ROOT/t14/cards"

echo "unrelated fenced examples remain valid card content"
make_spec "$TEST_ROOT/t15"; make_cards "$TEST_ROOT/t15/cards"
cat >> "$TEST_ROOT/t15/cards/widget-show-table.md" <<'EOF'

```console
$ widget show
TOTAL  20.85
```
EOF
assert_exit 0 "valid card with unrelated fenced example -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t15/spec.md" "$TEST_ROOT/t15/cards"

echo "card names cannot traverse outside the cards directory"
make_spec "$TEST_ROOT/t16"; make_cards "$TEST_ROOT/t16/cards"
sed -i.bak 's/| widget-show-table |/| ..\/outside |/' "$TEST_ROOT/t16/spec.md"
mv "$TEST_ROOT/t16/cards/widget-show-table.md" "$TEST_ROOT/t16/outside.md"
assert_exit 1 "parent-traversing Card value -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t16/spec.md" "$TEST_ROOT/t16/cards"
assert_out_contains "invalid Card value" "traversal failure names the invalid value"

echo "card names use lowercase kebab case"
make_spec "$TEST_ROOT/t17"; make_cards "$TEST_ROOT/t17/cards"
sed -i.bak 's/| widget-show-table |/| Upper-Case |/' "$TEST_ROOT/t17/spec.md"
mv "$TEST_ROOT/t17/cards/widget-show-table.md" "$TEST_ROOT/t17/cards/Upper-Case.md"
assert_exit 1 "uppercase Card value -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t17/spec.md" "$TEST_ROOT/t17/cards"
assert_out_contains "invalid Card value" "uppercase failure names the invalid value"

make_spec "$TEST_ROOT/t18"; make_cards "$TEST_ROOT/t18/cards"
sed -i.bak 's/| widget-show-table |/| two--segments |/' "$TEST_ROOT/t18/spec.md"
mv "$TEST_ROOT/t18/cards/widget-show-table.md" "$TEST_ROOT/t18/cards/two--segments.md"
assert_exit 1 "empty kebab segment -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t18/spec.md" "$TEST_ROOT/t18/cards"
assert_out_contains "invalid Card value" "empty-segment failure names the invalid value"

echo "one enclosing backtick pair remains supported"
make_spec "$TEST_ROOT/t19"; make_cards "$TEST_ROOT/t19/cards"
sed -i.bak 's/| widget-show-table |/| `widget-show-table` |/' "$TEST_ROOT/t19/spec.md"
assert_exit 0 "backticked kebab-case Card value -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t19/spec.md" "$TEST_ROOT/t19/cards"

echo "pipe-less tables report the canonical outer-pipe contract"
make_spec "$TEST_ROOT/t20"; make_cards "$TEST_ROOT/t20/cards"
sed -E -i.bak 's/^\| (.*) \|$/\1/' "$TEST_ROOT/t20/spec.md"
assert_exit 2 "pipe-less table remains unsupported -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t20/spec.md" "$TEST_ROOT/t20/cards"
assert_out_contains "scenario table rows must use leading and trailing outer pipes" \
  "diagnostic names the canonical outer-pipe contract"

echo "a shorter backtick run does not close a longer spec fence"
mkdir -p "$TEST_ROOT/t21/cards"
make_cards "$TEST_ROOT/t21/cards"
cat > "$TEST_ROOT/t21/spec.md" <<'EOF'
# Widget Design

## E2E scenario cards

````markdown
```text
| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Example only | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
````
EOF
assert_exit 2 "shorter backtick run stays inside four-backtick fence -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t21/spec.md" "$TEST_ROOT/t21/cards"

echo "a shorter tilde run does not expose card structure"
make_spec "$TEST_ROOT/t22"; make_cards "$TEST_ROOT/t22/cards"
cat > "$TEST_ROOT/t22/cards/widget-show-table.md" <<'EOF'
# widget-show-table: fenced example only

~~~~markdown
~~~text
**What this covers**: the rendered table.

## Pre-state
A built widget binary.

## Steps
1. Run `widget show`.

## Expected
If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS.

## Cleanup
Nothing to clean.
~~~~
EOF
assert_exit 1 "shorter tilde run stays inside four-tilde fence -> exit 1" \
  "$CHECKER" "$TEST_ROOT/t22/spec.md" "$TEST_ROOT/t22/cards"

echo "a longer same-family run closes the fence"
mkdir -p "$TEST_ROOT/t23/cards"
make_cards "$TEST_ROOT/t23/cards"
cat > "$TEST_ROOT/t23/spec.md" <<'EOF'
# Widget Design

## E2E scenario cards

````markdown
example only
``````

| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Rendered table | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
EOF
assert_exit 0 "longer backtick run closes four-backtick fence -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t23/spec.md" "$TEST_ROOT/t23/cards"

echo "the other marker family does not close the fence"
mkdir -p "$TEST_ROOT/t24/cards"
make_cards "$TEST_ROOT/t24/cards"
cat > "$TEST_ROOT/t24/spec.md" <<'EOF'
# Widget Design

## E2E scenario cards

````markdown
~~~~
| Card | Covers | Falsification |
| --- | --- | --- |
| widget-show-table | Example only | If stdout's last line is not `TOTAL` followed by the two-decimal sum (20.85 for the seed fixture), or the TOTAL row is absent entirely, the scenario FAILS. |
EOF
assert_exit 2 "tilde run does not close backtick fence -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t24/spec.md" "$TEST_ROOT/t24/cards"

echo "no scenario table"
mkdir -p "$TEST_ROOT/t7/cards"
printf '# Widget Design\n\nNo table here.\n' > "$TEST_ROOT/t7/spec.md"
assert_exit 2 "table-less spec -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t7/spec.md" "$TEST_ROOT/t7/cards"
assert_out_contains "no scenario table" "diagnostic present"
assert_out_contains "heading must be exactly" "diagnostic includes naming hint"

echo "heading match is case-insensitive"
make_spec "$TEST_ROOT/t8"; make_cards "$TEST_ROOT/t8/cards"
sed -i.bak 's/^## E2E scenario cards/## E2E Scenario Cards/' "$TEST_ROOT/t8/spec.md"
assert_exit 0 "title-case heading still found" \
  "$CHECKER" "$TEST_ROOT/t8/spec.md" "$TEST_ROOT/t8/cards"

echo "usage"
assert_exit 64 "no args -> exit 64" "$CHECKER"
assert_exit 0 "--help -> exit 0" "$CHECKER" --help
assert_out_contains "Usage:" "help text present"

echo
if [ "$FAILURES" -gt 0 ]; then echo "$FAILURES test(s) failed"; exit 1; fi
echo "all tests passed"
