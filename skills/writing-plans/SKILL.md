---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `ace:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## ACE Paradigm Plans

If this is an ACE-related project, the plan MUST follow the selected paradigm's workflow:

| Paradigm | Skill | Plan Structure | Key Requirements |
|----------|-------|----------------|------------------|
| **P1** - Core Loop | `ace-run-workflow` | 6 phases: Clarify → Design → Plan → Execute → Verify → Evolution | CLI execution, ace-hub sharing |
| **P2** - Device Onboarding | `ace-device-onboarding` | 6 phases: Clarify → Design → Plan → Execute → Verify → Evolution | TDD mandatory, 2-layer validation, PDF parsing |
| **P3** - ACE Development | `ace-development` | 7 phases: Clarify → Design → Plan → Execute → Verify → Evolution → Complete | Superpowers chain: TDD → executing-plans → verification |

### Paradigm-Specific Plan Headers

**P1 - Core Loop Plans:**
```markdown
# [Workflow/Feature] Implementation Plan

> **ACE Paradigm:** P1 (Core Loop - Run Workflow)
> **Workflow:** Clarify → Design → Plan → Execute → Verify → Evolution

**Goal:** [Build/run workflow for device X]

**Key Principles:**
- Use `ace run workflow <id>` for reproducibility
- TDD for node building (RED → GREEN → REFACTOR)
- ace-hub push for sharing

**Device:** [device-id]
**Workflow Type:** [build new / run existing / modify]
```

**P2 - Device Onboarding Plans:**
```markdown
# [Device] Onboarding Plan

> **ACE Paradigm:** P2 (Device Onboarding)
> **Workflow:** Clarify → Design → Plan → Execute → Verify → Evolution

**Goal:** Onboard [device name] with simulator and nodes

**Key Principles:**
- TDD IRON LAW: NO CODE WITHOUT FAILING TEST FIRST
- 2-layer validation: Node tests + End-to-end workflow
- PDF manual parsing → Knowledge ingestion

**Device Type:** [type]
**Onboarding Approach:** [Full Sim / HITL / Hybrid]
```

**P3 - ACE Development Plans:**
```markdown
# [Feature] ACE Framework Development Plan

> **ACE Paradigm:** P3 (ACE Development)
> **Workflow:** Clarify → Design → Plan → Execute → Verify → Evolution → Complete

**Goal:** [Improve ACE framework: specific component]

**Key Principles:**
- Superpowers chain: TDD → executing-plans → verification
- RED-GREEN-REFACTOR for all changes
- ace evolve for pattern extraction

**Framework Area:** [core/evolution/workflow/skills]
```

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

**ACE-Specific Paths:**
- P1/P2: `~/.ace/store/workflows/`, `~/.ace/store/nodes/`, `~/.ace/store/devices/`
- P3: `src/core/`, `src/playground/`
- All: ace-hub sharing via `ace hub push`

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

**ACE Paradigm Task Naming:**
- P1: "Phase X: [Action]" (e.g., "Phase 4: Execute workflow via CLI")
- P2: Include TDD cycle markers (RED/GREEN/REFACTOR)
- P3: Include superpowers skill invocation markers

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ace:subagent-driven-development (recommended) or ace:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

**For ACE projects, add paradigm block after the header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ace:subagent-driven-development (recommended) or ace:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

## ACE Paradigm

**Paradigm:** P1 (Core Loop) / P2 (Device Onboarding) / P3 (ACE Development)

**Phase Overview:**
1. Clarify - [brief description]
2. Design - [brief description]
3. Plan - [brief description]
4. Execute - [brief description]
5. Verify - [brief description]
6. Evolution - [brief description]
7. Complete (P3 only) - [brief description]

**Key Constraints:**
- [paradigm-specific requirements, e.g., "TDD mandatory for all nodes", "CLI execution only", etc.]
```

## Task Structure

### Standard Task (Non-ACE)

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

### P1 - Core Loop Task Example

````markdown
### Phase 4: Execute - Run Workflow

**Task:** Execute workflow via CLI for reproducibility

- [ ] **Step 1: Verify prerequisites**

Run: `ace device status <device-id>`
Expected: Device connected and ready

- [ ] **Step 2: Execute workflow via CLI**

