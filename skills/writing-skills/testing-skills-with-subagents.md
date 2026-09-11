# Testing Skills With Bounded Agents

**Load this reference when:** creating or editing a skill and delegated
behavior testing has been explicitly approved.

## Overview

Skill testing applies RED-GREEN-REFACTOR to process documentation. Delegation
is optional: deterministic static tests and direct parent evaluation remain
valid when they prove the required behavior. When delegated testing is useful,
use an approved bounded test topology rather than fresh-agent swarms.

**Core principle:** Define the scenario and success criteria first, then test
within a finite approved topology.

**REQUIRED BACKGROUND:** Understand `superpowers:test-driven-development`.

## Approval Gate

Before any delegated skill test, disclose one bounded test topology:

| Field | Required detail |
| --- | --- |
| Test milestone | Exact skill behavior and scenarios under test |
| Test executor | Exact agent/role, model and provider, reasoning effort, context tier |
| Evaluator | Optional persistent independent read-only evaluator/reviewer with the same runtime fields |
| Scope | Exact skill, fixtures, prompts, and safe artifact paths |
| Validation | RED and GREEN evidence and pass/fail criteria |
| Bounds | Finite activation budget and at most three total evaluation/review passes |
| Stop boundary | Stop after this test milestone |

Wait for explicit approval. A general request to edit or test a skill is not
approval to create children. If the harness cannot explicitly apply an approved
runtime field or preserve persistent child identity, run the test directly or
stop for revised approval. Never inherit or auto-route a model/provider.

## Bounded Test Topology

- Reuse one persistent test executor for baseline scenarios, post-edit
  scenarios, revisions, and blocker resolution.
- Only when independently useful, reuse one persistent independent read-only
  evaluator/reviewer. The evaluator must not mutate repository or worktree
  state.
- At most one delegated child is active at a time.
- The same test executor performs revisions; never create a fresh fixer.
- The same evaluator performs at most three total evaluation/review passes for
  the test milestone.
- Passes 2 and 3 occur only for unresolved Critical/Important findings or an
  explicit test failure. Stop after pass 3.
- Children must not delegate, create agents or sessions, run factories, or
  start background agents.
- Every child activation or resume counts, including initialization, scenario execution,
  BLOCKED, status, or no-op turns, blocker-resolution turns,
  retries, revisions or fixes, evaluation or review, and any optional summary activation.
- Stop for reapproval before exhaustion of the activation budget.

Store verbose transcripts and evaluation artifacts outside the repository in a
safe session artifact path unless the approved test explicitly requires a
tracked fixture.

## RED-GREEN-REFACTOR

### RED: Define and run the baseline

1. Write concrete pressure scenarios before editing the skill.
2. Define observable pass/fail criteria.
3. Run the scenario without the proposed guidance, using direct execution or
   the approved persistent test executor.
4. Capture the exact failure or rationalization.

If the baseline does not fail, there is no demonstrated behavior gap. Stop
rather than authoring speculative guidance.

### GREEN: Make the smallest effective change

1. Edit only the guidance needed to address the observed failure.
2. Re-run the same scenario with the same executor when delegation is active.
3. Confirm the observed failure is gone without expanding the skill's scope.

### REFACTOR: Close demonstrated loopholes

Use the same executor for revisions. If an evaluator was approved, activate the
same read-only evaluator for pass 1. Passes 2 and 3 are allowed only when an
explicit test still fails or Critical/Important findings remain.

After pass 3, stop and report unresolved findings. Do not create another
evaluator, a Rubber Duck, a review swarm, or an automatic final reviewer.

## Scenario Design

Good discipline scenarios combine at least three pressures:

- time or deadline pressure;
- sunk cost;
- authority or social pressure;
- economic consequence;
- fatigue;
- a plausible "pragmatic" shortcut.

Use concrete choices, real paths, and observable actions. For technique,
pattern, and reference skills, use application, variation, retrieval, and
missing-information cases as appropriate.

## Direct and Static Alternatives

Prefer deterministic parent-owned checks when the behavior is mechanically
observable:

- frontmatter and required-section contracts;
- forbidden phrase and topology scans;
- script fixture tests;
- schema or output-shape validation;
- direct self-review against a checklist.

Static checks do not prove model behavior beyond their assertions. Report that
limit precisely and do not claim pressure-test coverage from text matching.

## Reporting Contract

For each test milestone record:

- approved topology and runtime;
- activation budget used and remaining;
- RED scenario and observed failure;
- GREEN change and result;
- evaluator pass count and unresolved Critical/Important findings;
- exact validation commands;
- stop boundary reached.

## Red Flags

- Creating a fresh agent per scenario or iteration
- Running executor and evaluator concurrently
- Letting a read-only evaluator edit repository or worktree state
- Using implicit, inherited, automatic, or "most capable" model routing
- Starting pass 2 or 3 without an explicit failure or unresolved
  Critical/Important finding
- Starting pass 4
- Treating initialization, blockers, retries, or fixes as free
- Continuing after the approved test milestone

## Common Rationalizations

| Excuse | Reality |
| --- | --- |
| "Fresh context makes every sample cleaner." | It also creates an unbounded swarm; reuse the approved executor. |
| "One more evaluation pass may find something." | Three is the hard cap; unresolved issues are reported after pass 3. |
| "The evaluator only changed a small typo." | Read-only means no repository or worktree mutation. |
| "The provider default is good enough." | Runtime choices require exact disclosure and approval. |
| "A failed turn did not accomplish anything." | Every activation still counts against the finite budget. |
