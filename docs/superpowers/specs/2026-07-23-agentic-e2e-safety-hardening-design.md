# Agentic E2E Safety Hardening — Design

Date: 2026-07-23; amended 2026-08-06
Status: approved with Drew (initial design 2026-07-23; final-review
correction 2026-08-06)
Builds on:
- `2026-07-04-agentic-end-to-end-testing-design.md`
- `2026-07-04-spec-derived-scenario-cards-design.md`

## Problem

PR #1931 adds a mechanical gate between a design spec's scenario table and
the scenario cards derived from it. At the PR head (`ff19e90a`), that gate
uses line-oriented shell matching without distinguishing document structure
from examples inside fenced code. Focused reproductions against that exact
head found four false passes:

- a header followed directly by a data row, with no table delimiter row;
- a scenario table that exists only inside a fenced code example;
- a scenario card whose required headings and falsification text exist only
  inside a fenced code example;
- a `Card` value of `../outside`, satisfied by a file outside the supplied
  cards directory.

The existing checker test suite remains green because it does not exercise
those cases.

The CLI/TUI recipe has a separate ownership problem. It recommends killing
any tmux session with the selected name before starting the scenario. A name
collision can therefore terminate a session and process the scenario did not
create. This contradicts the skill's existing rule that cleanup must never
touch pre-existing state.

At the follow-up head (`2832e01a`), final review found three remaining ways
the workflow can produce misleading or incomplete evidence:

- the proof-log recipe enables `pipefail` in a child Bash process but leaves
  the outer `| tee` pipeline in the caller, so a failing real gate can still
  return success; the optional SSH snapshot recipe has the same problem;
- fenced-code filtering records the marker family but not the opening marker
  width, so three markers can incorrectly close a fence opened with four and
  expose example-only tables or card structure;
- spec-derived scenario cards are authored and run after the final
  whole-branch review, but the successful path does not require those durable
  files to be committed or reviewed before finishing.

Direct reproductions show a gate exiting `7` becoming status `0`, a shorter
marker exposing fenced structure, and a successful E2E path reaching
finishing with passing cards still untracked.

The review also identified that direct calls to a web application's internal
JavaScript action can bypass its user-facing event wiring. That finding is
valid, but Drew explicitly deferred the browser behavior change on
2026-07-23. It is not part of this design.

## Goals

- Make the scenario-card checker fail closed for the four reproduced
  structural and path-boundary cases.
- Preserve the checker's current, intentionally narrow input contract rather
  than growing it into a general Markdown parser.
- Ensure the tmux recipe cleans up only a session the scenario successfully
  created.
- Close the final-review gaps in evidence-pipeline status, fence-width
  tracking, and post-run card commit and review.
- Add focused tests and behavior evidence for only the changed contracts.

## Non-goals

- Supporting every valid GitHub Flavored Markdown table form.
- Supporting tables without leading and trailing outer pipes.
- Building or importing a Markdown parser.
- Changing the browser-driving recipe.
- Redesigning subagent-driven development beyond finalizing its E2E
  artifacts, committing cards before their live run passes, or adding a human
  pause when the governing spec already has an approved scenario table.
- Making remote-state snapshots mandatory for runs that do not touch remote
  or shared state.
- Changing brainstorming, the card format, or the card-author role.
- Adding a dependency or broadening the existing plugin runtime.
- Running a broad agentic E2E evaluation campaign.

## Design

### 1. Canonical scenario-table contract

The checker continues to accept one canonical table form:

```markdown
| Card | Covers | Falsification |
| --- | --- | --- |
| example-card | Visible behavior | If the result is absent, the scenario FAILS. |
```

Every table row has leading and trailing outer pipes. The existing semantics
remain unchanged:

- the heading text case-insensitively equals `E2E scenario cards`;
- columns are identified by header name rather than position;
- escaped `\|` inside a cell becomes a literal pipe;
- whitespace is normalized before fixed-string falsification matching;
- matching remains case-sensitive after normalization.

