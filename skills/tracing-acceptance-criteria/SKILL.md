---
name: tracing-acceptance-criteria
description: Use when acceptance criteria already exist and need to be traced to code — giving each criterion a stable ID, tagging the tests that prove it with @ac markers, or checking which criteria are covered, orphaned, or duplicated. For authoring the criteria themselves, that is a separate concern; this skill starts once they exist and runs through verification.
---

# Tracing acceptance criteria

## Overview

Give every acceptance criterion a stable ID, keep it in the spec, and link it to
the test that proves it with a one-line `@ac` marker. A criterion counts as covered
only when a test demonstrates it — which is exactly the test-first stance this
library already takes.

This is the *traceability* half of acceptance criteria: it assumes the criteria are
already written (however you got there) and gives them IDs, markers, and a coverage
check. Three stages — **Define IDs**, **Link**, **Check** — layered onto the
existing flow. Nothing to install: the check is a couple of `rg` commands you run
and reason about.

## When to use

- After `superpowers:brainstorming` writes the design doc and before
  `superpowers:writing-plans`, to attach testable, ID'd criteria to the spec.
- During `superpowers:test-driven-development`, to tag each proving test as you
  write it.
- At `superpowers:verification-before-completion`, to report which criteria are
  proven, which aren't, and which markers are stray.

Not for UI-polish checklists — criteria capture **functional behavior + critical
constraints**: how the system _should_ behave.

## Conventions

- **Storage: the spec.** Add an `## Acceptance Criteria` section to the design doc
  `superpowers:brainstorming` saved under
  `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`. The spec is the source of
  truth and is committed with the work.
- **ID scheme:** `COMPONENT-N`, e.g. `AUTH-1`, scoped to one spec. `COMPONENT` is a
  single uppercase token (`[A-Z]+`) — no digits, underscores, or hyphens inside it,
  since the scan regex below captures exactly that shape. The same ID in two specs
  is a collision — the Check step flags it.
- **Marker:** `@ac <ID>` as a prefix in a normal comment, any language:
  `// @ac AUTH-1`, `# @ac AUTH-1`. The `@ac` prefix keeps the scan targeted so a
  bare ID mentioned elsewhere won't match — but it's a text scan, not a parser, so
  confirm each hit is a real comment and not an ID quoted in a string or doc.
- **The marker's canonical home is the TEST that proves the criterion.** This
  library is test-first, so a criterion counts as covered only when a test
  demonstrates it. A marker on production code is allowed but never sufficient on
  its own.

## 1. Define IDs

Record the criteria in the spec as a markdown table, each with a stable ID:

```markdown
## Acceptance Criteria

| ID     | Criterion                                  |
| ------ | ------------------------------------------ |
| AUTH-1 | Reject requests with no bearer token (401) |
| AUTH-2 | Verify bearer token signature              |
| AUTH-3 | Scope queries to the token's tenant        |
```

Group related criteria under one `COMPONENT`. Keep each criterion behavioral and
independently testable.

## 2. Link

During TDD, the failing test that proves a criterion carries its marker:

```ts
// @ac AUTH-1
it('rejects requests with no bearer token', () => {
  expect(handler(noAuthRequest).status).toBe(401);
});
```

```python
# @ac AUTH-2
def test_verifies_bearer_signature():
    assert verify_bearer_token(signed) is True
```

When writing the plan, list the AC IDs each task satisfies so the mapping is
explicit before code exists. One test may carry several markers; one criterion may
be proven by several tests.

## 3. Check (ad hoc — no tooling)

Run this at verification time and reason about the output.

1. **Covered IDs** — grep only the test files, since coverage means "a test proves
   it". Widen the globs to your project's test conventions:

   ```bash
   rg -o '@ac\s+([A-Z]+-\d+)' -r '$1' --no-filename \
     -g '*.test.*' -g '*.spec.*' -g '*_test.*' -g 'test_*.*' | sort -u
   ```

   To locate every marker tree-wide (for reporting orphans — a stray marker in
   production code is still an orphan), use:

   ```bash
   rg -n '@ac\s+[A-Z]+-\d+'
   ```

2. **Defined IDs** — read the `## Acceptance Criteria` table(s) from the relevant
   spec(s) under `docs/superpowers/specs/`.

3. **Diff and report** (report-only — no build gate):
   - **Uncovered** — a defined ID absent from the covered-IDs (test-file) scan. A
     production-code marker alone does not make an ID covered.
   - **Orphan** — an `@ac` marker whose ID appears in no spec.
   - **Duplicate** — the same ID defined in more than one spec.

   Example:

   ```
   auth-redesign: 3 ACs
     AUTH-1  covered (2 refs)
     AUTH-2  covered (1 ref)
     AUTH-3  UNCOVERED
   orphan: @ac AUTH-9 (auth.test.ts:42) — no matching AC
   coverage 2/3 (67%)
   ```

## Where this fits in the flow

| Stage                                                                 | This skill                                    |
| --------------------------------------------------------------------- | --------------------------------------------- |
| after `superpowers:brainstorming`, before `superpowers:writing-plans` | **Define IDs** for the AC table in the spec   |
| `superpowers:writing-plans` / TDD implementation                      | **Link** proving tests with `@ac <ID>`        |
| `superpowers:verification-before-completion`                          | **Check** with `rg` + spec cross-reference    |

It adds to the flow; it does not replace any skill.
