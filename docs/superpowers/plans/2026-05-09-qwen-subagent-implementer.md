# Qwen as Implementer in Subagent-Driven Development — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Claude implementer subagent in `subagent-driven-development` with `mcp__qwen-mcp__delegate_to_qwen`, adding a context preparation phase and Qwen-specific stop_reason handling.

**Architecture:** Two files change. `implementer-prompt.md` is fully replaced with a Qwen delegation template. `SKILL.md` gets the Q&A-based implementer flow replaced with a context-prep + Qwen delegation flow, and the status section replaced with `stop_reason` mapping.

**Tech Stack:** Markdown (skill files only — no code, no tests, no build step)

---

## File Map

| File | Change |
|---|---|
| `skills/subagent-driven-development/implementer-prompt.md` | Full replacement — Qwen delegation template |
| `skills/subagent-driven-development/SKILL.md` | Six targeted edits (process diagram, model selection, status handling, prompt templates label, example workflow, red flags + advantages) |

---

### Task 1: Replace implementer-prompt.md with Qwen delegation template

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Read the current file**

  Confirm it contains the Agent tool dispatch template starting with `# Implementer Subagent Prompt Template`.

- [ ] **Step 2: Write the new file**

  Replace the entire contents with:

  ````markdown
  # Qwen Implementer Delegation Template

  Use this template when delegating an implementation task to Qwen via the `mcp__qwen-mcp__delegate_to_qwen` MCP tool.

  ## Context Preparation (do this before delegating)

  1. **Resolve from context** — use what you know from the plan, codebase structure, and prior tasks to preemptively answer likely ambiguities. Include those answers inline in the `task` string.
  2. **Ask the user** — if genuine ambiguity remains that you cannot resolve from context, ask the user directly (one question at a time) before delegating.
  3. **Identify relevant files** — note which files prior tasks changed and which files the plan explicitly references for this task. These go in `context_hints`.

  ## Delegation Call

  ```
  mcp__qwen-mcp__delegate_to_qwen:
    task: |
      ## Task

      [FULL TEXT of task from plan — paste it here, do not make Qwen read the plan file]

      ## Context

      [Scene-setting: where this fits in the plan, what prior tasks did, architectural context.
       Include answers to any ambiguities you resolved above.]

      ## Done when

      [Concrete acceptance criteria from the plan, stated plainly]

      ## On completion

      Reply with a concise summary covering:
      - What you implemented
      - Which files you changed (list them)
      - What tests you ran and their results
      - Any issues or concerns

    working_dir: [absolute path to project root or relevant subtree]
    context_hints:
      - [file changed by a prior task that this task depends on]
      - [file the plan explicitly references for this task]
  ```

  ## After Delegation

  Inspect the response fields:

  - **`result`** — Qwen's summary of what it did (or partial progress if stopped early)
  - **`files_changed`** — files Qwen wrote or edited
  - **`commands_run`** — commands Qwen executed
  - **`stop_reason`** — see "Handling Qwen stop_reason" in SKILL.md
  - **`transcript_path`** — full JSONL transcript; include this path in any escalation to the user
  ````

- [ ] **Step 3: Commit**

  ```bash
  git add skills/subagent-driven-development/implementer-prompt.md
  git commit -m "feat: replace implementer prompt with Qwen delegation template"
  ```

---

### Task 2: Update SKILL.md — process diagram

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

This task replaces the per-task cluster in the DOT process diagram. The current cluster has a Q&A loop between coordinator and implementer; the new cluster has a context-prep step feeding directly into the Qwen delegation call.

- [ ] **Step 1: Read SKILL.md lines 44–87**

  Confirm the `subgraph cluster_per_task` block contains these nodes:
  - `"Dispatch implementer subagent (./implementer-prompt.md)"`
  - `"Implementer subagent asks questions?"`
  - `"Answer questions, provide context"`
  - `"Implementer subagent implements, tests, commits, self-reviews"`