A pipe-less table remains unsupported. The no-table diagnostic will state
that the checker expects the canonical outer-pipe form so rejection is an
explicit contract rather than accidental behavior.

### 2. Bounded fenced-code filtering

Before locating a scenario table or validating a card's structure, the
checker filters out fenced-code contents. This is a small line-state filter,
not a Markdown parser:

- a line beginning with an optional indent followed by at least three
  backticks or at least three tildes opens a fence, and the filter records
  both that marker family and its opening run length;
- only the corresponding marker family with a run at least as long as the
  opener closes it;
- a shorter run from the same family, or any run from the other family,
  remains fenced content;
- fence marker lines and everything between them are excluded from
  structural matching;
- an unclosed fence excludes the remainder of the file.

The same filter feeds both structural consumers:

1. spec table discovery and extraction;
2. card validation for `**What this covers**`, required headings, and the
   text of the `Expected` section.

This keeps headings and tables in examples from satisfying the gate while
allowing legitimate fenced examples to remain in specs and cards.

No other Markdown constructs are interpreted. In particular, the checker
does not attempt to model block quotes, lists, inline code, HTML, or arbitrary
table rendering.

### 3. Delimiter-row validation

Once the checker finds a canonical header row, the following collected table
row must be a delimiter row:

- every non-edge cell matches an optional leading colon, at least three
  hyphens, and an optional trailing colon;
- the delimiter row has the same number of cells as the header row.

Data-row processing begins only after that delimiter has passed. A header
followed directly by data is a malformed table and exits with a check failure;
the first data row is never silently treated as valid.

This validation belongs in the existing table-extraction/checking path. It
does not introduce a second parser or a separate intermediate format.

### 4. Card-name boundary

The `Card` cell is a filename stem, not a path. Retain the existing tolerance
for one pair of Markdown backticks only when they wrap the entire normalized
cell value. After removing that pair, the value must match:

```text
^[a-z0-9]+(-[a-z0-9]+)*$
```

The checker validates this grammar before joining the value with
`<cards-dir>`. An invalid value produces a row-specific failure and is never
used in a filesystem lookup. This rules out parent traversal, absolute paths,
subdirectories, whitespace, shell metacharacters, and empty path segments
without needing realpath resolution.

### 5. tmux session ownership

The CLI/TUI recipe replaces deterministic shared names and preemptive
deletion with explicit per-run ownership:

1. Derive a readable session name from the scenario plus a run-unique suffix.
2. Attempt `tmux new-session` with that name.
3. Record ownership only after creation succeeds.
4. Register cleanup that kills the session only when ownership was recorded.
5. Use the same unique stem for the stderr log.

There is no "kill any leftover session" step. If creation reports a collision,
the runner chooses another unique name or reports the failure; it never
reclassifies the existing session as stale state.

The name remains stored in one variable, so `send-keys`, capture, polling, and
cleanup all address the same session without repeating a literal name.

### 6. Evidence pipeline failure propagation

Both the proof-log and optional SSH snapshot recipes place their complete
producer-and-`tee` pipeline inside one `bash -o pipefail -c` invocation. Live
output and the saved log remain available, while a failed real gate, SSH
capture, or `tee` write makes the recipe return nonzero. The proof log still
records the gate's `EXIT_STATUS`, and snapshot comparison starts only after
both captures succeed. No reusable wrapper or dependency is added.

### 7. Proven scenario artifacts

Scenario cards remain test inputs and follow the normal test-first sequence:

1. Enter the spec-derived E2E phase with a clean working tree.
2. The card author writes the cards without committing them.
3. The controller independently runs the mechanical checker.
4. The runner executes the cards against the built branch. Failed runs follow
   the existing fix-and-rerun flow.
5. After every card passes, the controller stages exactly the author-reported
   card paths and commits the unchanged passing artifacts.
6. A focused reviewer examines that artifact commit because it was created
   after the final whole-branch review.
7. Finishing may begin only when the artifact paths are present in `HEAD` and
   the working tree is clean.

