# Verify-Spec Skill Design

## Purpose

verify-spec is a complementary skill that validates implemented code against its design specification. It sits after plan execution in the development pipeline:

```
brainstorming → spec → plan → refine plan → execute plan → verify-spec → finish branch
```

Its job: prove that the implemented code actually delivers what the spec describes, by running the app, exploring every feature through a browser/API/CLI, fixing anything broken, and producing e2e tests as a deliverable.

verify-spec is NOT a gate — the user chooses to invoke it. The existing skills (TDD, verification-before-completion) remain mandatory during implementation. verify-spec is the optional full-system validation pass.

**When to use:**
- After executing a plan, before finishing the branch
- When you want confidence that the spec is fully delivered
- When you want e2e tests generated from the spec

**When NOT to use:**
- No spec exists (nothing to verify against)
- Pure library/package work with no runnable app
- Spec only describes data models or internal architecture with no observable behavior

**Invocation:** The user invokes this skill via `/verify-spec` or by asking Claude Code to verify a spec. Claude Code loads `skills/verify-spec/SKILL.md` and follows it.

## Prerequisites

- **Playwright MCP plugin** must be configured for web app verification. If not available, the skill falls back to API/CLI verification methods only. If the spec describes browser-based features and Playwright is unavailable, the skill notifies the user and stops.
- **A runnable app** — the project must have a start command detectable from project files.
- **A spec file** — the spec must exist in `docs/superpowers/specs/`.

## Files Produced

| File | Purpose |
|------|---------|
| `skills/verify-spec/SKILL.md` | The orchestration skill — Claude Code follows this |
| `skills/verify-spec/server-runner-prompt.md` | Prompt template for the server runner agent |
| `skills/verify-spec/scenario-generator-prompt.md` | Prompt template for the scenario generator agent |
| `skills/verify-spec/navigator-prompt.md` | Prompt template for the navigator agent |
| `skills/verify-spec/planner-prompt.md` | Prompt template for the planner agent |
| `skills/verify-spec/coder-prompt.md` | Prompt template for the coder agent |
| `skills/verify-spec/test-writer-prompt.md` | Prompt template for the test writer agent |

No existing files are modified.

## The 5 Subagents

Each iteration dispatches up to 5 specialized agents. Claude Code orchestrates them.

| Agent | Model | Purpose | Output |
|-------|-------|---------|--------|
| **Server Runner** | haiku | Auto-detect how to start the app, run it, watch logs, report errors | Startup status + any log errors/warnings |
| **Scenario Generator** | opus | Read the spec, extract every verifiable feature, produce a checklist of scenarios to explore | Ordered scenario checklist with expected behaviors |
| **Navigator** | sonnet | Open browser/API/CLI, execute each scenario from the checklist, report what works and what doesn't | Per-scenario pass/fail with evidence (snapshots, responses, error messages) |
| **Planner** | opus | Analyze navigator failures + server errors, identify root causes, plan minimal fixes | Fix plan: what to change, where, and why |
| **Coder** | sonnet | Implement the planner's fixes — minimal changes only, no refactoring, no scope creep | Changed files + status (DONE/BLOCKED) |

Additionally, a **Test Writer** (sonnet) is dispatched incrementally as features are confirmed, and again at the end for a consolidation pass.

**Adaptation by project type:**
- **Web app** — Navigator uses Playwright MCP tools (browser_navigate, browser_snapshot, browser_click, browser_fill, etc.)
- **API** — Navigator uses curl/HTTP requests, inspects responses
- **CLI** — Navigator runs commands, inspects stdout/stderr

The scenario generator detects project type from the spec and tells the navigator how to verify.

## Model Assignment

| Agent | Model | Why |
|-------|-------|-----|
| **Server Runner** | **haiku** | Mechanical task — detect start command, run it, read logs. No judgment needed. |
| **Scenario Generator** | **opus** | Requires deep reading comprehension of the spec and creative scenario design. Highest reasoning for accurate extraction. |
| **Navigator** | **sonnet** | Needs to operate browser/API/CLI tools competently and report accurately. Good balance of capability and speed. |
| **Planner** | **opus** | Root cause analysis across multiple failure signals requires strong reasoning. Must produce precise, minimal fix plans. |
| **Coder** | **sonnet** | Implements well-defined fixes from the planner. Capable enough for code changes, fast enough for iteration. |
| **Test Writer** | **sonnet** | Writes e2e tests from confirmed scenarios. Needs code generation capability but working from clear inputs. |

