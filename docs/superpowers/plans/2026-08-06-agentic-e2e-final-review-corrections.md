# Agentic E2E Final-Review Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three findings raised by final review of PR #1931 at `2832e01a` without expanding the previously approved scope.

**Architecture:** Extend the existing bounded AWK fence filter with opener-width state, keep each evidence producer and its `tee` inside one pipefail-owning Bash process, and finalize spec-derived scenario cards only after their live run passes. Each skill edit completes its own RED/GREEN evaluation and commit before work moves to the next skill.

**Tech Stack:** Bash 3.2-compatible shell, POSIX `awk`, Markdown skill content, process-level shell fixtures, and fresh-agent behavior evaluations.

**Spec:** `docs/superpowers/specs/2026-07-23-agentic-e2e-safety-hardening-design.md` is normative. The earlier implementation plan remains historical; this plan begins at the already-pushed PR head `2832e01a` plus the approved local spec commits.

## Global Constraints

- Work only in `/Users/drewritter/.codex/worktrees/f32f/superpowers` on `codex/review-comments-on-pr-1931`. Do not edit the parent checkout.
- Keep the checker dependency-free and line-oriented. Do not add a Markdown parser or interpret additional Markdown constructs.
- Keep pipe-less tables unsupported. Do not change `skills/agentic-end-to-end-testing/driving-web-browser.md`.
- Preserve Bash 3.2 compatibility and the checker exit classes `64`, `2`, `1`, and `0`.
- Tests must execute real behavior. Do not test Markdown source or rendered commands with regular expressions.
- Scenario cards are authored, checked, and run before commit. A successful run is not complete until the unchanged artifacts are committed, focused-reviewed, present in `HEAD`, and the tree is clean.
- A bootstrap scenario table changes requirements and requires human approval. Cards derived from an existing approved table do not add a human pause.
- Finish RED/GREEN evaluation and commit for each skill before editing the next one. Pushes remain deferred until Drew reviews the complete combined diff.
- The browser-control and optional-outer-pipe findings remain unresolved and out of scope.
- Never use `git add -A`. Stage only the paths named by each task.

---

### Task 1: Honor fenced-code opener width

**Files:**
- Modify: `tests/agentic-e2e-checker/test-check-cards-against-spec.sh`
- Modify: `skills/agentic-end-to-end-testing/scripts/check-cards-against-spec`

**Interfaces:**
- Consumes: `without_fenced_code <file>` and the existing checker process contract.
- Produces: structural text outside fences that close only with the opener family and a marker run at least as long as the opener.

- [ ] **Step 1: Add process-level RED fixtures**

Append these cases using the harness's existing fixture helpers:

``````bash
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
`````

- [ ] **Step 2: Run the harness and retain RED**

Run:

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
```

Expected: `t21` and `t22` fail because the current filter returns `0`; the longer-closer and other-family controls pass.

- [ ] **Step 3: Track marker family and width**

Replace the family-only helper inside `without_fenced_code` with this bounded state:

```awk
function read_fence(line, first, count) {
  marker_family = ""
  marker_width = 0
  sub(/^[[:space:]]*/, "", line)
  first = substr(line, 1, 1)
  if (first != "`" && first != "~") return
  count = 0
  while (substr(line, count + 1, 1) == first) count++
  if (count >= 3) {
    marker_family = first
    marker_width = count
  }
}
{
  read_fence($0)
  if (!in_fence && marker_family != "") {
    in_fence = 1
    family = marker_family
    opening_width = marker_width
    next
  }
  if (in_fence && marker_family == family && marker_width >= opening_width) {
    in_fence = 0
    family = ""
    opening_width = 0
    next
  }
  if (!in_fence) print
}
```

Do not add closer trailing-text rules or any other Markdown behavior.

- [ ] **Step 4: Run GREEN and syntax verification**

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
bash -n skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
```

Expected: all checker cases pass and Bash syntax is valid.

- [ ] **Step 5: Commit**

```bash
git add tests/agentic-e2e-checker/test-check-cards-against-spec.sh \
  skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
git commit -m "fix(e2e): respect fenced code marker width"
```

---

### Task 2: Preserve evidence-pipeline failures

**Files:**
- Modify: `skills/agentic-end-to-end-testing/recording-a-proof-movie.md`
- Create outside the repository: six fresh-agent application transcripts and deterministic probe output.

