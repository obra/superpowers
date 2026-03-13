---
name: verify-spec
description: Validate implemented code against its design specification by running the app, exploring features, fixing issues, and producing e2e tests. Use after executing an implementation plan.
---

# Verify Spec

Validate that implemented code delivers what the spec describes by running the app, exploring every feature through browser/API/CLI, fixing anything broken, and producing e2e tests.

**Core principle:** No feature is confirmed without navigator evidence. No exceptions.

**Announce at start:** "I'm using the verify-spec skill to validate the implementation against the spec."

## When to Use

- After executing a plan, before finishing the branch
- When you want confidence that the spec is fully delivered
- When you want e2e tests generated from the spec

## When NOT to Use

- No spec exists (nothing to verify against)
- Pure library/package work with no runnable app
- Spec only describes data models or internal architecture with no observable behavior

## Prerequisites

- **Playwright MCP plugin** must be configured for web app verification. If not available, fall back to API/CLI methods only. If the spec describes browser-based features and Playwright is unavailable, notify the user and stop.
- **A runnable app** — the project must have a start command detectable from project files.
- **A spec file** — must exist in `docs/superpowers/specs/`.

## Subagents

| Agent | Model | Prompt Template | Purpose |
|-------|-------|-----------------|---------|
| **Server Runner** | haiku | `server-runner-prompt.md` | Auto-detect & start app, report status |
| **Scenario Generator** | opus | `scenario-generator-prompt.md` | Extract verifiable scenarios from spec |
| **Navigator** | sonnet | `navigator-prompt.md` | Execute scenarios via browser/API/CLI |
| **Planner** | opus | `planner-prompt.md` | Analyze failures, plan minimal fixes |
| **Coder** | sonnet | `coder-prompt.md` | Implement fixes from planner's plan |
| **Test Writer** | sonnet | `test-writer-prompt.md` | Write e2e tests for confirmed scenarios |

All agents use `subagent_type: "general-purpose"` to ensure access to all tools (including MCP tools like Playwright for the Navigator).

**Agent result parsing:** Agents report in structured text format. Claude Code reads the agent's output and extracts the relevant fields — no JSON parsing required.

## The Process

You MUST follow these phases in order.

### Phase 0: Load Spec & Detect Environment

1. Accept spec file path as argument, or auto-detect the most recent spec in `docs/superpowers/specs/`
2. Read the spec file content
3. Detect test framework:
   a. Read `package.json`, check `devDependencies` for: `@playwright/test`, `jest`, `vitest`, `mocha`, `supertest`, `pytest`
   b. Check for config files: `playwright.config.*`, `jest.config.*`, `vitest.config.*`, `pytest.ini`, `setup.cfg`
   c. Set `test_framework` variable to the first match found
   d. Defaults if nothing found: Playwright for web, supertest for API, shell scripts for CLI

### Phase 1: Setup (Iteration 0)

Dispatch **Server Runner** and **Scenario Generator** in parallel:

```
Agent tool:
  Server Runner:
    subagent_type: "general-purpose"
    model: "haiku"
    run_in_background: true
    prompt: [use server-runner-prompt.md template, inject {project_directory}]

  Scenario Generator:
    subagent_type: "general-purpose"
    model: "opus"
    run_in_background: true
    prompt: [use scenario-generator-prompt.md template, inject {spec_content}, {test_framework}]
```

Collect results via TaskOutput.

**If server fails to start:**
- Dispatch Planner (opus) with the server error
- Dispatch Coder (sonnet) with the planner's fix
- Restart server
- Max 3 attempts — if still failing, notify user and stop

**After both succeed:**
- Store server URL from server runner's port report
- Store server task_id for clean shutdown
- Create a task per scenario using TaskCreate (status: pending)

### Phase 2: Verify-Fix Loop

