---
name: task-dependency-management
description: Use when you need to convert an implementation plan into a task graph with explicit dependencies
---

# Task Dependency Management

## Overview

Convert implementation plans into managed task graphs using TaskCreate/TaskUpdate tools (runtime tracking) and JSON files (durable artifacts). Makes implicit dependencies explicit so parallel execution can happen safely.

**Core principle:** Plans hide dependencies in file imports, type usage, and sequential operations. Parse them out, make them explicit with blockedBy/blocks, export to JSON for durability, then execution becomes straightforward.

**Durable artifacts:** Creates both TaskList entries (for runtime tracking) and JSON files (for persistence, resumption, and cross-platform compatibility).

**Note:** This is a NEW skill that adds functionality not present in existing superpowers skills. It does not modify or replace any existing workflows. The implementation plan from `writing-plans` remains the source of truth; this skill extracts and makes the dependency graph explicit.

**Announce at start:** "I'm using the task-dependency-management skill to convert this plan into a managed task graph."

**Important:** These skills use Claude Code's TaskCreate/TaskUpdate/TaskList tools. Do NOT use TodoWrite checkboxes in combination with these skills, as it creates duplicate tracking. Choose one approach:
- TaskCreate/TaskUpdate → Use these skills
- TodoWrite checkboxes → Use subagent-driven-development or executing-plans

**Platform Note:** TaskCreate/TaskUpdate/TaskList are Claude Code-specific tools. However, this skill creates a durable JSON artifact that can be used for execution tracking in any environment. The JSON file is platform-neutral.

**Session Management:** TaskList state is session-local, but the JSON task graph persists. If a session ends, the JSON file allows resumption without losing dependency information. The original plan from `writing-plans` remains the authoritative source of task content.

## Quick Start

1. Read plan → 2. Parse tasks → 3. TaskCreate all → 4. Set dependencies → 5. Verify

See full process below for details.

## When to Use

Use this skill when:
- You have an implementation plan (from superpowers:writing-plans)
- Plan has 3+ tasks
- You want to track progress and dependencies systematically
- You're preparing for parallel execution

Don't use when:
- Plan is simple (< 3 tasks) - just execute directly
- You're already mid-execution - too late to set up tracking
- Plan doesn't exist - use superpowers:writing-plans first

## Choosing the Right Execution Skill

| Feature | task-orchestrated-execution | subagent-driven-development | executing-plans |
|---------|---------------------------|----------------------------|-----------------|
| Parallelism | ✅ Multi-wave | ❌ Sequential | ❌ Sequential |
| Review between tasks | ❌ No | ✅ Yes (2-stage) | ⚠️ Checkpoints only |
| Dependency tracking | ✅ Automatic (blockedBy) | ❌ Manual order | ❌ Manual order |
| Task state management | ✅ TaskList | ⚠️ TodoWrite | ⚠️ TodoWrite |
| Resumability | ✅ Yes (persistent state) | ⚠️ Limited | ⚠️ Limited |
| Speed | ⭐⭐⭐ Fast (parallel) | ⭐⭐ Medium | ⭐ Slow (sequential) |
| Supervision | Low (automated) | High (review each) | Medium (checkpoints) |

**Choose this + task-orchestrated-execution when:**
- You want automatic parallelization
- Tasks have dependencies to track
- You trust the plan and want speed
- You don't need review between every task

## The Process

### Step 1: Read the Implementation Plan

Use the Read tool:
```
Read("docs/superpowers/plans/YYYY-MM-DD-feature-name.md")
```

Extract the full plan content. You need all tasks visible to detect cross-task dependencies.

### Step 2: Parse Tasks

For each section starting with `### Task N:`:

1. Extract task number from "### Task N:"
2. Extract task name (text after "Task N:")
3. Extract everything until next "### Task" or end of file
4. Note the "**Files:**" section:
   - Create: files this task creates
   - Modify: files this task modifies
   - Test: test files (usually safe to parallelize)

**Note:** Import dependencies may be explicit in Files section OR implicit in code blocks. Parse both:
- Explicit: `- Import: src/models/user.py` (if plan includes this)
- Implicit: `from src.models.user import User` in code blocks

**Always parse code blocks for imports, don't rely only on Files section.**

**Import Extraction:**
- Python: Look for `from X import` and `import X`
- TypeScript: Look for `import ... from "X"` and `require("X")`
- Extract file paths, map to tasks that create them