- [ ] **Step 2: Replace the per-task cluster and its edges**

  Find this exact block (lines 48–86):

  ```
      subgraph cluster_per_task {
          label="Per Task";
          "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
          "Implementer subagent asks questions?" [shape=diamond];
          "Answer questions, provide context" [shape=box];
          "Implementer subagent implements, tests, commits, self-reviews" [shape=box];
          "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
          "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
          "Implementer subagent fixes spec gaps" [shape=box];
          "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
          "Code quality reviewer subagent approves?" [shape=diamond];
          "Implementer subagent fixes quality issues" [shape=box];
          "Mark task complete in TodoWrite" [shape=box];
      }

      "Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
      "More tasks remain?" [shape=diamond];
      "Dispatch final code reviewer subagent for entire implementation" [shape=box];
      "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

      "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
      "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
      "Implementer subagent asks questions?" -> "Answer questions, provide context" [label="yes"];
      "Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md)";
      "Implementer subagent asks questions?" -> "Implementer subagent implements, tests, commits, self-reviews" [label="no"];
      "Implementer subagent implements, tests, commits, self-reviews" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)";
      "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
      "Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
      "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
      "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes"];
      "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
      "Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
      "Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
      "Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
      "Mark task complete in TodoWrite" -> "More tasks remain?";
      "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
      "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
      "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
  ```

  Replace with:

  ```
      subgraph cluster_per_task {
          label="Per Task";
          "Prepare context (resolve ambiguities / ask user if needed)" [shape=box];
          "Delegate to Qwen (mcp__qwen-mcp__delegate_to_qwen)" [shape=box];
          "Qwen stop_reason?" [shape=diamond];
          "Decompose or escalate to user" [shape=box];
          "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
          "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
          "Re-delegate fix to Qwen" [shape=box];
          "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
          "Code quality reviewer subagent approves?" [shape=diamond];
          "Re-delegate quality fix to Qwen" [shape=box];
          "Mark task complete in TodoWrite" [shape=box];
      }

      "Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
      "More tasks remain?" [shape=diamond];
      "Dispatch final code reviewer subagent for entire implementation" [shape=box];
      "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

      "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Prepare context (resolve ambiguities / ask user if needed)";
      "Prepare context (resolve ambiguities / ask user if needed)" -> "Delegate to Qwen (mcp__qwen-mcp__delegate_to_qwen)";
      "Delegate to Qwen (mcp__qwen-mcp__delegate_to_qwen)" -> "Qwen stop_reason?";
      "Qwen stop_reason?" -> "Decompose or escalate to user" [label="budget/error"];
      "Decompose or escalate to user" -> "Prepare context (resolve ambiguities / ask user if needed)" [label="decomposed"];
      "Qwen stop_reason?" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="complete"];
      "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
      "Spec reviewer subagent confirms code matches spec?" -> "Re-delegate fix to Qwen" [label="no"];
      "Re-delegate fix to Qwen" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
      "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes"];
      "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
      "Code quality reviewer subagent approves?" -> "Re-delegate quality fix to Qwen" [label="no"];
      "Re-delegate quality fix to Qwen" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
      "Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
      "Mark task complete in TodoWrite" -> "More tasks remain?";
      "More tasks remain?" -> "Prepare context (resolve ambiguities / ask user if needed)" [label="yes"];
      "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
      "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add skills/subagent-driven-development/SKILL.md
  git commit -m "feat: update subagent-driven-development process diagram for Qwen"
  ```

---

### Task 3: Update SKILL.md — status handling, model selection, prompt templates, red flags, example

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

Five targeted edits to the prose sections.

- [ ] **Step 1: Replace Model Selection section**

  Find:

  ```markdown
  ## Model Selection

  Use the least powerful model that can handle each role to conserve cost and increase speed.

  **Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

  **Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

  **Architecture, design, and review tasks**: use the most capable available model.

  **Task complexity signals:**
  - Touches 1-2 files with a complete spec → cheap model
  - Touches multiple files with integration concerns → standard model
  - Requires design judgment or broad codebase understanding → most capable model
  ```

  Replace with:

  ```markdown
  ## Model Selection

  **Implementation:** Always use Qwen via `mcp__qwen-mcp__delegate_to_qwen`. Qwen runs locally and handles mechanical coding tasks — writing functions, adding tests, threading parameters.

  **Review roles** still use Claude subagents. Use the most capable available model for spec compliance and code quality review — these roles require judgment and diff-reading that benefit from stronger reasoning.
  ```

- [ ] **Step 2: Replace Handling Implementer Status section**

  Find:

  ```markdown
  ## Handling Implementer Status

  Implementer subagents report one of four statuses. Handle each appropriately:

  **DONE:** Proceed to spec compliance review.

  **DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

  **NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

  **BLOCKED:** The implementer cannot complete the task. Assess the blocker:
  1. If it's a context problem, provide more context and re-dispatch with the same model
  2. If the task requires more reasoning, re-dispatch with a more capable model
  3. If the task is too large, break it into smaller pieces
  4. If the plan itself is wrong, escalate to the human

  **Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.
  ```

  Replace with:

  ```markdown
  ## Handling Qwen stop_reason

  Qwen returns a `stop_reason` field in every delegation response. Handle each value:

  **`complete`:** Proceed to spec compliance review.

  **`error`:** Connection or server failure. Check the `result` field for details. Retry once if it looks transient (connection reset, timeout on first attempt). If it fails again, treat as BLOCKED and escalate to the user.

  **`max_steps` / `timeout` / `token_limit`:** Budget exhausted with partial work. Inspect `result` and `files_changed`:
  - If a clear remaining piece exists (e.g., implementation written but tests not written), decompose into sub-tasks and delegate each to Qwen separately.
  - If the task is already atomic and cannot be split further, escalate to the user. Include the `transcript_path` so they can inspect what Qwen completed before deciding how to proceed.

  **Never** ignore a non-`complete` stop_reason or proceed to spec review with partial work without assessing it first.
  ```

