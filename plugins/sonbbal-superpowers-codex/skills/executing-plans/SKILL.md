---
name: executing-plans
description: Use when executing a written implementation plan in Codex with review checkpoints and verification gates.
---

# Executing Plans

## Overview

Load the plan, review it critically, execute the tasks, and verify the result before claiming completion.

Announce at start: "I'm using the executing-plans skill to implement this plan."

## Process

### Step 1: Load And Review

1. Read the full plan.
2. Identify scope limits, required files, verification commands, and blockers.
3. If there is a critical gap, stop and ask the user before editing.
4. If the plan is executable, create an `update_plan` checklist and proceed.

Never start implementation on `main` or `master` unless the user explicitly permits it.

### Step 2: Execute Inline By Default

Execute batches inline in the current Codex session unless the user explicitly asks for subagents, delegation, parallel agent work, or a team workflow.

For each task:

1. Mark it `in_progress` with `update_plan`.
2. Follow the plan's steps.
3. Run the specified verification.
4. Mark it `completed` only after verification supports that status.

### Step 3: Delegation Only When Allowed

Use `spawn_agent` only when both conditions are true:

- The user explicitly requested subagents, delegation, parallel agent work, or a team workflow.
- The delegated task is independent enough to run without blocking the immediate local step.

Use `send_input` for follow-up instructions to an existing delegated agent. Use `wait_agent` only when the next local step is blocked on that result.

### Step 4: Final Verification

After all tasks are implemented:

1. Re-read the plan's success criteria.
2. Run the full verification commands.
3. Review the diff for scope control.
4. Use `verification-before-completion` before making any completion claim.

## Stop Conditions

Stop and ask for help when:

- A plan instruction is unclear enough that guessing could change scope.
- A dependency or required file is missing.
- Verification repeatedly fails and the next fix is not clear.
- The requested change would require editing files outside the plan's allowed scope.