**Example:**
```markdown
### Task 2: Create Authentication Service

**Files:**
- Create: `src/services/auth.py`
- Import: `src/models/user.py`

- [ ] **Step 3: Write minimal implementation**

```python
from src.models.user import User

def authenticate(username: str) -> User:
    return User(id="1", name=username)
```
```

Extracted:
- Task ID: 2
- Name: "Create Authentication Service"
- Creates: `src/services/auth.py`
- Imports: `src/models/user.py` (explicit + from code block)

### Step 3: Create Managed Tasks

For each parsed task, call TaskCreate and capture the returned task ID:

```
task1_id = TaskCreate({
  subject: "Task 1: Create User Model",
  description: `
    **Files:**
    - Create: src/models/user.py

    **Steps:**
    [paste all steps from plan]
  `,
  activeForm: "Creating User Model"
})
# TaskCreate returns the task ID

task2_id = TaskCreate({
  subject: "Task 2: Create Authentication Service",
  description: "[full task content]",
  activeForm: "Creating Authentication Service"
})

task3_id = TaskCreate({...})
# Continue for all tasks
```

**Important:** Include the full task content in description. Agents will need it.

Store these task IDs for use in Step 4 (setting dependencies).

### Step 4: Build Dependency Graph

For each task, check:

**File dependencies:**
- If this task imports/modifies a file that a previous task creates
- → This task is `blockedBy` that previous task

**Example:**
- Task 1 creates `user.py`
- Task 2 imports `user.py`
- → Task 2 blockedBy Task 1

```
TaskUpdate({
  taskId: task2_id,
  addBlockedBy: [task1_id]
})
```

**Sequential dependencies:**
- Migration before model
- Setup before usage
- Install before import

**Explicit markers:**
```markdown
### Task 5: Integration (depends on Tasks 1-4)
```

Extract dependencies and set them:
```
TaskUpdate({
  taskId: task5_id,
  addBlockedBy: [task1_id, task2_id, task3_id, task4_id]
})
```

### Step 5: Verify Dependency Graph

```
TaskList()
```

**Verification checklist:**
- [ ] All tasks created (count matches plan)
- [ ] No task has `blockedBy: undefined` (unless truly independent)
- [ ] No circular dependencies (Task A ↔ Task B)
- [ ] Root tasks exist (at least one with `blockedBy: []`)
- [ ] Leaf tasks exist (at least one that blocks nothing)
- [ ] Dependencies make logical sense

If any check fails, fix with TaskUpdate before proceeding.

### Step 6: Export Task Graph (Durable Artifact)

**IMPORTANT:** Create a durable artifact of the task graph for persistence and cross-session resumption.

Use the Write tool to create a JSON file:
```
Write("docs/superpowers/task-graphs/YYYY-MM-DD-feature-name.json", JSON.stringify({
  plan: "docs/superpowers/plans/YYYY-MM-DD-feature-name.md",
  created: "YYYY-MM-DD",
  tasks: [
    {
      id: "1",
      subject: "Task 1: Create User Model",
      description: "...",
      blockedBy: [],
      files: {
        create: ["src/models/user.py"],
        modify: [],
        test: []
      }
    },
    {
      id: "2",
      subject: "Task 2: Create Auth Service",
      description: "...",
      blockedBy: ["1"],
      files: {
        create: ["src/services/auth.py"],
        modify: [],
        test: []
      }
    }
    // ... all tasks
  ]
}, null, 2))
```

**Why this matters:**
- **Durable artifact:** Persists across sessions (unlike TaskList which is session-local)
- **Resumability:** If session ends, can recreate TaskList from JSON
- **Auditability:** Shows dependency decisions and reasoning
- **Platform-neutral:** JSON file works regardless of execution environment

**The plan file remains the source of truth.** This JSON is just the dependency graph extracted from it.

Check:
- All tasks created
- Dependencies make sense (no obvious circularity)
- Each task shows correct blockedBy array

**Common issues:**
- Forgot to link tasks that share files
- Circular dependency (Task A → Task B → Task A)
- Missing explicit "(depends on...)" marker

Fix issues with TaskUpdate before proceeding to execution.

## Dependency Detection Rules

### Rule 1: File Creation

```
IF:
  - Task A creates file X
  - Task B imports/modifies file X
THEN:
  - Task B blockedBy Task A
```

### Rule 2: Type Usage

```python
# Task 1
class User:
    pass

# Task 2
def get_user() -> User:  # Uses User type
    pass
```

