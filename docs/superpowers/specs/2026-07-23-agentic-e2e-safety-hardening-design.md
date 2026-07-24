# Agentic E2E Safety Hardening — Design

Date: 2026-07-23
Status: approved (design review with Drew, 2026-07-23)
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
- Add focused tests and behavior evidence for only the changed contracts.

## Non-goals

- Supporting every valid GitHub Flavored Markdown table form.
- Supporting tables without leading and trailing outer pipes.
- Building or importing a Markdown parser.
- Changing the browser-driving recipe.
- Changing brainstorming, subagent-driven-development, card authoring, or
  the card format.
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
  backticks or at least three tildes opens a fence;
- the corresponding marker family closes it;
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

The `Card` cell is a filename stem, not a path. After retaining the existing
tolerance for one pair of Markdown backticks, its value must match:

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
  count and therefore exit `1`.

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
    hint.

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

Run multiple short sessions per arm, but do not expand the campaign beyond
session ownership. Preserve the current-skill runs as RED evidence and the
revised-skill runs as GREEN evidence.

No browser eval is part of this work.

## Verification

Before declaring the implementation complete:

- run the full checker harness;
- run `bash -n` on the extensionless checker;
- run the focused tmux RED/GREEN pressure test and retain its results;
- run the relevant Codex/plugin packaging test to confirm the modified skill
  files remain packaged;
- run `git diff --check`;
- map each in-scope review thread to a code or evidence change.

The browser-control and optional-outer-pipe threads remain explicitly
unresolved by this implementation. They must not be described as fixed.

## Delivery

Design and implementation work happens on
`codex/review-comments-on-pr-1931`, based exactly on PR #1931 head
`ff19e90a`. The existing `agentic-end-to-end-testing` branch and its separate
worktree are not rewritten during design or implementation.

Before any push or GitHub thread mutation, Drew reviews the complete diff.
Only the five in-scope findings may be resolved as addressed:

- missing delimiter row;
- fenced scenario table;
- fenced card structure;
- card-name path escape;
- tmux session ownership.

The browser-control and optional-outer-pipe findings stay open or receive an
explicitly scoped response after Drew approves the final wording.