- [ ] **Step 3: Update Prompt Templates section**

  Find:

  ```markdown
  - `./implementer-prompt.md` - Dispatch implementer subagent
  ```

  Replace with:

  ```markdown
  - `./implementer-prompt.md` - Delegate implementation task to Qwen
  ```

- [ ] **Step 4: Replace Example Workflow**

  Find:

  ```markdown
  Task 1: Hook installation script

  [Get Task 1 text and context (already extracted)]
  [Dispatch implementation subagent with full task text + context]

  Implementer: "Before I begin - should the hook be installed at user or system level?"

  You: "User level (~/.config/superpowers/hooks/)"

  Implementer: "Got it. Implementing now..."
  [Later] Implementer:
    - Implemented install-hook command
    - Added tests, 5/5 passing
    - Self-review: Found I missed --force flag, added it
    - Committed

  [Dispatch spec compliance reviewer]
  Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

  [Get git SHAs, dispatch code quality reviewer]
  Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

  [Mark Task 1 complete]

  Task 2: Recovery modes

  [Get Task 2 text and context (already extracted)]
  [Dispatch implementation subagent with full task text + context]

  Implementer: [No questions, proceeds]
  Implementer:
    - Added verify/repair modes
    - 8/8 tests passing
    - Self-review: All good
    - Committed
  ```

  Replace with:

  ```markdown
  Task 1: Hook installation script

  [Get Task 1 text and context (already extracted)]
  [Context prep: plan references hooks.py; no ambiguity — install path is explicit in spec]
  [delegate_to_qwen(task=<full text + context>, working_dir=..., context_hints=[hooks.py])]

  Qwen result:
    stop_reason: complete
    result: "Implemented install-hook command. Added 5 tests, all passing. Committed."
    files_changed: [hooks.py, tests/test_hooks.py]

  [Dispatch spec compliance reviewer]
  Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

  [Get git SHAs, dispatch code quality reviewer]
  Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

  [Mark Task 1 complete]

  Task 2: Recovery modes

  [Get Task 2 text and context (already extracted)]
  [Context prep: ambiguity — spec says "report progress" but doesn't say how often]
  [Ask user: "How often should progress be reported during recovery?"]
  You: "Every 100 items"
  [delegate_to_qwen(task=<full text + context + "report every 100 items">, working_dir=..., context_hints=[recovery.py])]

  Qwen result:
    stop_reason: complete
    result: "Added verify/repair modes with progress every 100 items. 8/8 tests passing. Committed."
    files_changed: [recovery.py, tests/test_recovery.py]
  ```

- [ ] **Step 5: Update Red Flags and Advantages**

  Find in Red Flags:

  ```markdown
  - Dispatch multiple implementation subagents in parallel (conflicts)
  - Make subagent read plan file (provide full text instead)
  - Skip scene-setting context (subagent needs to understand where task fits)
  - Ignore subagent questions (answer before letting them proceed)
  ```

  Replace with:

  ```markdown
  - Delegate to Qwen without running the context preparation step first
  - Make Qwen read the plan file (provide full text in the `task` string instead)
  - Skip scene-setting context (Qwen needs to understand where the task fits)
  - Leave genuine ambiguity unresolved before delegating (Qwen cannot ask questions)
  ```

  Find in Red Flags:

  ```markdown
  **If subagent asks questions:**
  - Answer clearly and completely
  - Provide additional context if needed
  - Don't rush them into implementation
  ```

  Replace with:

  ```markdown
  **If context prep reveals ambiguity:**
  - Resolve from existing context if possible (don't ask the user unnecessarily)
  - If you must ask the user, ask one question at a time
  - Include the resolved answer inline in the `task` string — don't leave Qwen to guess
  ```

  Find in Advantages:

  ```markdown
  - Subagent can ask questions (before AND during work)
  ```

  Replace with:

  ```markdown
  - Context prep step ensures Qwen has everything it needs upfront
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add skills/subagent-driven-development/SKILL.md
  git commit -m "feat: update subagent-driven-development prose for Qwen implementer"
  ```
