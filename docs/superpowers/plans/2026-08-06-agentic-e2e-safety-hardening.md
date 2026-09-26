# Agentic E2E Safety Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the five in-scope safety findings on PR #1931 without expanding the checker into a general Markdown parser or changing browser-driving behavior.

**Architecture:** Keep the checker line-oriented and dependency-free. One bounded AWK filter removes fenced-code regions before the existing table and card-structure checks; the parser then validates the canonical outer-pipe table contract and card filename stems before filesystem lookup. The CLI/TUI recipe uses a run-unique tmux session name and an ownership flag so cleanup can only target a successfully created session.

**Tech Stack:** Bash 3.2-compatible shell, POSIX `awk`/`grep`/`sed`/`tr`, Markdown skill content, and fresh-agent pressure tests for the behavior-shaping tmux guidance.

**Spec:** `docs/superpowers/specs/2026-07-23-agentic-e2e-safety-hardening-design.md` — read it first; its scope, exit codes, and five scenario cards are normative.

## Global Constraints

- Work only in `/Users/drewritter/.codex/worktrees/f32f/superpowers` on `codex/review-comments-on-pr-1931`, based on PR head `ff19e90a`.
- Do not modify the parent checkout or the existing local `agentic-end-to-end-testing` branch.
- Keep canonical leading/trailing outer pipes. Pipe-less tables remain unsupported and exit `2` with an explicit outer-pipe hint.
- Add no Markdown parser and no dependency. Do not interpret block quotes, lists, inline code, HTML, or arbitrary table rendering.
- Preserve exits `64` (usage/input), `2` (no supported table), `1` (malformed/invalid), and `0` (all checks pass).
- Validate card names against `^[a-z0-9]+(-[a-z0-9]+)*$` before constructing `<cards-dir>/<card>.md`; retain one optional enclosing backtick pair.
- Do not change `skills/agentic-end-to-end-testing/driving-web-browser.md`.
- Run behavior tests against real scripts and tmux state; do not assert on large rendered source strings.
- Commit each independently reviewable task. Never use `git add -A`.

---

### Task 1: Fail-closed fenced structure and delimiter parsing

**Files:**
- Modify: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh`
- Modify: `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec`

**Interfaces:**
- Consumes: the existing `check-cards-against-spec <spec.md> <cards-dir>` process contract.
- Produces: `without_fenced_code <file>` output containing only structural lines outside backtick/tilde fences; canonical table parsing that requires a same-width delimiter row before data.

- [ ] **Step 1: Add process-level RED cases for malformed and fenced specs**

Extend the existing temporary-fixture harness with cases that:

```bash
# Missing delimiter: replace the canonical delimiter with the first data row.
make_spec "$TEST_ROOT/missing-delimiter"; make_cards "$TEST_ROOT/missing-delimiter/cards"
sed -i.bak '/^| --- | --- | --- |$/d' "$TEST_ROOT/missing-delimiter/spec.md"
assert_exit 1 "header followed by data without delimiter -> exit 1" \
  "$CHECKER" "$TEST_ROOT/missing-delimiter/spec.md" "$TEST_ROOT/missing-delimiter/cards"

# Fenced-only table: the complete canonical table is inside a backtick fence.
mkdir -p "$TEST_ROOT/fenced-only/cards"
make_cards "$TEST_ROOT/fenced-only/cards"
{
  printf '# Widget Design\n\n## E2E scenario cards\n\n```markdown\n'
  sed -n '/^| Card | Covers | Falsification |$/,$p' "$TEST_ROOT/t1/spec.md"
  printf '```\n'
} > "$TEST_ROOT/fenced-only/spec.md"
assert_exit 2 "table found only inside a fence -> exit 2" \
  "$CHECKER" "$TEST_ROOT/fenced-only/spec.md" "$TEST_ROOT/fenced-only/cards"

# A fenced example before a real table must not hide the real table.
make_spec "$TEST_ROOT/fenced-before-real"; make_cards "$TEST_ROOT/fenced-before-real/cards"
sed -i.bak '/^## E2E scenario cards$/a\
\
```markdown\
| Card | Covers | Falsification |\
| --- | --- | --- |\
| fake | Example | If fake, the scenario FAILS. |\
```\
' "$TEST_ROOT/fenced-before-real/spec.md"
assert_exit 0 "fenced example before canonical table is ignored" \
  "$CHECKER" "$TEST_ROOT/fenced-before-real/spec.md" "$TEST_ROOT/fenced-before-real/cards"
