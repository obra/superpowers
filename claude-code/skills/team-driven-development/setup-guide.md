# Team Setup Guide

## Step 1: Create Team & Register All Tasks

```
TeamCreate:
  team_name: "<project-name>"
  description: "Implementing <feature>"
```

**Immediately after TeamCreate**, register ALL tasks from the plan using TaskCreate:

```
For each task in plan:
  TaskCreate:
    subject: "<task title>"
    description: "<full task requirements including target files>"
    activeForm: "<present continuous form>"
    metadata: {
      "target_files": ["src/auth.ts", "src/auth.test.ts"],
      "model": "opus",
      "goal": "<What is achieved when this task is complete — one sentence>",
      "success_criteria": [
        "<Verifiable success criterion 1>",
        "<Verifiable success criterion 2>",
        "<Verifiable success criterion 3>"
      ],
      "verification_method": "<Specific verification method: test name, curl command, UI check, etc.>"
    }

Then set dependencies:
  TaskUpdate: { taskId: "2", addBlockedBy: ["1"] }  # if task 2 depends on task 1
```

**CRITICAL — goal/success_criteria metadata:**
Every task MUST declare goal, success_criteria, and verification_method.
Workers use these for self-check, and Audit Agent verifies against them.

**success_criteria writing principles:**
- No vague criteria: "works well" ✗ → "POST /api/login returns 200 + JWT" ✓
- Must be verifiable: should be confirmable via tests, curl, UI interaction, etc.
- Include error cases: describe both happy path and unhappy path
- 3-7 range: too few risks omission, too many means the task needs splitting

**CRITICAL — target_files metadata:**
Every task MUST declare which files it will create or modify in `metadata.target_files`.
This is used by the orchestration loop to prevent file conflicts between concurrent workers.

**CRITICAL — dependency analysis:**
Before entering the loop, verify the dependency graph is correct:
1. Tasks that share target files MUST have a dependency (blockedBy) between them
2. Tasks that consume output of another task MUST be blocked by that task
3. Circular dependencies MUST be resolved by splitting tasks

This gives you a complete task board with dependency graph and file ownership BEFORE any agent is spawned.

## Step 2: Spawn Audit Agent

**Only spawn the Audit Agent — NO workers yet:**

```
Task (Audit Agent):
  name: "audit-agent"
  subagent_type: "sonbbal-superpowers:audit-agent"
  model: "opus"                    # ALWAYS Opus — non-negotiable
  prompt: "You are the Audit Agent. See agents/audit-agent.md for your role."
  team_name: "<project-name>"
```

## Step 3: API Documentation Check

Before entering the orchestration loop:

1. Check if `docs/api/` directory exists
2. If it doesn't exist, create an empty `docs/api/` directory as baseline
3. If it exists, review the contents to understand existing API contracts
4. Workers will reference `docs/api/` directly when implementing API-related tasks (using the `superpowers:api-edr-validation` skill)

## Step 4: Assess Task Difficulty

Use **superpowers:model-assignment** to determine model for each task:

| Difficulty | Criteria | Model |
|-----------|----------|-------|
| **High** | New architecture, complex logic, security-critical, multi-system integration | Opus |
| **Low** | Simple CRUD, config changes, boilerplate, straightforward tests | Sonnet |

Record the model assignment in task metadata:
```
TaskUpdate: { taskId: "1", metadata: { "model": "opus" } }
TaskUpdate: { taskId: "2", metadata: { "model": "sonnet" } }
```
