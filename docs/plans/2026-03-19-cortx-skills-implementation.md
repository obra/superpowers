# cortx-skills — Implementation Plan

> **For agentic workers:** REQUIRED: Use cortx:subagent-driven-development (if available) or cortx:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork superpowers into cortx-skills — a deeply cortx-integrated skill set with a new autonomous orchestration mode.

**Architecture:** Two workstreams: (1) Add missing MCP tool wrappers to cortx repo (Rust, TDD), (2) Adapt all skills + create auto mode in cortx-skills repo (markdown). Workstream 1 is a prerequisite for full functionality but skills can be written first.

**Tech Stack:** Rust (tokio, rmcp, anyhow) for MCP additions. Markdown for all skills. Bash for hooks.

**Spec:** `docs/specs/2026-03-19-cortx-skills-design.md`

---

## Scope Note

Two repos involved:
- **cortx** (`/Users/tiene/Projets/cortx/`) — Rust code, MCP tool additions (Chunk 1)
- **cortx-skills** (`/Users/tiene/Projets/cortx-skills/`) — Markdown skills, hooks, agents (Chunks 2-8)

These are independent and can be worked in parallel. Chunk 1 is needed for runtime but not for writing the skills.

---

## File Structure

### cortx repo — New/Modified Files (Chunk 1)

| File | Action | Responsibility |
|------|--------|---------------|
| `crates/cortx/src/mcp.rs` | Modify | Add 4 new tool definitions + 2 tool handler implementations |
| `crates/cortx/src/orchestrator.rs` | Modify | Add `list_tasks()` public method |
| `crates/kanwise/src/lib.rs` | Modify | Expose `list_tasks_for_board()` if not already public |
| `crates/cortx/tests/mcp_tools_test.rs` | Create | Integration tests for new MCP tools |

### cortx-skills repo — New/Modified Files (Chunks 2-8)

| File | Action | Responsibility |
|------|--------|---------------|
| `.claude-plugin/plugin.json` | Modify | Rename to cortx-skills, update metadata |
| `package.json` | Modify | Rename, align version |
| `hooks/hooks.json` | Modify | Update paths |
| `hooks/session-start` | Rewrite | cortx MCP check + memory injection |
| `skills/using-cortx/SKILL.md` | Create (rename from using-superpowers) | Meta-skill with cortx dependency |
| `skills/test-driven-development/SKILL.md` | Modify | Add proxy_exec + memory instructions |
| `skills/systematic-debugging/SKILL.md` | Modify | Add proxy_exec + memory instructions |
| `skills/verification-before-completion/SKILL.md` | Modify | Add proxy_exec instruction |
| `skills/brainstorming/SKILL.md` | Modify | Add memory_recall/store instructions |
| `skills/writing-plans/SKILL.md` | Modify | Add planning_decompose, memory_recall |
| `skills/requesting-code-review/SKILL.md` | Modify | Add memory_recall/store instructions |
| `skills/receiving-code-review/SKILL.md` | Modify | Add memory_store instruction |
| `skills/finishing-a-development-branch/SKILL.md` | Modify | Add session_report, planning_complete_task |
| `skills/executing-plans/SKILL.md` | Rewrite | Full cortx cycle (claim→exec→gate→release) |
| `skills/subagent-driven-development/SKILL.md` | Rewrite | Full cortx orchestration cycle |
| `skills/auto/SKILL.md` | Create | Autonomous orchestrator skill |
| `agents/orchestrator.md` | Create | Auto mode agent prompt |
| `skills/subagent-driven-development/implementer-prompt.md` | Modify | Add proxy_exec constraint |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | Modify | Minor — no cortx changes needed |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | Modify | Minor — update cross-refs |
| `agents/code-reviewer.md` | Modify | Minor — update cross-refs |
| `README.md` | Rewrite | cortx-skills documentation |
| All SKILL.md files | Modify | Rename `superpowers:` → `cortx:` in cross-references |

---

## Chunk 1 — cortx MCP Tool Additions (cortx repo)