```

Add an equivalent malformed-delimiter case using `| -- | --- | --- |` and expect exit `1`.

- [ ] **Step 2: Run the checker harness and record RED**

Run:

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
```

Expected: the existing cases pass; missing/malformed delimiter and fenced-only cases demonstrate the current false-accept behavior, while the fenced-before-real case demonstrates that the current parser selects the wrong table.

- [ ] **Step 3: Add the bounded fence filter**

Add a `without_fenced_code()` shell function whose AWK state machine:

```awk
function fence_family(line, first, count) {
  sub(/^[[:space:]]*/, "", line)
  first = substr(line, 1, 1)
  if (first != "`" && first != "~") return ""
  count = 0
  while (substr(line, count + 1, 1) == first) count++
  return count >= 3 ? first : ""
}
{
  marker = fence_family($0)
  if (!in_fence && marker != "") { in_fence = 1; family = marker; next }
  if (in_fence && marker == family) { in_fence = 0; family = ""; next }
  if (!in_fence) print
}
```

Pipe the spec through this filter before table extraction. An unclosed fence therefore excludes the rest of the document.

- [ ] **Step 4: Require and validate the delimiter row**

Normalize each canonical row by trimming outer whitespace and removing exactly one leading and trailing pipe before splitting protected `\|` values. Store the header width. For row 2, require the same width and require every cell to satisfy:

```bash
printf '%s\n' "$cell" | grep -Eq '^:?-{3,}:?$'
```

On any mismatch, call `fail "row 2: malformed table delimiter"`, stop collecting data rows, and leave exit class `1`. Do not treat later rows as data unless row 2 passed.

- [ ] **Step 5: Run GREEN and syntax checks**

Run:

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
bash -n skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
```

Expected: all checker cases pass and the extensionless checker parses as Bash.

- [ ] **Step 6: Commit**

```bash
git add tests/agentic-e2e-checker/test-check-cards-against-spec.sh skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
git commit -m "fix(e2e): reject fenced and malformed scenario tables"
```

---

### Task 2: Filter card examples and confine card filenames

**Files:**
- Modify: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh`
- Modify: `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec`

**Interfaces:**
- Consumes: `without_fenced_code <file>` from Task 1.
- Produces: card validation based only on non-fenced structure and a validated filename stem before filesystem lookup.

- [ ] **Step 1: Add card-validation RED cases**

Add real-process cases for:

- a card whose `**What this covers**`, all four required headings, and falsification text exist only inside a fenced example — exit `1`;
- a valid card containing an unrelated fenced example — exit `0`;
- `../outside`, `Upper-Case`, and `two--segments` Card values — each exit `1` even if a correspondingly reachable file exists;
- `` `widget-show-table` `` — remains accepted.

Use literal fixture contents and existing `assert_exit`/`assert_out_contains`; assert only exit class plus the stable invalid-card-name diagnostic.

- [ ] **Step 2: Run the harness and record RED**

Run:

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
```

Expected: the fenced-only card and `../outside` cases false-pass on the unmodified implementation; invalid non-kebab names are not rejected at the row boundary.

- [ ] **Step 3: Validate card names during row parsing**

After normalizing the Card cell, remove one enclosing backtick pair only when it wraps the entire value:

```bash
case "$card" in
  \`*\`) card="${card#\`}"; card="${card%\`}" ;;
esac
```

Before adding the row to `ROW_CARD`, require:

```bash
[[ "$card" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]
```

If invalid, report the table row and value, increment failures, and do not store or join that value with `$CARDS`.

- [ ] **Step 4: Reuse filtered card text for every structural check**

Change `expected_section` to read stdin. For each existing card, compute the non-fenced text once:

```bash
card_text="$(without_fenced_code "$f")"
hay="$(printf '%s\n' "$card_text" | expected_section | normalize)"
```

Feed the same `card_text` to the `**What this covers**` and required-heading greps. Do not filter the card separately for each check.

- [ ] **Step 5: Make the canonical table rejection explicit**

Extend the exit-`2` diagnostic with this stable caller contract:

```text
scenario table rows must use leading and trailing outer pipes
```

Add a pipe-less table fixture that expects exit `2` and asserts that phrase.