If focused review requires a card change, the affected card is no longer the
artifact that passed. Apply the review fix, rerun the affected card, commit
the change, and repeat focused review before finishing.

When the governing spec has no scenario table, the bootstrap path may draft
one alongside the cards. Because that changes the requirements rather than
only adding test inputs, the human partner reviews and approves the proposed
spec diff before it is accepted. After approval, the controller validates and
runs the cards, then includes the approved spec path in the same exact-path
artifact commit. Ordinary card creation from an existing approved table does
not introduce this additional human pause.

The artifact commit is orchestration, not permission for the controller to
rewrite card content. Repository-level complete-diff approval before a push
remains a separate delivery gate.

## E2E scenario cards

| Card | Covers | Falsification |
| --- | --- | --- |
| checker-rejects-malformed-table | A scenario table requires a valid delimiter row | If a scenario-table header without a valid delimiter row exits 0, the scenario FAILS. |
| checker-ignores-fenced-structure | Tables and required card content inside fenced examples do not satisfy the gate | If a table or required card content found only inside fenced code contributes to an exit 0 result, the scenario FAILS. |
| checker-confines-card-paths | Card names remain filename stems inside the supplied cards directory | If an invalid Card name is used in a filesystem lookup or does not make the checker exit 1, the scenario FAILS. |
| checker-reports-canonical-table-contract | Pipe-less tables remain unsupported with an explicit diagnostic | If a pipe-less table exits with a status other than 2 or its diagnostic does not say outer pipes are required, the scenario FAILS. |
| checker-respects-opening-fence-width | Fenced examples remain excluded until a same-family marker run at least as long as the opener | If a shorter same-family run or an other-family run exposes example-only structure, the scenario FAILS. |
| tmux-preserves-preexisting-session | A TUI scenario owns and cleans only the tmux session it creates | If a pre-existing tmux sentinel session is stopped or changed, or the scenario-owned session remains after cleanup, the scenario FAILS. |
| evidence-pipelines-preserve-failures | Proof logging and optional SSH snapshots preserve producer and logging failures | If a failing gate, SSH capture, or `tee` returns success from the documented evidence pipeline, the scenario FAILS. |
| passing-cards-land-before-finishing | Cards are run before commit, then committed and focused-reviewed before finishing | If finishing begins with a passing card untracked, modified, absent from `HEAD`, or unreviewed, the scenario FAILS. |

## Failure and exit behavior

The existing exit classes remain:

- `64`: invalid command usage or missing input path;
- `2`: no supported scenario table was found outside fenced code;
- `1`: a supported table was found but is malformed, a row is invalid, or a
  corresponding card fails validation;
- `0`: every required check passes.

Specific outcomes:

- a fenced-only scenario table exits `2`;
- a pipe-less table exits `2` with the canonical-form hint;
- a missing or malformed delimiter row exits `1`;
- an invalid card name exits `1` before path construction;
- headings or falsification text found only in a card's fenced code do not
  count and therefore exit `1`;
- a shorter same-family marker run does not close a longer fence.

Diagnostics identify the affected file and row or section. Tests assert only
stable diagnostic contracts needed by a caller, not complete rendered error
strings.

## Testing

### Deterministic checker tests

Extend `tests/agentic-e2e-checker/test-check-cards-against-spec.sh` using its
existing temporary-fixture style. Tests exercise the checker as a process and
assert exit behavior:

1. canonical table and cards still pass;
2. missing delimiter row fails;
3. malformed delimiter row fails;
4. fenced example before a real table is ignored and the real table passes;
5. fenced-only table reports no supported table;
6. card structure and falsification text found only inside a fence fail;
7. a valid card containing an unrelated fenced example still passes;
8. `../outside` and another non-kebab-case card value fail before lookup;
9. a backticked valid kebab-case card name retains existing behavior;
10. a pipe-less table remains unsupported and reports the canonical-form
    hint;
11. a four-backtick spec fence containing a three-backtick literal and a fake
    canonical table remains fenced and exits `2` when no real table follows;
12. a four-tilde card fence containing a three-tilde literal and fake required
    structure remains fenced and makes card validation exit `1`;