> **Working directory:** `/Users/tiene/Projets/cortx/`
> **Branch:** `feat/mcp-tool-additions`

### Task 1: Add `planning_validate_gates` MCP tool

**Files:**
- Modify: `crates/cortx/src/mcp.rs`
- Modify: `crates/cortx/src/orchestrator.rs` (if needed to expose gates)
- Test: `crates/cortx/tests/gates_test.rs` (extend existing)

- [ ] **Step 1: Write failing test**

```rust
// In crates/cortx/tests/gates_test.rs — add:
#[test]
fn test_gates_config_loads() {
    let config = cortx::gates::load_gates_config("policies/cortx-gates.toml");
    assert!(config.is_ok());
}
```

- [ ] **Step 2: Add tool definition to mcp.rs**

Add to `tool_definitions()`:
```rust
tool!("planning_validate_gates", "Run configured quality gates (clippy, test, build).", serde_json::json!({
    "type": "object",
    "properties": {
        "project_root": { "type": "string", "description": "Project root directory" },
        "gates": {
            "type": "array",
            "description": "Gates to run (default: all from cortx-gates.toml)",
            "items": { "type": "string", "enum": ["clippy", "test", "build"] }
        }
    }
}))
```

- [ ] **Step 3: Implement handler in `call_tool` match**

The handler should:
1. Load gates config from `cortx-gates.toml` (or use `gates` param)
2. For each gate, call `proxy_exec` with the appropriate command
3. Return results as JSON: `{ "passed": bool, "results": [{ "gate": "clippy", "passed": true, "output": "..." }] }`

- [ ] **Step 4: Run tests**

Run: `cargo test --workspace`

- [ ] **Step 5: Commit**

```
feat(cortx): add planning_validate_gates MCP tool
```

### Task 2: Add `planning_escalate` MCP tool

**Files:**
- Modify: `crates/cortx/src/mcp.rs`

- [ ] **Step 1: Add tool definition**

```rust
tool!("planning_escalate", "Escalate a blocked task to human with context.", serde_json::json!({
    "type": "object",
    "properties": {
        "task_id": { "type": "string", "description": "Task ID to escalate" },
        "board_id": { "type": "string", "description": "Board ID" },
        "attempts": { "type": "array", "items": { "type": "string" }, "description": "What was tried" },
        "errors": { "type": "array", "items": { "type": "string" }, "description": "Error messages" },
        "suggestion": { "type": "string", "description": "Suggested next step for human" }
    },
    "required": ["task_id", "board_id", "suggestion"]
}))
```

- [ ] **Step 2: Implement handler**

Call `orchestrator.escalate_task()` which already exists. Wire params through.

- [ ] **Step 3: Run tests + commit**

```
feat(cortx): add planning_escalate MCP tool
```

### Task 3: Add `planning_complete_task` MCP tool

**Files:**
- Modify: `crates/cortx/src/mcp.rs`

- [ ] **Step 1: Add tool definition**

```rust
tool!("planning_complete_task", "Mark a task as done on the board.", serde_json::json!({
    "type": "object",
    "properties": {
        "task_id": { "type": "string", "description": "Task ID to complete" }
    },
    "required": ["task_id"]
}))
```

- [ ] **Step 2: Implement handler**

Call `orchestrator.complete_task(task_id)` which already exists and increments counters.

- [ ] **Step 3: Run tests + commit**

```
feat(cortx): add planning_complete_task MCP tool
```

### Task 4: Add `planning_list_tasks` MCP tool

