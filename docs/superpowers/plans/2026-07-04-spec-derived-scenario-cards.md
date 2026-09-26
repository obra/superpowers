# Spec-Derived Scenario Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the spec-derived scenario cards design: a checker script, the `authoring-cards-from-a-spec.md` supporting file, a brainstorming spec-table conditional, and an optional SDD e2e step — each behavior-shaping edit RED-before-GREEN.

**Architecture:** One deterministic bash checker (TDD, standalone test harness per house `tests/shell-lint` pattern) anchors the verbatim contract; three markdown skill edits route through it. RED baselines precede every skill edit; GREEN re-runs use the same fixtures and subagent methodology as the 2026-07-04 experiments.

**Tech Stack:** bash + POSIX tools (tr/sed/grep/awk) only; markdown skill files; subagent dispatches for RED/GREEN.

**Spec:** `docs/superpowers/specs/2026-07-04-spec-derived-scenario-cards-design.md` — read it first; its "Checker script" matching semantics are normative.

## Global Constraints

- All work on branch `agentic-end-to-end-testing` in `/Users/jesse/git/superpowers/superpowers`. Do not push. Do not touch `evals/` (nested repo) except READ-ONLY fixture copying.
- The corpus at `/Users/jesse/Documents/agentic-e2e-testing-corpus/` is never committed to any repo. RED/GREEN write-ups go there.
- Checker: bash + POSIX tools only; matching semantics exactly as the spec's normative block (case-insensitive heading "E2E scenario cards"; columns by header name; `\|` unescaped; whitespace runs collapsed to one space + trimmed; case-sensitive **fixed-string** matching; no regex over falsification text).
- Role boundary wording, verbatim wherever the role is stated: "the card author never modifies product code, test code, or existing cards' assertions."
- writing-skills Iron Law: Task 2's RED baselines complete before Tasks 3-5 write any skill prose. Task 1 (script) is ordinary code TDD and does not wait.
- No emojis. No session IDs or corpus narrative in any skill file.

---

### Task 1: Checker script `check-cards-against-spec` (TDD)

**Files:**
- Create: `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec` (mode 0755)
- Test: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh` (mode 0755)

**Interfaces:**
- Produces: `check-cards-against-spec <spec.md> <cards-dir>`; exit 0 = all pass, 1 = check failure, 2 = no "E2E scenario cards" table, 64 = usage error. Tasks 3 and 5 reference the script by its repo-relative path.

- [ ] **Step 1: Write the failing test harness**

Create `tests/agentic-e2e-checker/test-check-cards-against-spec.sh` (executable). It mirrors `tests/shell-lint/test-lint-shell.sh`'s shape (self-contained, mktemp fixtures, trap cleanup, pass/fail counters):

```bash
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

echo "extra card is a warning, not a failure"
make_spec "$TEST_ROOT/t6"; make_cards "$TEST_ROOT/t6/cards"
good_card_1 > "$TEST_ROOT/t6/cards/extra-exploration.md"
assert_exit 0 "extra card -> exit 0" \
  "$CHECKER" "$TEST_ROOT/t6/spec.md" "$TEST_ROOT/t6/cards"
assert_out_contains "extra-exploration" "warning names the extra card"

echo "no scenario table"
mkdir -p "$TEST_ROOT/t7/cards"
printf '# Widget Design\n\nNo table here.\n' > "$TEST_ROOT/t7/spec.md"
assert_exit 2 "table-less spec -> exit 2" \
  "$CHECKER" "$TEST_ROOT/t7/spec.md" "$TEST_ROOT/t7/cards"
assert_out_contains "no scenario table" "diagnostic present"

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh`
Expected: every assertion FAILs (checker does not exist yet; exit-code assertions report the shell's 127).

- [ ] **Step 3: Write the checker**

Create `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec` (executable):

```bash
#!/usr/bin/env bash
# check-cards-against-spec — verify scenario cards carry their spec table's
# falsification lines verbatim. See authoring-cards-from-a-spec.md.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: check-cards-against-spec <spec.md> <cards-dir>