13. a longer same-family closer ends a fence and allows real structure after
    it to be recognized;
14. a marker run from the other family does not close the active fence.

Run the checker script through `bash -n` explicitly. The repository's shell
lint wrapper currently reports no shell files because the checker has no
`.sh` extension, so that wrapper is not evidence for this file.

### tmux behavior pressure test

The tmux recipe is behavior-shaping skill content, so its change follows the
writing-skills RED/GREEN discipline with one narrowly scoped scenario:

- pre-create a sentinel tmux session whose process and marker must survive;
- ask the subject to run and rerun a TUI scenario with a colliding readable
  base name;
- verify the sentinel remains alive, the scenario uses a distinct session,
  and cleanup removes only the scenario-owned session.

Run three short sessions per arm, but do not expand the campaign beyond
session ownership. Preserve the three current-skill runs as RED evidence and
the three revised-skill runs as GREEN evidence.

No browser eval is part of this work.

### Evidence pipeline application tests

Test the recording reference by having fresh agents apply it to executable
fixtures, not by matching the Markdown source or rendered command text:

- a successful producer returns `0`, streams output, and writes the same log;
- a producer exiting `7` makes the complete recipe return nonzero while its
  output still reaches the log;
- a directory supplied as the log target makes `tee` fail and the recipe
  return nonzero;
- a fake `ssh` executable exiting `255` makes optional snapshot capture fail;
- a successful fake SSH capture produces comparable pre/post files.

Run three current-reference sessions as RED evidence and three
revised-reference sessions as GREEN evidence, manually inspecting every
result. The executable fixture assertions establish status behavior; agent
application establishes that the reference teaches the intended command
shape.

### Scenario-artifact behavior evaluation

The spec-derived E2E procedure shapes agent behavior and therefore requires
adversarial before/after evaluation. Use fresh contexts with the same pressure:
the final whole-branch review has already passed, live cards are green, and a
deadline encourages the subject to finish immediately.

Run at least five current-guidance sessions and five revised-guidance sessions.
Across each arm, include both an existing approved scenario table and the
bootstrap case that proposes a new spec table. Manually inspect every run for
these behavioral outcomes:

- cards are validated and run before commit;
- only the reported artifact paths are staged;
- passing artifacts receive a dedicated commit and focused review;
- finishing is blocked until the cards are in `HEAD` and the tree is clean;
- review changes trigger an affected-card rerun;
- bootstrap spec changes pause for human approval, while ordinary card
  authoring does not.

Do not use source-text matching as the verdict. The subject must actually
exercise the repository state transitions and review boundary.

## Verification

Before declaring the implementation complete:

- run the full checker harness;
- run `bash -n` on the extensionless checker;
- run the focused tmux RED/GREEN pressure test and retain its results;
- run the evidence-pipeline executable probes and three-session RED/GREEN
  application eval;
- run the scenario-artifact behavior eval with at least five sessions per arm;
- run `bash tests/codex/test-package-codex-plugin.sh` to confirm the modified
  skill files remain packaged;
- run `git diff --check`;
- map each in-scope review thread to a code or evidence change.

The browser-control and optional-outer-pipe threads remain explicitly
unresolved by this implementation. They must not be described as fixed.

## Delivery

Design and implementation work happens only in this worktree on
`codex/review-comments-on-pr-1931`. The final-review correction starts from
the already-pushed PR head `2832e01a`; the parent checkout is not modified.

Before another push or GitHub thread mutation, Drew reviews the complete new
diff. The five earlier in-scope findings remain resolved:

- missing delimiter row;
- fenced scenario table;
- fenced card structure;
- card-name path escape;
- tmux session ownership.

After their fixes and evidence are pushed, only the three new final-review
findings may additionally be resolved as addressed:

- evidence pipelines masking producer failures;
- shorter marker runs closing longer fences;
- passing scenario artifacts reaching finishing without commit and review.

The browser-control and optional-outer-pipe findings stay open with their
existing explicitly scoped responses.
