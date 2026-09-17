# SDD Metrics Complexity Cuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove verified internal complexity from the SDD lifecycle-metrics implementation without weakening its evidence contract, filesystem safety boundary, diagnostics, or runtime compatibility.

**Architecture:** Keep the version-1 event vocabulary and reduced model unchanged. Simplify three internal seams independently: compare duplicate event bytes directly and stop returning accepted events, make `PAYLOAD_CONTRACTS` the only payload shape/enum authority, and replace the local-ignore lock protocol with an idempotent append-and-verify script that tolerates harmless duplicate rules under concurrent startup.

**Tech Stack:** Dependency-free Node.js ESM, `node:test`, Bash, Git.

**Spec:** `docs/superpowers/specs/2026-08-18-sdd-lifecycle-metrics-design.md`

## Global Constraints

- Preserve all 27 version-1 event types, including `task_test_result`; task-scoped test evidence is part of the approved semantic record even though it is not summed into headline metrics.
- Preserve `PAYLOAD_CONTRACTS` exactly so the machine-checked authoring reference remains authoritative.
- Preserve diagnostic codes and their ordering for every existing schema and reducer fixture.
- Preserve PASS/BLOCKED/INCOMPLETE reduction, event identity/fingerprint checks, sequence handling, report rendering, retention, and filesystem threat boundaries.
- Do not adopt `node:util.parseArgs` or declare a new Node version floor in this change. `util.parseArgs` first appeared in Node v18.3.0 and v16.17.0, while this package currently declares no engine requirement.
- Add no dependency, configuration option, compatibility layer, or new public API.
- Before every eligible shell command, pass that exact command string to `rtk rewrite`; execute its returned rewrite, and use the original only when no rewrite is returned.
- Keep work local. Do not push, open a PR, or commit unless the human partner explicitly authorizes commits after reviewing the complete diff.

## Reviewed Scope

| Proposed cut | Decision | Reason |
| --- | --- | --- |
| Contract-driven payload validation | Implement | Removes duplicated shape/enum checks and mutable module state while preserving the exported contract. |
| Byte-exact retry comparison | Implement | Matches the authoring contract, which permits only byte-identical retries. |
| Remove reduced `events` output | Implement | No production caller consumes it; state and diagnostics already prove rejection behavior. |
| Simplify local-ignore setup | Implement | Sequential idempotence and verification matter; globally unique entries under concurrent startup do not. Git accepts duplicate equivalent ignore rules. |
| Delete `task_test_result` | Reject | The approved spec explicitly retains task-scoped test evidence without adding it to headline totals. |
| Replace CLI parsing with `node:util.parseArgs` | Defer | It silently raises the runtime floor without an approved Node compatibility policy. |

---

### Task 1: Make duplicate retry handling byte-exact and remove test-only event output

**Files:**

- Modify: `tests/metrics/reducer-stream.test.mjs:21`
- Modify: `tests/metrics/reducer-stream.test.mjs:49`
- Modify: `tests/metrics/reducer-stream.test.mjs:147`
- Modify: `tests/metrics/reducer-stream.test.mjs:272`
- Modify: `lib/metrics/reducer.mjs:10`
- Modify: `lib/metrics/reducer.mjs:415`

**Interfaces:**

- Consumes: physical `{ lineNumber, text }` JSONL records supplied to `reduceRun(metadata, eventLines)`.
- Produces: the existing reduction state, tasks, findings, interventions, latest fingerprint, and diagnostics; the undocumented `events` array is removed.

- [ ] **Step 1: Add the failing non-byte-identical retry test**

Add this test immediately after the existing byte-identical retry test:

```js
test('rejects a non-byte-identical retry of the same event id', () => {
  const event = makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' });
  const original = JSON.stringify(event);
  const reordered = JSON.stringify(Object.fromEntries(Object.entries(event).reverse()));
  const reduced = reduceRun(makeRun(), numberLines([original, reordered]));

  assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), ['EVENT_ID_CONFLICT']);
});
```

- [ ] **Step 2: Run the targeted reducer test and verify RED**

Run: `node --test tests/metrics/reducer-stream.test.mjs`

Expected: FAIL because `canonicalJson` treats reordered object keys as identical and emits no `EVENT_ID_CONFLICT`.

- [ ] **Step 3: Replace canonical object comparison with physical-line comparison**

In `lib/metrics/reducer.mjs`:

1. Delete `canonicalJson`.
2. Rename `eventJsonById` to `eventTextById`.
3. Replace `const serialized = canonicalJson(parsed);` with `const eventText = line.text;`.
4. Compare and store `eventText` in the event-ID map.
5. Keep the existing early `continue` behavior for an identical retry and a conflicting retry.

The resulting duplicate block must have this shape:

```js
const eventId = parsed?.event_id;
const sequence = parsed?.sequence;
const eventText = line.text;
if (typeof eventId === 'string' && context.eventTextById.has(eventId)) {
  if (context.eventTextById.get(eventId) !== eventText) {
    context.diagnostics.push(diagnostic('EVENT_ID_CONFLICT', 'Event id has conflicting content', line.lineNumber, sequence));
  }
  continue;
}
```

- [ ] **Step 4: Remove the accepted-events echo from the reduction result**

Delete all four production references to `context.events`:

```js
events: [],
events: context.events,
context.events.push(event);
events: context.events,
```

Update the four test assertions that inspect `reduced.events.length`:

- byte-identical retry: retain `assert.deepEqual(reduced.diagnostics, [])`; this fails if the duplicate is applied because it produces `RUN_STARTED_DUPLICATE`;
- schema/identity gap test: the exact diagnostic list already proves only the valid prefix was applied;
- per-field identity test: retain the exact diagnostic list and `task.dispatched === false` mutation assertion;
- invalid metadata test: retain the exact diagnostic list and unchanged lifecycle state assertions.

Do not replace these with a new event counter or another test-only return field.

- [ ] **Step 5: Run reducer tests and verify GREEN**

Run: `node --test tests/metrics/reducer-stream.test.mjs tests/metrics/reducer-tasks.test.mjs tests/metrics/model.test.mjs`

Expected: PASS with zero failures.

- [ ] **Step 6: Review the task diff**

Run: `git diff -- lib/metrics/reducer.mjs tests/metrics/reducer-stream.test.mjs`

Confirm that event types, transition reducers, diagnostics, and reduced model fields other than `events` are unchanged.

- [ ] **Step 7: Commit only after explicit authorization**

After the human partner reviews the complete task diff and authorizes a commit:

```bash
git add lib/metrics/reducer.mjs tests/metrics/reducer-stream.test.mjs
git commit -m "refactor(metrics): simplify retry reduction"
```

---

### Task 2: Make payload contracts the single shape and enum authority

**Files:**

- Modify: `tests/metrics/schema.test.mjs:30`
- Modify: `lib/metrics/schema-v1.mjs:44`
- Modify: `lib/metrics/schema-v1.mjs:104`

**Interfaces:**

- Consumes: the unchanged `PAYLOAD_CONTRACTS[event_type]` object plus event-specific scalar/array validation helpers.
- Produces: the unchanged `validateEvent(input, lineNumber)` return shape and exact diagnostics.

- [ ] **Step 1: Add a compound diagnostic-order characterization test**

Add this test after `rejects payload fields outside each event contract`:

```js
test('keeps contract diagnostics before event-specific field diagnostics', () => {
  const payload = {
    task_id: 'bad-task',
    result: 'NOPE',
    evidence_kind: 'COUNTS',
    unrelated_field: true,
  };
  const result = validateEvent(makeEvent(1, 'task_test_result', payload), 1);

  assert.deepEqual(result.diagnostics.map(diagnostic => diagnostic.code), [
    'PAYLOAD_UNKNOWN_FIELD',
    'RESULT_INVALID',
    'PAYLOAD_TASK_ID_INVALID',
    'PAYLOAD_COUNTS_REQUIRED',
  ]);
});
```

- [ ] **Step 2: Run the schema characterization suite**

Run: `node --test tests/metrics/schema.test.mjs`

Expected: PASS. This is a behavior-preserving refactor, so the new test establishes the baseline rather than introducing new product behavior.

- [ ] **Step 3: Remove mutable contract-suppression state**

Delete:

```js
let activePayloadContract = null;
```

Remove these guards from `exactKeys` and `enumField`:

```js
if (prefix === 'PAYLOAD' && activePayloadContract) return;
if (activePayloadContract) return;
```

Keep `validatePayloadContract` responsible for exactly these operations:

1. payload object validation;
2. allowed/required field validation from `PAYLOAD_CONTRACTS`;
3. non-nested enum validation from `PAYLOAD_CONTRACTS`.