Run: `ace run workflow <workflow-id> [--params '<json>']`
Expected: Execution ID returned, traces captured

- [ ] **Step 3: Check execution status**

Run: `ace workflow status <execution-id>`
Expected: Status: completed

- [ ] **Step 4: Verify output files**

Run: `ls ~/.ace/store/run/workflow/<workflow-id>/<execution-id>/`
Expected: Output files present

- [ ] **Step 5: Commit execution memory**

```bash
git add ~/.ace/store/workflows/<workflow-id>/memory/
git commit -m "chore: add execution memory for <workflow-id>"
```
````

### P2 - Device Onboarding Task Example (with TDD)

````markdown
### Phase 4: Execute - Build Device Nodes (TDD)

**Task:** Build node: `<node-id>` - connect to device

**TDD Cycle:**

- [ ] **RED: Step 1 - Write failing test**

Create: `~/.ace/store/nodes/<device-id>/<node-id>_test.py`

```python
def test_node_connect():
    """Test connect node executes successfully."""
    from ace.nodes import NodeExecutor
    executor = NodeExecutor()
    result = executor.run('<node-id>', {})
    assert result.success is True
    assert result.operation == 'connect'
```

- [ ] **RED: Step 2 - Verify test fails**

Run: `ace sandbox test <node-id>_test.py`
Expected: FAIL - "Node <node-id> not found"

- [ ] **GREEN: Step 3 - Build minimal node**

Run: `ace node build --device <device-id> --description "connect to device"`
Expected: Node created at `~/.ace/store/nodes/<device-id>/<node-id>/`

- [ ] **GREEN: Step 4 - Verify test passes**

Run: `ace sandbox test <node-id>_test.py`
Expected: PASS

- [ ] **REFACTOR: Step 5 - Validate node structure**

Run: `ace node validate <node-id>`
Expected: Validation passed

- [ ] **Step 6 - Commit**

```bash
git add ~/.ace/store/nodes/<device-id>/<node-id>/
git commit -m "feat(<device>): add connect node"
```
````

### P3 - ACE Development Task Example (with Superpowers)

````markdown
### Phase 4: Execute - Implement Feature with TDD

**Task:** Implement `<feature>` in ACE core

**Pre-requisite:** Invoke `ace:test-driven-development` skill

- [ ] **Step 1: Invoke TDD skill (RED phase)**

Skill: `ace:test-driven-development`
Prompt: "Write failing test for <feature> in src/core/<module>.py"

- [ ] **Step 2: Verify test fails**

Run: `pytest tests/core/test_<module>.py::test_<feature> -v`
Expected: FAIL with expected error

- [ ] **Step 3: Write minimal implementation**

Modify: `src/core/<module>.py:XX-XX`

```python
def <feature>():
    """<description>."""
    # Minimal implementation to pass test
    return <expected_result>
```

- [ ] **Step 4: Verify test passes (GREEN)**

Run: `pytest tests/core/test_<module>.py::test_<feature> -v`
Expected: PASS

- [ ] **Step 5: Refactor while green**

Review code for:
- Duplication
- Unclear names
- Missing edge cases

Run tests after each change: `pytest tests/core/test_<module>.py -v`

- [ ] **Step 6: Commit**

```bash
git add tests/core/test_<module>.py src/core/<module>.py
git commit -m "feat(core): add <feature>"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task
- **ACE-specific placeholders to avoid:**
  - "Set up device" (without specific CLI commands)
  - "Build node" (without TDD steps)
  - "Run workflow" (without `ace run workflow` command)
  - "Parse manual" (without pdf-to-markdown skill invocation)

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- **ACE-specific:** Follow paradigm workflow, use CLI commands, ace-hub integration

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Paradigm alignment (if ACE):**
- Does the plan follow the selected paradigm's phase structure?
- Are TDD steps included where required (P2, P3)?
- Are CLI commands specified for P1/P2?
- Is ace-hub sharing included at the end?

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use ace:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use ace:executing-plans
- Batch execution with checkpoints for review

**For ACE P3 projects:**
- Execution MUST use superpowers chain
- Invoke `ace:test-driven-development` before implementation
- Invoke `ace:verification-before-completion` after execution
- Invoke `ace:finishing-a-development-branch` at completion