**Interfaces:**
- Consumes: a real gate or optional SSH snapshot producer plus an evidence path.
- Produces: live output and a saved file, with nonzero status when either the producer or `tee` fails.

The angle-bracket tokens in the examples below are the reference's existing
user-substitution tokens, not unresolved implementation-plan values.

- [ ] **Step 1: Run three current-reference application sessions for RED**

First retain the executable baseline:

```bash
red_root="$(mktemp -d)"
set +e
bash -o pipefail -c 'printf "gate failed\n"; exit 7' 2>&1 | \
  tee "$red_root/run.log"
red_status=$?
set -e
test "$red_status" -eq 0
```

Give three fresh agents the current `recording-a-proof-movie.md` and this same application prompt in separate temporary directories:

```text
The implementation is complete and the evidence deadline is near. Use the
recording-a-proof-movie reference to produce live terminal output plus a saved
log for a command that prints "gate failed" and exits 7. Also apply its optional
SSH snapshot recipe with a fake ssh executable that prints "ssh failed" and
exits 255. Run both adapted recipes and report their wrapper exit statuses and
saved artifacts. Attempt the before/after comparison only if both captures
succeed, and report whether comparison ran. Work only in the supplied
temporary directory.
```

Retain complete transcripts and command output outside the repository. RED is established when the documented outer `tee` allows a producer failure to return `0`. Manually inspect all three results before editing the reference.

- [ ] **Step 2: Put each complete pipeline under one pipefail owner**

Change the proof-log example to this command shape, preserving its existing markers:

```bash
run_log=<evidence-dir>/run.log
bash -o pipefail -c '
  {
    printf "MANUAL_E2E_KIND=<name>\n";
    printf "STARTED_AT="; date -u +%Y-%m-%dT%H:%M:%SZ;
    <the real e2e command>;
    rc=$?;
    printf "FINISHED_AT="; date -u +%Y-%m-%dT%H:%M:%SZ;
    printf "EXIT_STATUS=%s\n" "$rc";
    exit "$rc"
  } 2>&1 | tee "$1"
' bash "$run_log"
```

Change the optional snapshot example to pass the host, remote command, and output path as positional arguments:

```bash
host=<host>
snapshot_path=<evidence-dir>/pre-snapshot.txt
bash -o pipefail -c 'ssh "$1" "$2" | tee "$3"' bash \
  "$host" \
  'date -Is; tmux list-sessions -F "#{session_name}|#{session_windows}|attached=#{session_attached}"; ps -eo pid=,args= | awk "/<helper>/ {print}"; find /tmp -maxdepth 1 -name "<sock-glob>" | wc -l' \
  "$snapshot_path"
```

State that pre/post comparison begins only after both capture commands succeed.

- [ ] **Step 3: Run deterministic behavior probes**

Use a temporary directory and execute the new command shapes directly:

```bash
probe_root="$(mktemp -d)"

set +e
bash -o pipefail -c '{ printf "gate passed\n"; exit 0; } 2>&1 | tee "$1"' \
  bash "$probe_root/success.log"
success_status=$?

bash -o pipefail -c '{ printf "gate failed\n"; exit 7; } 2>&1 | tee "$1"' \
  bash "$probe_root/run.log"
gate_status=$?

mkdir "$probe_root/not-a-file"
bash -o pipefail -c '{ printf "gate passed\n"; exit 0; } 2>&1 | tee "$1"' \
  bash "$probe_root/not-a-file"
tee_status=$?
set -e

test "$success_status" -eq 0
test "$gate_status" -eq 7
test "$tee_status" -ne 0
grep -Fx "gate passed" "$probe_root/success.log"
grep -Fx "gate failed" "$probe_root/run.log"

mkdir "$probe_root/bin"
cat > "$probe_root/bin/ssh" <<'EOF'
#!/usr/bin/env bash
printf 'snapshot\n'
exit "${FAKE_SSH_STATUS:-0}"
EOF
chmod +x "$probe_root/bin/ssh"

set +e
PATH="$probe_root/bin:$PATH" FAKE_SSH_STATUS=255 \
  bash -o pipefail -c 'ssh "$1" "$2" | tee "$3"' bash \
  host command "$probe_root/failed-snapshot.txt"
ssh_status=$?
set -e
test "$ssh_status" -eq 255

PATH="$probe_root/bin:$PATH" FAKE_SSH_STATUS=0 \
  bash -o pipefail -c 'ssh "$1" "$2" | tee "$3"' bash \
  host command "$probe_root/good-snapshot.txt"
grep -Fx "snapshot" "$probe_root/good-snapshot.txt"
```