- [ ] **Step 6: Run GREEN and commit**

Run:

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
bash -n skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
```

Then:

```bash
git add tests/agentic-e2e-checker/test-check-cards-against-spec.sh skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
git commit -m "fix(e2e): confine scenario card validation"
```

---

### Task 3: Make tmux session cleanup ownership-safe

**Files:**
- Modify: `skills/agentic-end-to-end-testing/driving-cli-tui.md`
- Create outside the repository: retained RED/GREEN pressure-test transcripts and a compact result table.

**Interfaces:**
- Consumes: a readable scenario stem and a real interactive command.
- Produces: one run-unique `$session`, matching `$stderr_log`, `$session_owned=0`, and cleanup that calls `tmux kill-session` only after this run successfully created the session.

- [ ] **Step 1: Run three RED pressure-test sessions**

Pre-create a sentinel tmux session and give each fresh subject the current CLI/TUI recipe plus a request to run and rerun a same-named TUI scenario under cleanup pressure. Record whether it kills/reuses the sentinel, creates a distinct session, and leaves only owned state cleaned up. Do not edit the skill before all three RED results are retained.

- [ ] **Step 2: Replace the shared-name recipe with explicit ownership**

Use this shape in the four-command recipe:

```bash
scenario="widget-form"
session="${scenario}-$(date +%s)-$$"
stderr_log="/tmp/${session}-stderr.log"
command="widget-tui"
session_owned=0

cleanup() {
  if [ "$session_owned" -eq 1 ]; then
    tmux kill-session -t "$session" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if ! tmux new-session -d -s "$session" -x 200 -y 50 "$command 2>\"$stderr_log\""; then
  echo "failed to create tmux session: $session" >&2
  exit 1
fi
session_owned=1
tmux send-keys -t "$session" -l "literal text"
tmux send-keys -t "$session" Enter
tmux capture-pane -t "$session" -p
```

State that `command` is the scenario's freshly built TUI invocation. Creation failure leaves ownership false; choose a new unique name or report failure, but never delete the colliding session. Replace every later literal session-name target in the recipe with `$session` and remove the preemptive kill command.

- [ ] **Step 3: Run three GREEN pressure-test sessions**

Repeat the exact RED scenario with the revised skill. Require all three subjects to preserve the sentinel, use a distinct session, and remove only their owned session. Manually inspect each transcript; a prose promise without matching commands is a failure.

- [ ] **Step 4: Commit**

```bash
git add skills/agentic-end-to-end-testing/driving-cli-tui.md
git commit -m "fix(e2e): scope tmux cleanup to owned sessions"
```

---

### Task 4: Final verification and review handoff

**Files:**
- Verify only; modify files only to correct a failing gate with a new RED test first.

**Interfaces:**
- Consumes: Tasks 1–3 and the five in-scope review-thread IDs.
- Produces: a clean branch, complete verification evidence, a full diff for Drew, and explicit remaining gates for browser/outer-pipe threads, eval approval, push, review, and merge.

- [ ] **Step 1: Run focused and packaging verification**

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
bash -n skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
bash tests/codex/test-package-codex-plugin.sh
git diff --check ff19e90a9b5590d7f55ce688bee3c6d94b4ea443..HEAD
```

- [ ] **Step 2: Run repository-relevant regression checks**

Run the shell, skill, and plugin test entry points discovered in the repository. Record exact commands and exit statuses; do not substitute an unrelated broad test for a missing focused gate.

- [ ] **Step 3: Review the complete PR delta**

Inspect:

```bash
git diff --stat ff19e90a9b5590d7f55ce688bee3c6d94b4ea443..HEAD
git diff --check ff19e90a9b5590d7f55ce688bee3c6d94b4ea443..HEAD
git diff ff19e90a9b5590d7f55ce688bee3c6d94b4ea443..HEAD
git status --short --branch
```

Map the delimiter, fenced-spec, fenced-card, card-path, and tmux-ownership threads to code/tests/evidence. Keep the browser-control and pipe-less-table-support threads explicitly not fixed.

- [ ] **Step 4: Stop at the human-review gate**

Show Drew the complete diff and evidence before any push or GitHub thread mutation. After explicit approval, push the reviewed commits to `agentic-end-to-end-testing` with the remote head lease checked against `ff19e90a`, then request final review/eval. Do not resolve or reply to threads without Drew's approval of the exact writes.