**Files:**
- Modify: `crates/cortx/src/mcp.rs`
- Modify: `crates/kanwise/src/db/repo.rs` (if query doesn't exist)
- Modify: `crates/kanwise/src/lib.rs` (expose method)

- [ ] **Step 1: Add tool definition**

```rust
tool!("planning_list_tasks", "List tasks on a board with status, dependencies, and locks.", serde_json::json!({
    "type": "object",
    "properties": {
        "board_id": { "type": "string", "description": "Board ID" },
        "status": { "type": "string", "enum": ["all", "backlog", "in-progress", "done"], "default": "all" }
    },
    "required": ["board_id"]
}))
```

- [ ] **Step 2: Implement query in kanwise**

Query `tasks` table joined with `task_labels` for status, plus `locked_by`/`locked_at` for claim info. Return JSON array of tasks with their `depends_on` relationships.

- [ ] **Step 3: Implement handler in mcp.rs**

Wire through to kanwise via orchestrator.

- [ ] **Step 4: Run tests + commit**

```
feat(cortx): add planning_list_tasks MCP tool
```

### Task 5: Extend `planning_claim_task` with optional `task_id`

**Files:**
- Modify: `crates/cortx/src/mcp.rs`
- Modify: `crates/kanwise/src/db/repo.rs`
- Modify: `crates/kanwise/src/lib.rs`

- [ ] **Step 1: Add optional `task_id` to tool definition**

```rust
tool!("planning_claim_task", "Atomically claim a task for an agent.", serde_json::json!({
    "type": "object",
    "properties": {
        "board_id": { "type": "string", "description": "Board ID" },
        "agent_id": { "type": "string", "description": "Agent identifier" },
        "task_id": { "type": "string", "description": "Optional: claim a specific task instead of next available" }
    },
    "required": ["board_id", "agent_id"]
}))
```

- [ ] **Step 2: Add `claim_specific_task` to kanwise repo**

Similar to `claim_task` but takes a `task_id` and verifies it's not already locked.

- [ ] **Step 3: Update handler — if `task_id` provided, use specific claim; otherwise next-available**

- [ ] **Step 4: Test + commit**

```
feat(cortx): allow claiming specific task by ID
```

### Task 6: Add `acceptance_criteria` to `planning_decompose`

**Files:**
- Modify: `crates/cortx/src/mcp.rs`
- Modify: `crates/kanwise/src/db/repo.rs` (extend `create_tasks_batch`)

- [ ] **Step 1: Add field to tool schema**

Add `"acceptance_criteria": { "type": "string" }` to the task items in `planning_decompose`.

- [ ] **Step 2: Append acceptance criteria to task description in create_tasks_batch**

Format: append `\n\n## Acceptance Criteria\n{criteria}` to description. Simple, no schema change needed.

- [ ] **Step 3: Test + commit**

```
feat(cortx): add acceptance_criteria to planning_decompose
```

---

## Chunk 2 — Foundation (cortx-skills repo)

> **Working directory:** `/Users/tiene/Projets/cortx-skills/`

### Task 7: Update plugin metadata

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `package.json`

- [ ] **Step 1: Update plugin.json**

```json
{
  "name": "cortx-skills",
  "description": "AI-native development skills for Claude Code, powered by cortx MCP",
  "version": "0.1.0",
  "author": { "name": "tienedev" },
  "keywords": ["cortx", "skills", "tdd", "debugging", "autonomous", "orchestration"]
}
```

- [ ] **Step 2: Update package.json**

Update `name` to `cortx-skills`, `version` to `0.1.0`, `description` accordingly.

- [ ] **Step 3: Commit**

```
chore: rename plugin to cortx-skills
```

### Task 8: Rewrite session-start hook

**Files:**
- Modify: `hooks/session-start`
- Modify: `hooks/hooks.json`

- [ ] **Step 1: Read current `hooks/session-start`** to understand the platform detection and output format.

- [ ] **Step 2: Rewrite the hook**

The hook must:
1. Read the `using-cortx` SKILL.md content (not `using-superpowers`)
2. Check for `cortx: skip memory on start` in CLAUDE.md — if found, skip memory injection
3. The cortx MCP verification (`memory_status`) and memory injection (`memory_recall`) are done by the LLM following the `using-cortx` instructions — the hook cannot call MCP tools directly (it's a bash script). The hook's job is to inject the skill content as `additionalContext`.
4. Output JSON in the correct format for Claude Code / Cursor

Key change: replace `using-superpowers` path with `using-cortx` path. Remove legacy superpowers migration warning.

- [ ] **Step 3: Update hooks.json** — same matcher, just verify paths work

- [ ] **Step 4: Commit**

```
feat: rewrite session-start hook for cortx
```

### Task 9: Create `using-cortx` meta-skill

**Files:**
- Create: `skills/using-cortx/SKILL.md`
- Delete: `skills/using-superpowers/SKILL.md`

- [ ] **Step 1: Read `skills/using-superpowers/SKILL.md`** for reference

- [ ] **Step 2: Create `skills/using-cortx/SKILL.md`**

Based on using-superpowers with these changes:
- All `superpowers:` references → `cortx:`
- Add cortx MCP dependency section at the top:
  ```
  ## cortx MCP Dependency

  cortx-skills requires the cortx MCP server. On session start, verify:
  1. Call `memory_status` — if it fails, inform the user: "cortx MCP not connected."
  2. If connected and `cortx: skip memory on start` is NOT in CLAUDE.md, call `memory_recall`
     with the current working directory to load project context.
  ```
- Update the skill catalog to list all `cortx:*` skills
- Add `cortx:auto` to the skill list with description

- [ ] **Step 3: Delete `skills/using-superpowers/`**

- [ ] **Step 4: Commit**

```
feat: create using-cortx meta-skill, remove using-superpowers
```

---

## Chunk 3 — Global Namespace Migration (cortx-skills repo)

### Task 10: Rename all `superpowers:` references to `cortx:`

**Files:**
- Modify: All SKILL.md files that contain `superpowers:`
- Modify: All agent prompt files

- [ ] **Step 1: Find all occurrences**

```bash
grep -rn "superpowers:" skills/ agents/
```

- [ ] **Step 2: Replace all occurrences**

`superpowers:` → `cortx:` across all files. Key files:
- `executing-plans/SKILL.md` (lines 14, 36, 68, 70)
- `finishing-a-development-branch/SKILL.md` (lines 196, 197, 200)
- `subagent-driven-development/SKILL.md` (lines 268-272, 277)
- `systematic-debugging/SKILL.md` (lines 179, 287, 288)
- `using-git-worktrees/SKILL.md` (lines 212-214, 218)
- `writing-plans/SKILL.md` (lines 110, 140, 144)
- `writing-skills/SKILL.md` (line 18)
- `requesting-code-review/SKILL.md` (line 34)

- [ ] **Step 3: Also rename skill `name:` fields in frontmatter** from `superpowers:X` to `cortx:X` where applicable.

- [ ] **Step 4: Verify no remaining `superpowers:` references**

```bash
grep -rn "superpowers" skills/ agents/ hooks/
```

- [ ] **Step 5: Commit**

```
chore: rename superpowers namespace to cortx
```

---

## Chunk 4 — Light Skill Adaptations (cortx-skills repo)

### Task 11: Adapt test-driven-development

**Files:**
- Modify: `skills/test-driven-development/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add cortx integration section**

After the existing TDD process, add a section:

```markdown
## cortx Integration

- **All test runs** use `proxy_exec` instead of direct Bash. This provides git checkpoints
  before dangerous operations and audit trail.
- **Before writing a test**, call `memory_recall` with the error pattern or feature name.
  cortx may have seen a similar pattern in past sessions and can suggest test approaches.
- **When a new test pattern is discovered** (novel assertion, edge case that caught a bug),
  call `memory_store` to persist it for future sessions.
```

- [ ] **Step 3: In the "Run test" steps throughout the document**, add a note:
  `(via proxy_exec — never use Bash directly for project commands)`

- [ ] **Step 4: Commit**

```
feat(tdd): add cortx integration (proxy_exec, memory)
```

### Task 12: Adapt systematic-debugging

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add cortx integration**

In Phase 1 (Root Cause Investigation), add at the beginning:
```markdown
**Before investigating:** Call `memory_recall` with the error message or symptoms.
cortx may have encountered this bug or a similar one in past sessions. If a causal chain
exists, it can point directly to the resolution files.
```

In Phase 4 (Implementation), add at the end:
```markdown
**After fixing:** Call `memory_store` to persist the root cause and fix as a causal chain.
This ensures future sessions can recall this fix if the same error pattern reappears.
```

Add global note: all commands via `proxy_exec`.

- [ ] **Step 3: Commit**

```
feat(debugging): add cortx integration (memory recall/store, proxy_exec)
```

### Task 13: Adapt verification-before-completion

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add cortx note**

In the "RUN" step of the gate function, add:
```markdown
All verification commands MUST go through `proxy_exec`. This ensures they are tracked
in cortx's execution log and can be referenced in the session report.
```

- [ ] **Step 3: Commit**

```
feat(verification): add proxy_exec instruction
```

---

## Chunk 5 — Medium Skill Adaptations (cortx-skills repo)

### Task 14: Adapt brainstorming

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add cortx integration to the checklist**

Update item 1 "Explore project context" to include:
```markdown
1. **Explore project context** — check files, docs, recent commits.
   Call `memory_recall` with the topic/feature name to retrieve past design decisions,
   related causal chains, and error patterns from cortx memory.
```

Add a new step after "Write design doc":
```markdown
7b. **Persist design decisions** — Call `memory_store` with key design decisions
    (approach chosen, trade-offs, rejected alternatives) so future sessions can recall them.
```

- [ ] **Step 3: Update terminal state** — after brainstorming, invoke `cortx:writing-plans` (not `superpowers:writing-plans`)

- [ ] **Step 4: Commit**

```
feat(brainstorming): add cortx memory integration
```

### Task 15: Adapt writing-plans

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add mandatory board creation**

After the "File Structure" section, add:
```markdown
## Board Synchronization (MANDATORY)

After writing the plan, create tasks on the kanban board:

1. Call `memory_recall` to find similar past implementations
2. Call `planning_decompose` with:
   - `objective`: the plan's goal
   - `board_id`: the project's board
   - `tasks`: array matching 1:1 with plan tasks, including:
     - `title`: task title
     - `description`: full task description + acceptance criteria
     - `priority`: based on dependency order
     - `depends_on`: indexes of tasks this depends on

The plan markdown file remains as detailed reference (code snippets, file paths,
verification commands). The board is the source of truth for task status and ordering.
```

- [ ] **Step 3: Update the plan header template** — change `superpowers:` references to `cortx:` and add note about board sync

- [ ] **Step 4: Commit**

```
feat(writing-plans): add mandatory board sync via planning_decompose
```

### Task 16: Adapt code review skills

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/receiving-code-review/SKILL.md`

- [ ] **Step 1: Read both SKILL.md files**

- [ ] **Step 2: In requesting-code-review**, add:
```markdown
Before dispatching the reviewer, call `memory_recall` with the feature name to retrieve
the original design decisions and spec context. Include relevant findings in the reviewer's
context so they can verify against the original intent.
```

- [ ] **Step 3: In receiving-code-review**, add:
```markdown
After implementing review feedback that reveals an important pattern or architectural
decision, call `memory_store` to persist the finding for future sessions.
```

- [ ] **Step 4: Commit**

```
feat(code-review): add cortx memory integration
```

### Task 17: Adapt finishing-a-development-branch

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Add cortx finish steps**

Before the "Present exactly 4 options" section, add:
```markdown
## cortx Wrap-Up

Before presenting options:
1. Call `session_report` to generate and store the session summary
2. Call `planning_list_tasks` to check for any tasks still in progress
3. For each completed task, call `planning_complete_task` to mark it done on the board
4. If tasks remain in progress, flag them to the user
```

- [ ] **Step 3: Commit**

```
feat(finishing): add session_report and board sync
```

---

## Chunk 6 — Deep Skill Adaptations (cortx-skills repo)

### Task 18: Rewrite executing-plans

**Files:**
- Rewrite: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Read current SKILL.md** (only 71 lines — short)

- [ ] **Step 2: Rewrite with cortx cycle**

The new SKILL.md should define this loop per task:

```markdown
## Per-Task Execution Loop

For each task in the plan:

1. **Claim** — `planning_claim_task` with the task_id from the board
2. **Context** — `memory_recall` with the task's error patterns, file paths
3. **Execute** — Follow the task steps. All commands via `proxy_exec`.
4. **Gate** — `planning_validate_gates` to run quality checks
5. **Release** — `planning_release_task` with status (done or failed)

### On Failure
- If a step fails, retry with enriched context from `memory_recall`
- After 3 retries, call `planning_escalate` and move to next task

### On Completion
- After all tasks: invoke `cortx:finishing`
```

Keep the existing guidance about loading plans, verifying before claiming done, etc.

- [ ] **Step 3: Commit**

```
feat(executing-plans): rewrite with cortx claim/exec/gate/release cycle
```

### Task 19: Rewrite subagent-driven-development

**Files:**
- Rewrite: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Read current SKILL.md** (278 lines — long, detailed)

- [ ] **Step 2: Rewrite with cortx orchestration**

This is the most complex adaptation. The new SKILL.md must describe:

**Controller loop (orchestrator):**
1. Load plan from file + board state from `planning_list_tasks`
2. For each task (respecting dependency order from board):
   a. `planning_claim_task` with specific task_id
   b. `memory_recall` for task-specific context
   c. Dispatch fresh implementer subagent with:
      - Full task text (extracted from plan, NOT a file path)
      - Memory context (hints from recall)
      - Constraint: all commands via `proxy_exec`
   d. Handle return status:
      - `DONE` → proceed to review
      - `DONE_WITH_CONCERNS` → evaluate, proceed or treat as BLOCKED
      - `NEEDS_CONTEXT` → enrich via `memory_recall` + grep, re-dispatch (counts as retry)
      - `BLOCKED` → re-dispatch with error context (up to max retries)
   e. If max retries hit → `planning_escalate`, `planning_release_task` (failed), next task
   f. Dispatch spec-reviewer subagent
   g. If spec fails → re-dispatch implementer with feedback (counts as retry)
   h. Dispatch code-quality-reviewer subagent
   i. If code quality has critical issues → re-dispatch implementer
   j. `planning_validate_gates`
   k. If gates fail → re-dispatch implementer
   l. `planning_release_task` (done)
   m. `memory_store` any patterns discovered
3. After all tasks: dispatch final code reviewer for entire implementation
4. Invoke `cortx:finishing`

Keep the existing guidance about scene-setting context, task extraction, model selection, etc.

- [ ] **Step 3: Commit**

```
feat(subagent-dev): rewrite with cortx orchestration cycle
```

---

## Chunk 7 — Auto Mode (cortx-skills repo)

### Task 20: Create orchestrator agent prompt

**Files:**
- Create: `agents/orchestrator.md`

- [ ] **Step 1: Write the orchestrator prompt**

The orchestrator is dispatched by the `/cortx:auto` skill. It receives:
- The user's objective
- The confirmed configuration (gates, parallel_agents, etc.)
- Project context from `memory_recall`

Its behavior:
1. Call `planning_decompose` to create tasks on board
2. Call `planning_list_tasks` to get the task DAG
3. Execute the subagent-driven-development loop (Task 19 logic)
4. Handle all return statuses, retries, escalation
5. Manage parallelism via Agent tool with `isolation: "worktree"`
6. Merge worktree branches back sequentially
7. Call `session_report` at the end

The prompt should be self-contained — it does NOT reference other skills. It contains the full orchestration logic inline.

- [ ] **Step 2: Commit**

```
feat: create orchestrator agent prompt for auto mode
```

### Task 21: Create auto skill

**Files:**
- Create: `skills/auto/SKILL.md`

- [ ] **Step 1: Write the skill**

```yaml
---
name: cortx:auto
description: "Autonomous orchestration mode. Takes an objective, decomposes into tasks, dispatches sub-agents, reviews, and drives to completion. Use when the user invokes /cortx:auto."
---
```

The skill content:
1. **Entry validation** — verify cortx MCP is connected, extract objective from arguments
2. **Configuration display** — show defaults, ask for confirmation:
   ```
   Objective understood. Config:
     ✓ Plan approval before execution
     ✓ Review after each task
     ...
   Go? (or adjust)
   ```
3. **INIT** — `memory_recall` for project context, `proxy_status` for budget
4. **DECOMPOSE** — analyze objective, `planning_decompose`
5. **GATE: approve_decomposition** — if enabled, show plan and wait
6. **DISPATCH** — launch orchestrator agent (from `agents/orchestrator.md`) with:
   - Objective
   - Confirmed config
   - Board ID
   - Memory context
7. **MONITOR** — the auto skill hands off to the orchestrator. The orchestrator handles the full cycle.
8. **FINISH** — orchestrator invokes `cortx:finishing` at the end

- [ ] **Step 2: Commit**

```
feat: create /cortx:auto skill
```

---

## Chunk 8 — Agent Prompt Updates (cortx-skills repo)

### Task 22: Update implementer prompt

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Read current prompt**

- [ ] **Step 2: Add cortx constraints**

Add to the implementer's instructions:
```markdown
## cortx Integration

- **All commands** (test, build, lint, git) MUST go through `proxy_exec`.
  Never use the Bash tool directly for project commands.
- If you discover a useful pattern or make a non-obvious decision, note it in your
  status report so the orchestrator can call `memory_store`.
```

- [ ] **Step 3: Commit**

```
feat(agents): add cortx constraints to implementer prompt
```

### Task 23: Update reviewer prompts

**Files:**
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `agents/code-reviewer.md`

- [ ] **Step 1: Read all three prompts**

- [ ] **Step 2: Update cross-references** from `superpowers:` to `cortx:` if any remain

- [ ] **Step 3: In code-quality-reviewer-prompt.md**, add:
```markdown
When reviewing, verify that the implementer used `proxy_exec` for all command executions.
Flag any direct Bash tool usage for project commands as a Critical issue.
```

- [ ] **Step 4: Commit**

```
feat(agents): update reviewer prompts for cortx
```

### Task 24: Update README

**Files:**
- Rewrite: `README.md`

- [ ] **Step 1: Write cortx-skills README**

Cover:
- What cortx-skills is (fork of superpowers, cortx-native)
- Prerequisites (cortx binary + MCP server)
- Installation (clone repo, add as Claude Code plugin)
- Available skills (table with `/cortx:*` commands)
- Auto mode quickstart
- Configuration (CLAUDE.md options)
- Differences from superpowers

- [ ] **Step 2: Commit**

```
docs: rewrite README for cortx-skills
```

### Task 25: Clean up deprecated files

**Files:**
- Delete: `skills/using-superpowers/` (if not already deleted in Task 9)
- Delete: `RELEASE-NOTES.md` (superpowers-specific)
- Delete: `CHANGELOG.md` (superpowers-specific, start fresh)
- Review: `commands/` directory — adapt or remove superpowers commands

- [ ] **Step 1: Check `commands/` directory**

```bash
ls commands/
```

If there are commands, evaluate if they need adaptation (rename, cortx integration) or removal.

- [ ] **Step 2: Delete/adapt identified files**

- [ ] **Step 3: Commit**

```
chore: remove superpowers-specific files, clean up
```

---

## Execution Order

```
Chunk 1 (cortx MCP tools)     — can run independently in cortx repo
Chunk 2 (foundation)          — first in cortx-skills
Chunk 3 (namespace migration) — after Chunk 2
Chunk 4 (light adaptations)   — after Chunk 3, tasks are independent
Chunk 5 (medium adaptations)  — after Chunk 3, tasks are independent
Chunk 6 (deep adaptations)    — after Chunks 4+5 (references updated skills)
Chunk 7 (auto mode)           — after Chunk 6 (builds on subagent-dev)
Chunk 8 (cleanup)             — after all other chunks
```

Chunks 4 and 5 can run in parallel. Chunk 1 can run in parallel with everything else.
