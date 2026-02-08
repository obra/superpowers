# OpenCode Workflow Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement a reactive, high-density visualization dashboard optimized for OpenCode, showing the Agent/Worktree network and findings pulse.

**Architecture:** A utility will extract state from `git-notes` and `git worktree`, then generate a combined Markdown Status Board (Table) and Mermaid Network Map.

**Tech Stack:** Node.js, Git, Mermaid.js (Markdown).

---

### Task 1: Visualization Utility

**Files:**
- Create: `lib/visualize-workflow.js`

**Step 1: Write the failing test**
Create `tests/coordination/test-visualization.js`. Mock the `git-notes` and `worktree` output and verify the generated Markdown contains both a table and a `mermaid` block.

**Step 2: Implement `lib/visualize-workflow.js`**
- `getWorktrees()`: Parses `git worktree list`.
- `generateMermaid()`: Creates the graph based on agents and worktrees.
- `generateTable()`: Creates the status pulse table.
- `generateDashboard()`: Combines both into a single Markdown block.

**Step 3: Run tests and verify**

**Step 4: Commit**
Commit with: "feat: add visualization utility for OpenCode dashboard"

---

### Task 2: CLI and Integration

**Files:**
- Create: `commands/visualize.js`
- Modify: `skills/subagent-driven-development/SKILL.md`

**Step 1: Create `commands/visualize.js`**
A simple entry point that prints the dashboard to stdout.

**Step 2: Update Subagent Workflow**
Inject the visualization step into the `subagent-driven-development` process.
- After `Update findings in git notes`, add a step: `Visualize session state (superpowers visualize)`.
- Update the DOT flowchart to include this visual feedback loop.

**Step 3: Verify in a real worktree**
Run the command manually in an active feature branch and verify output.

**Step 4: Commit**
Commit with: "feat: integrate reactive dashboard into subagent workflow"