**Cost profile per iteration:** 1 haiku + 1 opus (planner) + 2 sonnet (navigator + coder) + N sonnet (test writers for passing features). Scenario generator (opus) runs only once in iteration 0.

**Model override:** The skill specifies these as defaults. If the coder reports BLOCKED, Claude Code can re-dispatch with opus for more reasoning power before surfacing to the user.

## The Main Loop

### Iteration 0 (Setup)

1. **[parallel]** Server Runner + Scenario Generator
   - Server runner auto-detects start command (checks package.json scripts, Makefile, Cargo.toml, manage.py, docker-compose, etc.), launches app, reports status + log errors
   - Scenario generator reads spec, produces feature checklist with expected behaviors, detects project type
2. If server fails to start → Planner + Coder fix → restart server → retry (max 3 attempts)

### Iteration N (Verify-Fix Cycle)

1. Navigator executes unchecked scenarios
   - Reports per-scenario: PASS / FAIL + evidence
2. For each PASS → dispatch Test Writer (sonnet)
   - Writes e2e test for that scenario immediately
3. Any FAILs?
   - NO → all scenarios confirmed → exit loop
   - YES → continue
4. Planner analyzes failures + server logs (opus)
   - Identifies root causes
   - Produces minimal fix plan
5. Coder implements fixes (sonnet)
   - Minimal changes only
   - Reports DONE or BLOCKED
   - If BLOCKED → surface to user, exit loop
6. Server Runner restarts app if needed
7. Update checklist, increment iteration → back to step 1

**Iteration cap:** Max 10 iterations. If unresolved issues remain, surface them to the user with the current state of the checklist and fixes attempted.

### Finalization

1. **Test Writer consolidation pass** (sonnet)
   - Review all individual e2e tests
   - Ensure coherent test suite
   - Add cross-feature interaction tests
   - Verify all tests pass
2. **Produce verification report**
   - Feature checklist with final status
   - Iterations taken
   - Fixes applied
   - E2E test file locations
3. **Stop the server** — clean shutdown, no orphaned processes

### Checklist Tracking

Claude Code maintains the feature checklist using the TaskCreate/TaskUpdate tools. Each scenario from the scenario generator becomes a task. Task status maps to:
- `pending` — not yet tested
- `in_progress` — navigator is currently testing
- `completed` — navigator confirmed, test written
- Tasks with `blocked` metadata — coder couldn't fix, surfaced to user

Using the task system ensures checklist state persists across long iteration loops without relying on context window memory.

## Subagent Prompt Design

Each agent gets a precisely crafted inline prompt. No agent reads files — Claude Code pastes everything they need.

**Server Runner prompt receives:**
- Project directory path
- Instruction to auto-detect start command (check package.json scripts, Makefile, Cargo.toml, manage.py, docker-compose, etc.)
- Instruction to run the app and watch stdout/stderr for 10-15 seconds
- Instruction to detect port from: (1) stdout output matching common patterns like "listening on port XXXX", (2) framework defaults (e.g., Vite=5173, Next.js=3000, Django=8000), (3) project config files (e.g., vite.config.ts, next.config.js)
- Report format: `{ status: "running" | "failed", command: "...", port: N, port_source: "stdout" | "config" | "framework_default", errors: [...], warnings: [...] }`

**Scenario Generator prompt receives:**
- Full spec text (pasted inline)
- Instruction to extract every verifiable feature into scenarios
- Instruction to detect project type (web app / API / CLI) from spec content
- Report format: ordered list of scenarios, each with: `{ id, feature, steps, expected_behavior, verification_method: "browser" | "api" | "cli" }`

**Navigator prompt receives:**
- The scenario checklist (or remaining unchecked scenarios)
- Server URL/port
- Project type and verification method
- Instruction to use Playwright MCP tools for browser, curl for API, Bash for CLI
- Report format: per-scenario `{ id, status: "pass" | "fail", evidence: "...", error_details: "..." }`

**Planner prompt receives:**
- Failed scenarios with navigator evidence
- Server runner log errors
- The relevant spec sections for context
- Instruction to identify root causes and plan minimal fixes
- Report format: `{ fixes: [{ file, change_description, reason, related_scenarios: [...] }] }`

**Coder prompt receives:**
- The planner's fix plan
- Relevant file contents (pasted inline by Claude Code)
- Instruction: minimal changes only, no refactoring, no scope creep
- Report format: `{ status: "DONE" | "BLOCKED", files_changed: [...], block_reason?: "..." }`