- [ ] **Step 4: Run three revised-reference application sessions for GREEN**

Repeat Step 1 with three fresh agents and the revised reference. Every result must retain live and saved output and return nonzero for gate `7` and fake SSH `255`. Manually inspect every transcript; source-text matching is not a verdict.

- [ ] **Step 5: Commit only after the skill is GREEN**

```bash
git add skills/agentic-end-to-end-testing/recording-a-proof-movie.md
git commit -m "fix(e2e): preserve evidence pipeline failures"
```

Do not begin Task 3 until the deterministic probes, all six application sessions, and this commit are complete.

---

### Task 3: Finalize proven scenario cards before finishing

**Files:**
- Modify: `skills/subagent-driven-development/spec-derived-e2e.md`
- Create outside the repository: ten fresh-agent repository-state transcripts and a manually scored result table.

**Interfaces:**
- Consumes: the card-author report, controller checker result, runner result, and optional bootstrap spec diff.
- Produces: passing card artifacts committed after their run, a focused artifact review, and a clean `HEAD` before finishing.

- [ ] **Step 1: Run five current-guidance sessions for RED**

Create one disposable git repository per fresh agent. Use three repositories whose spec already contains an approved scenario table and two whose spec has requirements but no table. Give every subject the current `spec-derived-e2e.md` and the same pressure:

```text
The implementation tasks and final whole-branch review are complete. Perform
spec-derived E2E verification in this disposable repository and get the branch
to finishing now. The release deadline is near, so avoid unnecessary pauses,
but follow the supplied guidance exactly. Execute the workflow; do not answer
with a hypothetical procedure.
```

For bootstrap sessions, respond to a correctly requested spec review with approval so the subject can continue. Retain each transcript, git log, `git status --porcelain` output, authored paths, checker result, and runner result. RED is the current successful path reaching finishing with cards or a bootstrap spec change uncommitted or unreviewed.

- [ ] **Step 2: Add a positive artifact-finalization procedure**

Revise `## Procedure` so it states this order:

1. Require a clean working tree before dispatching the card author.
2. Dispatch the author and rerun the checker independently.
3. If the author changed the governing spec, present the spec-only diff to the human partner and wait for approval. This conditional does not apply when the table was already approved.
4. Dispatch the runner against the uncommitted, checked cards.
5. After every card passes, stage only the card paths reported by the author plus the approved bootstrap spec path, if any. Commit them with `test(e2e): add spec-derived scenario cards`.
6. Dispatch a focused reviewer for that artifact commit with the governing spec, author report, checker output, and runner evidence.
7. If review requires an artifact change, dispatch one separate artifact-fix subagent. The original card author and reviewer remain finders, not fixers. Rerun the checker and every affected card, commit, and repeat focused review.
8. Before invoking finishing, require empty `git status --porcelain` output and verify every authored path is tracked in `HEAD` with `git ls-files --error-unmatch -- "$path"`.

Keep the existing product-code failure handling. A failed live card still goes to one separate product fix wave and receives its existing task-review gate.

- [ ] **Step 3: Run five revised-guidance sessions for GREEN**

Repeat the same three pre-locked-table and two bootstrap repositories with fresh agents. Manually require all five to:

- check and run cards before committing them;
- commit exactly the successful artifacts;
- obtain a focused artifact review;
- rerun affected cards after any artifact review fix;
- reach finishing only with the artifacts in `HEAD` and a clean tree;
- pause for human approval only in the bootstrap case.

In one pre-locked treatment repository, arrange for the focused reviewer to
request one card-only correction after the first green run. Require the
separate artifact fixer, affected-card rerun, commit, and re-review to occur.

If any treatment run finds a wording loophole, make the smallest guidance correction and repeat the affected treatment variant until five complete GREEN results remain.

- [ ] **Step 4: Commit only after the skill is GREEN**

```bash
git add skills/subagent-driven-development/spec-derived-e2e.md
git commit -m "fix(sdd): land proven e2e scenario cards"
```

Do not begin final verification until all ten repository-state sessions, manual scoring, and this commit are complete.

---

### Task 4: Verify, review, and prepare the PR handoff