```
iteration = 1
max_iterations = 10

while iteration <= max_iterations:
    # 1. Get unchecked scenarios
    pending = [tasks from TaskList where status == "pending"]
    if not pending: break  # all confirmed

    # 2. Navigate
    Dispatch Navigator (sonnet) with pending scenarios + server URL
    - subagent_type: "general-purpose", model: "sonnet"
    - Use navigator-prompt.md template
    - Inject {server_url}, {project_type}, {scenarios}
    # If more than 10 scenarios are pending, dispatch only the first 10
    # to keep the navigator focused. Remaining scenarios carry to the
    # next iteration.

    # 3. Parse results
    for each scenario result:
        if PASS:
            TaskUpdate → status: completed
            Dispatch Test Writer (sonnet) in background
            - mode: "individual"
            - Use test-writer-prompt.md template
        if FAIL:
            TaskUpdate → add failure evidence to metadata

    # Unreported scenarios (navigator didn't cover) remain pending
    # They will be re-dispatched to a fresh navigator next iteration

    # 4. Check if done
    remaining_fails = [tasks with failure metadata and not completed]
    remaining_pending = [tasks from TaskList where status == "pending"]
    if not remaining_fails and not remaining_pending: break

    # 5. Collect server logs
    Read recent server output using TaskOutput on the stored server task_id
    (use block: false to get current output without waiting).
    Pass any errors/warnings to the planner below.

    # 6. Plan fixes
    Dispatch Planner (opus) with:
    - Failed scenarios + evidence
    - Server errors (read from server task output)
    - Relevant spec sections
    - Use planner-prompt.md template

    # 7. Implement fixes
    Read relevant files mentioned in fix plan
    Dispatch Coder (sonnet) with:
    - Fix plan from planner
    - File contents (pasted inline)
    - Use coder-prompt.md template

    if coder reports BLOCKED:
        Re-dispatch Coder with model: "opus"
        if still BLOCKED:
            Surface to user, go to Phase 3

    # 8. Restart server (default: always restart)
    # Exception: planner explicitly marked "no restart needed"
    if fix_plan.restart_needed:
        Stop server (TaskStop on task_id)
        Re-dispatch Server Runner (haiku)
        Store new task_id

    # 9. Reset failed scenarios to pending for re-verification
    for each failed scenario:
        TaskUpdate → status: pending, clear failure metadata

    iteration += 1

if iteration > max_iterations:
    Surface remaining issues to user
```

### Phase 3: Finalization

0. **Collect Test Writer results**
   - Collect all background Test Writer results from Phase 2
   - Log any failures
   - Provide the list of successfully created test files to the consolidation pass

1. **Test Writer consolidation pass**
   - Dispatch Test Writer (sonnet) with mode: "consolidation"
   - Provide all individual test files written so far
   - Wait for completion, verify all tests pass

2. **Print verification report**

```
## Spec Verification Report

**Spec:** {spec_path}
**Iterations:** {iteration_count}
**Status:** All features verified | Partial (N/M confirmed) | Blocked

### Feature Checklist
- [x] Feature A — description (confirmed iteration 1)
- [x] Feature B — description (confirmed iteration 3, required fix)
- [ ] Feature C — description (BLOCKED: reason)

### Fixes Applied
1. file.ts:42 — description of change (resolved features B, D)

### E2E Tests Generated
- tests/e2e/feature-a.spec.ts (N scenarios)

### Unresolved Issues (if any)
- Feature C: reason surfaced for human decision
```

3. **Commit e2e tests**
   - `git add` all generated test files
   - `git commit -m "test: add e2e tests from verify-spec"`
   - Only commit if all tests pass

4. **Stop the server**
   - Use TaskStop on the stored task_id
   - Fallback: `lsof -i :{port} -t | xargs kill` if task_id unavailable

## Guard Rails

### Iron Law

**NO FEATURE MARKED AS CONFIRMED WITHOUT NAVIGATOR EVIDENCE**

### Rules

- Never mark a scenario as pass based on coder's claim — navigator must re-verify
- Never let coder make changes beyond the planner's fix plan
- Never skip the consolidation pass
- Never leave the server running after the skill completes
- Never proceed past iteration 10 — surface remaining issues
- If server fails to start 3 times, stop and surface to user
- If coder reports BLOCKED, try once with opus, then surface to user

### Rationalization Prevention

| Thought | Reality |
|---------|---------|
| "It's probably working, the fix looks right" | Navigator must verify. No exceptions. |
| "This feature is too complex to test via browser" | Adapt verification method. Browser, API, CLI — pick one. |
| "The e2e tests are overkill for this feature" | Every confirmed feature gets a test. That's the deliverable. |
| "Let me fix this adjacent thing while I'm here" | Minimal fixes only. Stay on the planner's fix plan. |
| "The server logs look clean, skip navigation" | Clean logs ≠ working features. Navigate every scenario. |
| "10 iterations isn't enough" | If 10 rounds can't fix it, a human needs to look. Surface it. |

### Escalation to User

- Coder BLOCKED after opus retry
- Server won't start after 3 attempts
- Iteration cap (10) reached with unresolved features
- Spec is ambiguous — scenario generator can't determine expected behavior