**Test Writer prompt receives:**
- Confirmed scenario(s) with navigator evidence of passing
- Project type and test framework to use (determined by the scenario generator based on project type detection: Playwright for web, supertest for API, shell scripts for CLI — but if the project already has an existing test framework detected in devDependencies or test config files, use that instead)
- Existing test files (if any, for consistency)
- Instruction to write e2e tests matching the detected framework
- For consolidation pass: all individual tests + instruction to ensure coherence and add cross-feature tests
- Test writers for individual features dispatch in parallel (independent scenarios, no shared state)

## Orchestration (SKILL.md Behavior)

The SKILL.md file is what Claude Code follows when the user invokes verify-spec. It is the orchestrator. Here is what it does step by step:

### Step 1: Load Spec
- Accept spec file path as argument, or auto-detect the most recent spec in `docs/superpowers/specs/`
- Read the spec file content into context

### Step 2: Setup (Iteration 0)
- Dispatch Server Runner (haiku, `run_in_background: true`) and Scenario Generator (opus) in parallel
- Server Runner: auto-detect start command, launch app, report status with port
- Scenario Generator: read spec text (pasted inline), produce scenario checklist
- If server fails: dispatch Planner (opus) to analyze error + Coder (sonnet) to fix → restart (max 3 attempts)
- Create a task per scenario using TaskCreate (status: pending)
- Store server URL (from server runner's port report) for navigator

### Step 3: Verify-Fix Loop
- Check TaskList for pending scenarios
- Dispatch Navigator (sonnet) with unchecked scenarios + server URL
- Parse navigator results:
  - For each PASS: update task to completed, dispatch Test Writer (sonnet) in parallel
  - For each FAIL: update task metadata with failure evidence
- If all tasks completed → go to Step 4
- If FAILs exist:
  - Collect failure evidence from tasks
  - Dispatch Planner (opus) with failures + server logs
  - Dispatch Coder (sonnet) with planner's fix plan + relevant file contents
  - If coder BLOCKED → re-dispatch with opus → if still BLOCKED → surface to user, go to Step 4
  - Restart server if coder changed server-side code
  - Increment iteration counter → repeat Step 3
- If iteration counter > 10 → surface remaining issues, go to Step 4

### Step 4: Finalization
- Dispatch Test Writer (sonnet) consolidation pass with all individual test files
- Print verification report to terminal
- Stop the server (kill the background process)
- Announce completion

### Agent Result Parsing
Claude Code reads each agent's text output and extracts structured data. Agents report in the formats specified in the prompt design section. Claude Code does not require JSON parsing — it reads the agent's natural language output and extracts the relevant fields.

## Output & Deliverables

When verify-spec completes, it produces:

### 1. Verification Report (printed to terminal)

```
## Spec Verification Report

**Spec:** docs/superpowers/specs/<spec-file>.md
**Iterations:** N
**Status:** All features verified | Partial (N/M confirmed) | Blocked

### Feature Checklist
- [x] Feature A — description (confirmed iteration 1)
- [x] Feature B — description (confirmed iteration 3, required fix)
- [ ] Feature C — description (BLOCKED: reason)

### Fixes Applied
1. file.ts:42 — description of change (resolved features B, D)
2. api/route.ts:15 — description of change (resolved feature E)

### E2E Tests Generated
- tests/e2e/feature-a.spec.ts (3 scenarios)
- tests/e2e/feature-b.spec.ts (2 scenarios)
- tests/e2e/cross-feature.spec.ts (4 scenarios)

### Unresolved Issues (if any)
- Feature C: root cause identified but fix requires [reason]. Surfaced for human decision.
```

### 2. E2E Test Suite (committed to the project)

- Individual test files per feature
- Cross-feature interaction tests from consolidation pass
- All tests verified passing before commit
- Test framework matches project type (Playwright for web, supertest for API, shell scripts for CLI)

### 3. Server Shutdown

Clean shutdown, no orphaned processes.

## Guard Rails

### Iron Law

```
NO FEATURE MARKED AS CONFIRMED WITHOUT NAVIGATOR EVIDENCE
```

### Rules

- Never mark a scenario as `pass` based on coder's claim — navigator must re-verify after fixes
- Never let coder make changes beyond the planner's fix plan
- Never skip the consolidation pass — individual tests may overlap or conflict
- Never leave the server running after the skill completes
- Never proceed past iteration 10 — surface remaining issues to user
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