Task 2 depends on Task 1 (type definition)

### Rule 3: Sequential Keywords

These patterns indicate sequential dependency:

- "migration" → "model using new schema"
- "install dependency" → "import dependency"
- "setup config" → "read config"
- "create database" → "connect to database"

### Rule 4: Explicit Markers

Always trust explicit dependency markers:
```markdown
### Task 3: Integration Tests (depends on Tasks 1-2)
```

## Handling Large Plans (10+ tasks)

For plans with many tasks:
1. Parse all tasks first (don't create while parsing)
2. Create all tasks in batch (TaskCreate for each)
3. Build complete dependency map
4. Apply all dependencies in batch (TaskUpdate for each)

This systematic approach prevents errors and makes dependencies easier to reason about.

## Resuming from JSON (Session Recovery)

If a session ends before execution completes, you can recreate the task graph from the JSON artifact:

```
# Read the task graph JSON
taskGraph = Read("docs/superpowers/task-graphs/YYYY-MM-DD-feature-name.json")
parsed = JSON.parse(taskGraph)

# Recreate tasks
FOR EACH task in parsed.tasks:
  taskId = TaskCreate({
    subject: task.subject,
    description: task.description,
    activeForm: extract_active_form(task.subject)
  })

  # Store mapping: task.id → taskId
  idMap[task.id] = taskId

# Recreate dependencies
FOR EACH task in parsed.tasks:
  IF task.blockedBy is not empty:
    mappedBlockers = map(task.blockedBy, id => idMap[id])
    TaskUpdate({
      taskId: idMap[task.id],
      addBlockedBy: mappedBlockers
    })

# Verify
TaskList()
```

**Use case:** Long-running projects where sessions may end before all tasks complete. The JSON file preserves the dependency graph independently of TaskList session state.

**Note:** The original plan file remains the source of truth for task content. The JSON only tracks structure and dependencies.

## Error Handling

**If no tasks found:**
- Verify plan follows writing-plans format
- Check for "### Task N:" pattern
- Ensure plan has task sections
- ERROR: "No tasks found in plan. Verify format."

**If Files section missing:**
- Task may have no file dependencies (rare)
- Still create the task, set no blockers

**If circular dependency detected:**
- STOP setup immediately
- Report to user: "Task A blockedBy B, Task B blockedBy A"
- Ask user to revise plan
- Do NOT attempt automatic resolution

**If plan is malformed:**
- No "### Task N:" headers found
- Inconsistent task numbering
- STOP and report specific issue to user

## Example: Full Parsing

**Input plan:**
```markdown
### Task 1: Create User Model

**Files:**
- Create: `src/models/user.py`

### Task 2: Create Auth Service

**Files:**
- Create: `src/services/auth.py`
- Import: `src/models/user.py`

### Task 3: Add Login Endpoint

**Files:**
- Create: `src/api/login.py`
- Import: `src/services/auth.py`

### Task 4: Write Tests

**Files:**
- Create: `tests/test_login.py`
- Import: `src/api/login.py`
```

**Actions:**

```
# Step 1: Read plan
Read("docs/superpowers/plans/2026-04-10-auth-system.md")

# Step 2: Parse (extract 4 tasks)

# Step 3: Create tasks
task1_id = TaskCreate({subject: "Task 1: Create User Model", ...})
task2_id = TaskCreate({subject: "Task 2: Create Auth Service", ...})
task3_id = TaskCreate({subject: "Task 3: Add Login Endpoint", ...})
task4_id = TaskCreate({subject: "Task 4: Write Tests", ...})

# Step 4: Set dependencies
TaskUpdate({taskId: task2_id, addBlockedBy: [task1_id]})  # Auth needs User
TaskUpdate({taskId: task3_id, addBlockedBy: [task2_id]})  # Login needs Auth
TaskUpdate({taskId: task4_id, addBlockedBy: [task3_id]})  # Tests need Login

# Step 5: Verify
TaskList()
```

**Result:**
```
Task 1: pending, blockedBy: []
Task 2: pending, blockedBy: [1]
Task 3: pending, blockedBy: [2]
Task 4: pending, blockedBy: [3]
```

This is a linear dependency chain. Execution will be:
- Wave 1: Task 1
- Wave 2: Task 2
- Wave 3: Task 3
- Wave 4: Task 4

## Example: Parallel Branches

**Input plan:**
```markdown
### Task 1: Create Base Types

**Files:**
- Create: `src/types.py`

### Task 2: User Service

**Files:**
- Create: `src/services/user.py`
- Import: `src/types.py`

### Task 3: Payment Service

**Files:**
- Create: `src/services/payment.py`
- Import: `src/types.py`

### Task 4: Integration

**Files:**
- Create: `src/integration.py`
- Import: `src/services/user.py`
- Import: `src/services/payment.py`
```

**Dependencies:**
```
TaskUpdate({taskId: task2_id, addBlockedBy: [task1_id]})
TaskUpdate({taskId: task3_id, addBlockedBy: [task1_id]})
TaskUpdate({taskId: task4_id, addBlockedBy: [task2_id, task3_id]})
```

**Result:**
```
Task 1: pending, blockedBy: []
Task 2: pending, blockedBy: [1]
Task 3: pending, blockedBy: [1]
Task 4: pending, blockedBy: [2, 3]
```

Execution:
- Wave 1: Task 1
- Wave 2: Tasks 2 and 3 **in parallel** (both only need Task 1)
- Wave 3: Task 4 (needs both 2 and 3)

## Edge Cases

### Circular Dependencies

```
Task 1 creates file A, imports file B
Task 2 creates file B, imports file A
```

**Detection:** If A blockedBy B and B blockedBy A

**Action:**
1. STOP setup
2. Report to user: "Circular dependency detected between Tasks 1 and 2"
3. Ask user to revise plan

**Don't** try to resolve automatically - this indicates a plan problem.

### Same File Modified by Multiple Tasks

```
Task 2: Modify `config.py`
Task 3: Modify `config.py`
```

**Options:**
1. Sequential: Task 3 blockedBy Task 2 (safer)
2. Report conflict: Ask user which should go first

**Default to sequential** unless clearly independent modifications.

### Test File Dependencies

Test files usually import implementation files:
```
Task 2: Create `api.py`
Task 3: Create `test_api.py`, imports `api.py`
```

Clear dependency: Task 3 blockedBy Task 2

But tests for different features are independent:
```
Task 3: Test user API
Task 4: Test payment API
```

No dependency - can run in parallel.

## Integration with Execution

After dependency management:

```
You: "Task graph created. Ready for execution."

# Option 1: Use orchestrated execution (recommended)
Use superpowers:task-orchestrated-execution

# Option 2: Manual execution
While tasks remain:
  - TaskList() to find ready tasks
  - Dispatch agents for ready tasks
  - Wait for completion
  - TaskUpdate to mark complete
  - Repeat
```

## Common Mistakes

**❌ Creating tasks without dependencies**
```
# Missing blockedBy even though Task 2 imports from Task 1
TaskCreate({subject: "Task 1: Create model"})
TaskCreate({subject: "Task 2: Use model"})
# No TaskUpdate calls
```

**✅ Correct:**
```
task1_id = TaskCreate({subject: "Task 1: Create model"})
task2_id = TaskCreate({subject: "Task 2: Use model"})
TaskUpdate({taskId: task2_id, addBlockedBy: [task1_id]})
```

**❌ Not parsing code blocks**
```markdown
### Task 2:
```python
from models import User  # Missed this import!
```
```

**✅ Correct:** Parse code blocks for imports, don't rely only on "**Files:**" section

**❌ Ignoring explicit markers**
```markdown
### Task 5: Final Integration (depends on Tasks 1-4)
```

**✅ Correct:** Always honor explicit "(depends on...)" markers

**❌ Not capturing task IDs**
```
TaskCreate({subject: "Task 1"})  # ID lost!
TaskUpdate({taskId: "???", ...})  # What ID?
```

**✅ Correct:**
```
task1_id = TaskCreate({subject: "Task 1"})
TaskUpdate({taskId: task1_id, ...})
```

## Remember

- Read the full plan first (use Read tool)
- Parse all tasks before creating any
- Capture task IDs from TaskCreate
- Build complete dependency graph before execution
- **Export task graph to JSON (durable artifact)**
- Verify with TaskList before handing off
- Stop if circular dependencies detected
- Include full task content in descriptions
- Parse both Files section AND code blocks
- The plan file is the source of truth; JSON is just dependency graph

## Next Steps

After this skill completes:
- **superpowers:task-orchestrated-execution** - Execute the task graph with parallel agents
- **Manual execution** - Use TaskList + Task tool + TaskUpdate yourself