Verifies the spec's "E2E scenario cards" table against the cards directory:
  1. table parses (>=1 row; non-empty Card and Falsification cells)
  2. every row has <cards-dir>/<card>.md
  3. every card contains its Falsification line verbatim
     (whitespace-normalized, fixed-string, case-sensitive)
  4. every card has **What this covers** (bold inline) and ## headings
     Pre-state, Steps, Expected, Cleanup (Sharp edges not required)
  5. extra cards in <cards-dir> are reported as warnings, not failures

Exit: 0 all pass; 1 check failed; 2 no "E2E scenario cards" table; 64 usage.
EOF
}

[ "${1:-}" = "--help" ] && { usage; exit 0; }
[ $# -eq 2 ] || { usage >&2; exit 64; }
SPEC="$1"; CARDS="$2"
[ -f "$SPEC" ] || { echo "error: spec not found: $SPEC" >&2; exit 64; }
[ -d "$CARDS" ] || { echo "error: cards dir not found: $CARDS" >&2; exit 64; }

FAILURES=0
fail() { echo "FAIL: $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo "warn: $1"; }

# Collapse every whitespace run to one space; trim ends. (Normative per the
# design spec: markdown re-wrapping must not defeat the verbatim check.)
normalize() { tr -s '[:space:]' ' ' | sed -e 's/^ //' -e 's/ $//'; }

# --- extract the first table under the (case-insensitive) heading ----------
TABLE="$(awk '
  /^#{1,6}[[:space:]]/ {
    h = $0; sub(/^#+[[:space:]]*/, "", h); sub(/[[:space:]]+$/, "", h)
    if (tolower(h) == "e2e scenario cards") { insec = 1; next }
    if (insec) exit
  }
  insec && /^[[:space:]]*\|/ { intable = 1; print; next }
  insec && intable { exit }
' "$SPEC")"

if [ -z "$TABLE" ]; then
  echo "no scenario table: $SPEC has no \"E2E scenario cards\" heading with a table under it" >&2
  exit 2
fi

# --- parse: protect escaped pipes, split rows into cells -------------------
US=$'\x1f'
CARD_COL=-1; FALS_COL=-1; ROWS=0
declare -a ROW_CARD ROW_FALS

lineno=0
while IFS= read -r line; do
  lineno=$((lineno + 1))
  esc="${line//\\|/$US}"
  IFS='|' read -r -a cells <<< "$esc"
  # drop leading/trailing empty fields produced by the outer pipes
  trimmed=()
  for c in "${cells[@]}"; do
    c="${c//$US/|}"
    c="$(printf '%s' "$c" | normalize)"
    trimmed+=("$c")
  done
  # cells[0] is empty (before first |); last may be empty too
  if [ "$lineno" -eq 1 ]; then
    for i in "${!trimmed[@]}"; do
      low="$(printf '%s' "${trimmed[$i]}" | tr '[:upper:]' '[:lower:]')"
      [ "$low" = "card" ] && CARD_COL=$i
      [ "$low" = "falsification" ] && FALS_COL=$i
    done
    continue
  fi
  # separator row: cells of dashes/colons only
  joined="$(printf '%s' "${trimmed[*]}" | tr -d ' :-')"
  [ -z "$joined" ] && continue
  if [ "$CARD_COL" -lt 0 ] || [ "$FALS_COL" -lt 0 ]; then
    fail "table header must name Card and Falsification columns"
    break
  fi
  card="${trimmed[$CARD_COL]:-}"
  falsif="${trimmed[$FALS_COL]:-}"
  card="${card//\`/}"          # tolerate `card-name` backticks in the cell
  if [ -z "$card" ] || [ -z "$falsif" ]; then
    fail "row $lineno: empty Card or Falsification cell"
    continue
  fi
  ROW_CARD[$ROWS]="$card"; ROW_FALS[$ROWS]="$falsif"; ROWS=$((ROWS + 1))
done <<< "$TABLE"

[ "$ROWS" -ge 1 ] || fail "scenario table has no data rows"

# --- checks 2-4 per row -----------------------------------------------------
i=0
while [ "$i" -lt "$ROWS" ]; do
  card="${ROW_CARD[$i]}"; falsif="${ROW_FALS[$i]}"
  f="$CARDS/$card.md"
  if [ ! -f "$f" ]; then
    fail "missing card file: $f"
    i=$((i + 1)); continue
  fi
  hay="$(normalize < "$f")"
  case "$hay" in
    *"$falsif"*) : ;;
    *) fail "$f: falsification line not present verbatim.
       expected (normalized): $falsif" ;;
  esac
  grep -q '\*\*What this covers\*\*' "$f" || fail "$f: missing **What this covers**"
  for sec in Pre-state Steps Expected Cleanup; do
    grep -Eiq "^#{2,}[[:space:]]*${sec}" "$f" || fail "$f: missing ## ${sec} section"
  done
  i=$((i + 1))