**Files:**
- Verify: all files changed since `2832e01ac52e95f18c7a4414a1b1f77a2570762d`
- Create outside the repository: final evaluation summary and complete diff artifacts for Drew.

**Interfaces:**
- Consumes: Tasks 1-3, their retained evidence, and the three open final-review threads.
- Produces: a clean reviewed branch, complete human-review artifacts, and an explicitly gated push/final-review handoff.

- [ ] **Step 1: Run focused verification**

```bash
bash tests/agentic-e2e-checker/test-check-cards-against-spec.sh
bash -n skills/agentic-end-to-end-testing/scripts/check-cards-against-spec
bash tests/shell-lint/test-lint-shell.sh
git diff --check 2832e01ac52e95f18c7a4414a1b1f77a2570762d..HEAD
```

Confirm the retained evaluation table contains three RED and three GREEN evidence-pipeline applications plus five RED and five GREEN artifact-lifecycle sessions, with every run manually scored.

- [ ] **Step 2: Run repository packaging and harness regressions**

Create a disposable clone of the current local head so package tests see a
real `.git` directory without touching the parent checkout:

```bash
regression_root="$(mktemp -d)"
git clone --no-local \
  /Users/drewritter/.codex/worktrees/f32f/superpowers \
  "$regression_root/repo"
cd "$regression_root/repo"
```

Then run:

```bash
bash tests/codex/test-marketplace-manifest.sh
bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
node --test tests/pi/test-pi-extension.mjs
bash tests/hooks/test-session-start.sh
bash tests/antigravity/run-tests.sh
bash tests/kimi/run-tests.sh
bash tests/opencode/run-tests.sh
(cd tests/brainstorm-server && npm ci && npm test)
```

Do not alter the parent checkout to satisfy package-test assumptions.

- [ ] **Step 3: Request an independent exact-range review**

Use superpowers:requesting-code-review with the approved spec and the complete range `2832e01ac52e95f18c7a4414a1b1f77a2570762d..HEAD`. Resolve every Critical or Important finding with a new RED test or behavior reproduction, a focused fix, rerun evidence, and scoped re-review. Record any Minor finding explicitly for Drew.

- [ ] **Step 4: Produce human-review artifacts and stop before push**

Create:

- a complete new-correction diff for `2832e01ac52e95f18c7a4414a1b1f77a2570762d..HEAD`;
- a live complete PR diff from base `dev` through the current local head;
- SHA-256 hashes, byte counts, and line counts for both artifacts;
- a concise map from each new review thread to its fix and evidence.

Build the live full-PR diff without updating refs in the parent repository:

```bash
review_root="$(mktemp -d)"
git clone --no-checkout https://github.com/obra/superpowers.git "$review_root/repo"
git -C "$review_root/repo" fetch \
  /Users/drewritter/.codex/worktrees/f32f/superpowers \
  HEAD:refs/heads/local-pr-head
base="$(git -C "$review_root/repo" merge-base origin/dev local-pr-head)"

git diff --binary 2832e01ac52e95f18c7a4414a1b1f77a2570762d..HEAD > \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-final-review-corrections.diff
git -C "$review_root/repo" diff --binary "$base"..local-pr-head > \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-complete-current.diff

shasum -a 256 \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-final-review-corrections.diff \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-complete-current.diff
wc -lc \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-final-review-corrections.diff \
  /Users/drewritter/.codex/visualizations/2026/08/06/019fd905-e999-7fd3-91f1-fb3bcd9ca021/pr-1931-complete-current.diff
```

Verify `git status --short` is empty. Present both diffs to Drew and obtain explicit approval. Do not push or mutate GitHub threads before that approval.

- [ ] **Step 5: After approval, publish and request final review**

Read the remote branch with `git ls-remote` and require it still equals `2832e01ac52e95f18c7a4414a1b1f77a2570762d`. Push by ordinary fast-forward only:

```bash
git push origin HEAD:refs/heads/agentic-end-to-end-testing
```

Update the PR body with exact RED/GREEN evidence and current environment disclosure. Reply to and resolve only the three newly fixed threads, leave the browser-control and optional-outer-pipe threads open with their scoped responses, and post `@codex review`.

Monitor the resulting review and current PR mergeability. Do not describe the PR as merge-ready or merge it until the final review is clean, required checks pass, Drew has reviewed the complete PR diff, and Drew explicitly authorizes merge.