- [ ] **Step 4: Reduce event-specific validators to non-contract checks**

For every `validate*Payload` function:

- remove its repeated `payloadObject` call;
- remove its repeated `exactKeys` call;
- remove every `enumField` call because enums are already checked by `validatePayloadContract`;
- retain pattern, string, integer, boolean, array, count-pair, evidence-count, and nested finding-result checks;
- delete `validateRunStartedPayload` because `run_started` needs no checks beyond its contract.

Keep `PAYLOAD_VALIDATORS` only for event types with remaining field-specific checks. In `validateEvent`, guard contract lookup with `Object.prototype.hasOwnProperty.call(PAYLOAD_CONTRACTS, input.event_type)` so events such as `run_started` still receive contract validation after their custom validator is deleted. Replace the current payload block with:

```js
if (Object.prototype.hasOwnProperty.call(PAYLOAD_CONTRACTS, input.event_type)) {
  const validatedContract = validatePayloadContract(
    input.event_type,
    input.payload,
    lineNumber,
    input.sequence,
    diagnostics,
  );
  if (validatedContract) {
    PAYLOAD_VALIDATORS[input.event_type]?.(input.payload, lineNumber, input.sequence, diagnostics);
  }
}
```

Do not add a generic schema DSL, class hierarchy, factory, or dependency. The exported contract plus the existing primitive validation helpers are sufficient.

- [ ] **Step 5: Run schema and instruction-contract tests**

Run: `node --test tests/metrics/schema.test.mjs`

Expected: PASS with the same diagnostic codes and ordering.

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: PASS because `PAYLOAD_CONTRACTS`, the event catalog, and the machine-checked authoring matrix are unchanged.

- [ ] **Step 6: Run all reducer/model tests**

Run: `node --test tests/metrics/reducer-stream.test.mjs tests/metrics/reducer-tasks.test.mjs tests/metrics/model.test.mjs`

Expected: PASS with zero failures.

- [ ] **Step 7: Review the task diff**

Run: `git diff -- lib/metrics/schema-v1.mjs tests/metrics/schema.test.mjs`

Confirm that `PAYLOAD_CONTRACTS` is byte-for-byte unchanged and no validation helper or event-specific non-enum field check was lost.

- [ ] **Step 8: Commit only after explicit authorization**

After the human partner reviews the complete task diff and authorizes a commit:

```bash
git add lib/metrics/schema-v1.mjs tests/metrics/schema.test.mjs
git commit -m "refactor(metrics): deduplicate payload validation"
```

---

### Task 3: Replace ignore locking with append-and-verify

**Files:**

- Modify: `skills/subagent-driven-development/scripts/ensure-metrics-ignore:1`
- Modify: `tests/claude-code/test-sdd-metrics-ignore.sh:38`
- Modify: `tests/claude-code/test-sdd-metrics-ignore.sh:141`

**Interfaces:**

- Consumes: a Git worktree reachable from the current directory and its repository-local `info/exclude` path.
- Produces: a valid ignore rule covering `/.superpowers/metrics/`, no tracked-file changes, and a nonzero exit with a visible error when setup or verification fails.

- [ ] **Step 1: Relax only the unnecessary concurrency guarantee**

In `tests/claude-code/test-sdd-metrics-ignore.sh`:

1. Delete `run_setup_quickly`.
2. Keep the 20-process concurrent smoke test and require every invocation to succeed.
3. Change its final assertion from exactly one matching rule to at least one matching rule:

```bash
line_count="$(grep -Fxc '/.superpowers/metrics/' "$ignore" || true)"
if git -C "$repo" check-ignore -q -- .superpowers/metrics/.ignore-probe && ((line_count >= 1)); then
  pass "concurrent setup leaves a valid metrics ignore"
else
  fail "concurrent setup leaves a valid metrics ignore"
fi
```

4. Delete the stale-lock fixture and assertions because the implementation will no longer create locks.
5. Retain new-repository, broad-ignore, repeated sequential invocation, missing-newline, nested-directory, linked-worktree, and failure-continuation coverage unchanged.

- [ ] **Step 2: Run the adjusted test against the current implementation**

Run: `bash tests/claude-code/test-sdd-metrics-ignore.sh`

Expected: PASS. This task removes an implementation guarantee; the adjusted suite first records the smaller required behavior.

- [ ] **Step 3: Replace the script with the minimal verified implementation**