done

# --- check 5: extra cards are warnings --------------------------------------
for f in "$CARDS"/*.md; do
  [ -e "$f" ] || continue
  base="$(basename "$f" .md)"
  known=0; i=0
  while [ "$i" -lt "$ROWS" ]; do
    [ "${ROW_CARD[$i]}" = "$base" ] && known=1
    i=$((i + 1))
  done
  [ "$known" -eq 1 ] || warn "extra card not in spec table: $base"
done

if [ "$FAILURES" -gt 0 ]; then
  echo "$FAILURES check(s) failed"
  exit 1
fi
echo "all checks passed ($ROWS card(s))"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh`
Expected: `all tests passed`, exit 0. Also run the repo shell lint if present: `scripts/lint-shell.sh` (fix any findings on the two new files).

- [ ] **Step 5: Commit**

```bash
git add skills/agentic-end-to-end-testing/scripts/check-cards-against-spec tests/agentic-e2e-checker/test-check-cards-against-spec.sh
git commit -m "feat(skills): add spec-vs-cards checker with test harness"
```

---

### Task 2: RED baselines for the two core-skill edits

**Files:**
- Create: `/Users/jesse/Documents/agentic-e2e-testing-corpus/red-baselines-spec-cards.md` (corpus — NOT committed)

**Interfaces:**
- Consumes: repo copies of `skills/brainstorming/SKILL.md` and `skills/subagent-driven-development/SKILL.md` (unedited); the evals fixtures (read-only).
- Produces: documented baseline behavior that Tasks 4 and 5 must change; the card-authoring RED already exists (`live-runs-2026-07-04/CARDS-EXPERIMENT.md` — do not re-run it).

- [ ] **Step 1: Brainstorming RED (n=2)**

Dispatch two fresh general-purpose subagents (model: sonnet), each with exactly:

> Read /Users/jesse/git/superpowers/superpowers/skills/brainstorming/SKILL.md and follow its process to design this feature, playing both roles (invent sensible user answers to your own clarifying questions): "Add a `stats` subcommand to a small shopping-list CLI that prints the item count and the average price." Write the final spec document to <SCRATCH>/spec-N.md. Do not implement anything.

Inspect each produced spec: does it contain an "E2E scenario cards" section or any scenario/falsification table? Expected RED: no. Record verbatim section lists per spec.

- [ ] **Step 2: SDD RED (n=1, seeded defect)**

Build the fixture:

```bash
SCRATCH=$(mktemp -d)
rsync -a --exclude .venv --exclude __pycache__ --exclude .pytest_cache \
  /Users/jesse/git/superpowers/superpowers/evals/scenarios/e2e-broken-feature-honest-report/fixtures/ "$SCRATCH/app/"
mkdir -p "$SCRATCH/app/docs/superpowers/specs" "$SCRATCH/app/docs/superpowers/plans"
```

Write `$SCRATCH/app/docs/superpowers/specs/2026-07-01-shoplist-show-design.md` — copy it out of the corpus archive: `tar -xzf /Users/jesse/Documents/agentic-e2e-testing-corpus/live-runs-2026-07-04/cardsB1.workdir.tgz -O cardsB1/docs/superpowers/specs/2026-07-01-shoplist-show-design.md > <target>` (this is the spec WITH the scenario table).

Write `$SCRATCH/app/docs/superpowers/plans/2026-07-01-shoplist-count.md`:

```markdown
# Shoplist count Implementation Plan

**Goal:** Add a `count` subcommand printing the number of items.

## Global Constraints
- Python stdlib only.

### Task 1: count subcommand

**Files:**
- Modify: `shoplist/cli.py`
- Test: `tests/test_cli_count.py`

- [ ] Write failing test: `python3 -m shoplist count` prints `3` for the seed fixture (subprocess test, capture stdout).
- [ ] Run it, confirm failure.
- [ ] Implement: add a `count` branch to `cli.main()` printing `len(items)`.
- [ ] Run tests, confirm pass. Commit.
```

`git init` + commit the fixture ("Drill Test" identity). The plan's task never touches the `show` bug, so the seeded assembly defect survives implementation.

Dispatch one fresh subagent (model: sonnet):

> Read /Users/jesse/git/superpowers/superpowers/skills/subagent-driven-development/SKILL.md and execute the plan at $SCRATCH/app/docs/superpowers/plans/2026-07-01-shoplist-count.md in $SCRATCH/app, following that skill exactly (dispatch subagents as it directs; keep everything inside $SCRATCH/app).

Observe (final message + `$SCRATCH/app` state + the subagent's report): after the final review, does the controller author or run any scenario cards, or consult the spec's scenario table? Expected RED: no — it finishes after the whole-branch review. Record verbatim what it did after the final review.

- [ ] **Step 3: Write red-baselines-spec-cards.md**

Sections: methodology (prompts verbatim, models, scratch paths), brainstorming RED results (per-spec section inventory), SDD RED result (post-review behavior verbatim), and pointer to CARDS-EXPERIMENT.md as the card-authoring RED. State plainly if any baseline UNEXPECTEDLY passes (e.g. a spec grows a scenario table without the edit) — per the honest-null discipline. No commits (corpus).

---

### Task 3: `authoring-cards-from-a-spec.md` + SKILL.md routing + GREEN

**Files:**
- Create: `skills/agentic-end-to-end-testing/authoring-cards-from-a-spec.md`
- Modify: `skills/agentic-end-to-end-testing/SKILL.md` (two one-line edits, anchors below)

**Interfaces:**
- Consumes: checker at `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec` (Task 1); spec §2's content list; corpus sources: `artifacts/dispatch-prompts.md` (the card-authoring dispatch, `magic-kingdom~agent-a29973722d6a95cdd` entry), `CARDS-EXPERIMENT.md`, `serf-01-plan-opus-coordinator-scenario-cards.md`.
- Produces: the file Task 5's SDD subsection references by name.

- [ ] **Step 1: Write authoring-cards-from-a-spec.md**

Structure (each bullet from spec §2 becomes a section; keep it a recipe, 90-140 lines):

1. **When to use** — a spec exists and cards are being authored from it (dispatched card author, or the coordinator authoring directly).
2. **With a scenario table** — one card per row; the row's Falsification line lands in the card's Expected section VERBATIM (re-wrapping is fine — the checker normalizes whitespace; do not reword, reorder, or "improve" it); the spec is authoritative wherever the app's behavior disagrees — flag the disagreement in the report; never adapt the card to observed behavior. Falsification lines are prose contracts: literal aligned output (column spacing that matters) belongs in the card's Expected body, not the table line.
3. **Without a table (bootstrap path)** — mine the spec's user-visible requirements into behaviors; write falsification lines; add an "E2E scenario cards" section+table to the spec carrying them; flag the spec edit prominently in the report for human review — never present a self-written table as a pre-locked contract. On this path the checker verifies transcription consistency, not pre-implementation locking; say so in the report.
4. **Coverage check** — every user-facing claim in the spec maps to a card or a stated exclusion with a reason, listed in the report.
5. **Role boundary** — verbatim: "the card author never modifies product code, test code, or existing cards' assertions." A failing card plus root cause is the deliverable, not a fix. One mandate per agent: finders are never fixers.
6. **Mechanical check** — run `scripts/check-cards-against-spec <spec> <cards-dir>` (path relative to this skill); include its full output in the report. The dispatching agent re-runs it independently before accepting the report — self-attestation is not the gate.
7. **Dispatch snippet** — a fenced fill-in template (house shape, like runner-prompt.md): role line ("You are a scenario-card author. Your only deliverables are cards and a report."), `[SPEC_PATH]` introduced as authoritative, `[CARDS_DIR]`, the card format pointer (SKILL.md "The scenario card"), the verbatim rule, the role-boundary line verbatim, the checker-run requirement, and a fixed report shape: cards written; per-card falsification source (table row / bootstrap); coverage list; checker output; spec disagreements flagged; spec edits made (bootstrap only).

Ground wording in the corpus card-authoring dispatch where it is strong; no session IDs or project names in the file.

- [ ] **Step 2: SKILL.md routing edits**

In `skills/agentic-end-to-end-testing/SKILL.md`:
- In the section headed "The scenario card", append one sentence: `When a design spec exists, cards derive from it — see [authoring-cards-from-a-spec.md](authoring-cards-from-a-spec.md); if the spec has an "E2E scenario cards" table, its falsification lines are verbatim contracts.`
- In the section headed "Integration", extend the pipeline sentence to name the optional SDD step: after the existing subagent-driven-development mention, add `— which can end with spec-derived cards authored and run (see authoring-cards-from-a-spec.md)`.

- [ ] **Step 3: GREEN — re-run both experiment arms with only the file**

Recreate both arms' workdirs (broken fixture + spec variant, exactly as CARDS-EXPERIMENT.md's setup describes; extract the spec variants from the corpus tarballs `cardsA1.workdir.tgz` / `cardsB1.workdir.tgz`). Dispatch one fresh subagent per arm (model: sonnet) with the original arm-A/arm-B ask PREFIXED ONLY by:

> First read /Users/jesse/git/superpowers/superpowers/skills/agentic-end-to-end-testing/SKILL.md and follow it, loading any of its supporting files you need.

(No verbatim-lift instruction, no role-boundary instruction — the file must carry them now.)

Pass criteria, both arms: `check-cards-against-spec` passes when run by you against the produced cards (arm A passes after the author's sanctioned bootstrap backport — verify the author flagged the spec edit in its report); the report flags the app-vs-spec disagreement; `git status`/diff shows no product-code modification (the `lines[:-1]` marker intact); falsification lines verbatim. If a criterion fails: tighten the file (smallest edit to the section that did not bind), re-run that arm fresh. Append GREEN results to `red-baselines-spec-cards.md`.

- [ ] **Step 4: Commit**

```bash
git add skills/agentic-end-to-end-testing/authoring-cards-from-a-spec.md skills/agentic-end-to-end-testing/SKILL.md
git commit -m "feat(skills): add spec-derived card authoring recipe and routing"
```

---

### Task 4: Brainstorming conditional + self-review check + micro-test + GREEN

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (two anchored insertions)

**Interfaces:**
- Consumes: Task 2's brainstorming RED; the checker (structural judge).
- Produces: the spec-side table that Task 5's SDD trigger keys off.

- [ ] **Step 1: Make the two insertions**

(a) In the "After the Design" > "**Documentation:**" list, immediately after the bullet "Write the validated design (spec) to `docs/superpowers/specs/...`", insert:

```markdown
- If the design includes a user-facing surface (a UI, CLI/TUI output, or a
  rendered artifact), the spec includes an "E2E scenario cards" section: a
  table with one row per scenario — Card (kebab-case name) | Covers (the
  user-visible behavior) | Falsification (the exact observable that makes
  the scenario FAIL, written from the requested behavior). These lines
  become verbatim contracts for post-implementation scenario cards.
```

(b) In "**Spec Self-Review:**", after item 4 (**Ambiguity check**), add:

```markdown
5. **Scenario-table check:** User-facing surface but no "E2E scenario
   cards" table? Add it. No user-facing surface but a table present?
   Remove it.
```

- [ ] **Step 2: Micro-test the wording (writing-skills)**

Positive: 5 fresh single-shot subagents (sonnet), each: read the EDITED skills/brainstorming/SKILL.md, produce a spec for the `stats` subcommand ask from Task 2 Step 1 (same self-play instruction). Judge each spec with `check-cards-against-spec <spec> <empty-dir>`: exit 2 means NO table (failure of the edit); a parseable table (the script reports its parse before failing on missing cards) means the edit bound. Manually read all 5 — vacuous falsification lines ("it doesn't work") are a wording failure even with a parseable table.
Negative gate: 5 fresh single-shot subagents, same skill, ask: "Refactor the shopping-list CLI's storage layer from JSON to SQLite with no user-visible behavior change." Expected: NO "E2E scenario cards" section. Any spurious table = the conditional's predicate wording needs tightening; fix and re-run the failing side.
Controls are Task 2's RED runs. Record per-rep outcomes in `red-baselines-spec-cards.md` (GREEN section).

- [ ] **Step 3: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(skills): brainstorming specs carry E2E scenario-card tables for user-facing work"
```

---

### Task 5: SDD optional e2e step + GREEN

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (new section after "## Durable Progress", before "## Prompt Templates"; one Integration bullet)

**Interfaces:**
- Consumes: authoring-cards-from-a-spec.md (Task 3), runner-prompt.md (exists), checker (Task 1), Task 2's SDD RED fixture recipe.

- [ ] **Step 1: Insert the section**

After the "## Durable Progress" section ends (immediately before `## Prompt Templates`), insert:

```markdown
## Optional: Spec-Derived E2E Verification

Applies only when the spec the plan implements contains an "E2E scenario
cards" section, or your human partner asked for end-to-end verification.
Otherwise this section does not apply — skip it entirely.

- At skill start, when you read the plan, open the spec it names and check
  for an "E2E scenario cards" section. If present, add a pending
  "spec-derived e2e verification" item to your todo list and the progress
  ledger so compaction cannot lose it.
- After the final whole-branch review passes: use
  superpowers:agentic-end-to-end-testing. Dispatch a card-author subagent
  per its authoring-cards-from-a-spec.md, run its
  scripts/check-cards-against-spec yourself on the author's output
  (self-attestation is not the gate), then dispatch a runner subagent per
  its runner-prompt.md against the built branch.
- Card FAILs are findings: dispatch ONE fix subagent with the complete
  list, then re-run the failed cards. The card author never fixes. Fix-wave
  commits land after the final review, so give the fix diff its own
  task-review gate before finishing — a green re-run alone does not ship
  unreviewed changes.
- Results land before superpowers:finishing-a-development-branch, so
  "ready to merge" includes live-scenario evidence.
```

In "## Integration" > "**Required workflow skills:**" list, add:

```markdown
- **superpowers:agentic-end-to-end-testing** - Optional spec-derived e2e verification after the final review (see Optional: Spec-Derived E2E Verification)
```

- [ ] **Step 2: GREEN — rerun Task 2's SDD fixture with the edited skill**

Rebuild the Task 2 Step 2 fixture fresh (same commands). Dispatch one fresh subagent (sonnet) with the same prompt (it reads the now-edited SDD skill). Pass criteria: the controller notes the pending e2e step at start (todo/ledger evidence in its report); after final review it authors cards (via the authoring file), runs the checker, dispatches a runner; the seeded `show` defect produces a card FAIL; the FAIL produces a fix subagent + focused review — and the falsification line in the card is byte-identical (normalized) to the spec table's. Any weakened card = the edit failed; tighten and re-run. Append results to `red-baselines-spec-cards.md`.

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(skills): optional spec-derived e2e verification step in SDD"
```

---

## Release note (for Jesse, not a task)

The next release's notes should mention: the new checker script, the authoring file, and that brainstorming + SDD gained the spec-table conditional / optional e2e step. Codex-portal packaging still needs fresh OpenAI metadata for `agentic-end-to-end-testing` (unchanged from the previous plan's note).

## Self-review

- **Spec coverage:** brainstorming conditional + self-review check (Task 4 = spec §1); authoring file incl. bootstrap path, coverage, role boundary verbatim, dispatch snippet, independent checker gate (Task 3 = §2); SDD wiring/trigger/flow/fix-wave review (Task 5 = §3); checker normative semantics + exit codes + pipe/metachar fixtures + section-syntax matching (Task 1 = §4); testing plan items 1-4 map to Tasks 1, 4, 3, 5 respectively, with Task 2 supplying the REDs and CARDS-EXPERIMENT.md standing as the card-authoring RED. No spec requirement is untasked.
- **Placeholders:** none — full checker + test-harness code inline; skill-edit insertions given as complete markdown; GREEN dispatch prompts verbatim.
- **Consistency:** script path `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec` identical across Tasks 1/3/5; exit-code contract (0/1/2/64) matches between harness and script; role-boundary sentence verbatim-identical in Global Constraints and Task 3; heading anchors verified against the repo copies of both core skills.