Replace `skills/subagent-driven-development/scripts/ensure-metrics-ignore` with:

```bash
#!/usr/bin/env bash
# Ensure repository-local metrics data is ignored without changing tracked files.
set -u

probe='.superpowers/metrics/.ignore-probe'

if ! repo_root=$(git rev-parse --show-toplevel); then
  echo 'SDD metrics: cannot resolve repository root.' >&2
  exit 1
fi

if ! cd "$repo_root"; then
  echo "SDD metrics: cannot enter repository root: $repo_root" >&2
  exit 1
fi

if git check-ignore -q -- "$probe"; then
  exit 0
fi

if ! exclude_path=$(git rev-parse --git-path info/exclude); then
  echo 'SDD metrics: cannot resolve local Git exclude path.' >&2
  exit 1
fi

if ! mkdir -p "$(dirname "$exclude_path")"; then
  echo "SDD metrics: cannot create local Git exclude directory: $exclude_path" >&2
  exit 1
fi

# Concurrent setup can append duplicate equivalent rules; Git treats them identically.
if ! printf '\n/.superpowers/metrics/\n' >> "$exclude_path"; then
  echo "SDD metrics: cannot update local Git exclude file: $exclude_path" >&2
  exit 1
fi

if git check-ignore -q -- "$probe"; then
  exit 0
fi

echo "SDD metrics: local ignore did not cover $probe" >&2
exit 1
```

Do not add a replacement lock, retry loop, PID file, timestamp, random quarantine name, or exact-global-count assertion.

- [ ] **Step 4: Run ignore and static instruction tests**

Run: `bash tests/claude-code/test-sdd-metrics-ignore.sh`

Expected: PASS, including the 20-process smoke test.

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: PASS; the skill reference and event contract are unchanged.

- [ ] **Step 5: Run shell lint**

Run: `bash scripts/lint-shell.sh`

Expected: PASS with zero lint failures.

- [ ] **Step 6: Review the task diff**

Run: `git diff -- skills/subagent-driven-development/scripts/ensure-metrics-ignore tests/claude-code/test-sdd-metrics-ignore.sh`

Confirm that tracked `.gitignore` files are untouched and every failure path remains visible to the controller.

- [ ] **Step 7: Commit only after explicit authorization**

After the human partner reviews the complete task diff and authorizes a commit:

```bash
git add skills/subagent-driven-development/scripts/ensure-metrics-ignore tests/claude-code/test-sdd-metrics-ignore.sh
git commit -m "refactor(metrics): simplify local ignore setup"
```

---

### Task 4: Complete branch verification and human diff gate

**Files:**

- Verify: all files changed by Tasks 1-3
- Verify: package and plugin synchronization outputs

**Interfaces:**

- Consumes: the three independently reviewed refactors.
- Produces: fresh deterministic evidence and a complete diff for human approval; no push or PR.

- [ ] **Step 1: Confirm a Node runtime is available**

Run: `node --version`

Expected: exit 0. The current WSL shell may not provide Node, so execute Node gates in a configured native WSL session or another already-available compatible runtime; do not claim Node verification from shell-only tests.

- [ ] **Step 2: Run the complete deterministic suite**

Run each command independently:

```bash
node --test tests/metrics/*.test.mjs
bash tests/claude-code/test-sdd-workspace.sh
bash tests/claude-code/test-sdd-metrics-ignore.sh
bash tests/claude-code/test-sdd-metrics-instructions.sh
TZ=UTC bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
bash scripts/lint-shell.sh
```

Expected: every command exits 0. Report counts exactly as printed; do not infer PASS from missing or truncated output.

- [ ] **Step 3: Run whitespace verification**

Run: `git diff --check`

Expected: exit 0 with no output.

- [ ] **Step 4: Inspect the complete branch delta introduced by this plan**

Run: `git diff --stat`

Run: `git diff`

Confirm all of the following:

- total production and test lines decrease;
- `task_test_result`, `PAYLOAD_CONTRACTS`, and all 27 event types remain;
- no `node:util` import or `engines` field was added;
- no report/retention filesystem safety code changed;
- no skill prose changed;
- only the implementation/test files named in Tasks 1-3 and this plan document changed.

- [ ] **Step 5: Present the complete diff to the human partner**

Report the exact verification results and show the complete diff. Stop for explicit approval before any final commit, push, PR, or integration action.
