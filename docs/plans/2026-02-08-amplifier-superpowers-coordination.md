# Amplifier and Superpowers Coordination Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement a git-notes backed shared state bridge between Superpowers workflows and Amplifier agents.

**Architecture:** Use `git-notes` (refs/notes/superpowers) as a shared "Global Context" registry. Standardize a JSON schema for role-based findings (architecture, implementation, diagnostics) and enforce a "Read-Before-Respond" protocol for all Amplifier agents.

**Tech Stack:** Node.js, Git, JSON Schema.

---

### Task 1: State Schema and Validation

**Files:**
- Create: `lib/state-schema.js`
- Modify: `lib/git-notes-state.js`

**Step 1: Write the failing test**
Create `tests/coordination/test-schema-validation.js`. Verify that malformed or non-compliant JSON is rejected.

**Step 2: Implement `lib/state-schema.js`**
Define the standard schema:
```json
{
  "architecture": {},
  "implementation": {},
  "diagnostics": {},
  "registry": {},
  "metadata": { "last_agent": "string", "timestamp": "string" }
}
```

**Step 3: Update `updateState` in `lib/git-notes-state.js`**
Add a validation step before writing to git notes. Implement a recursive merge strategy to prevent data loss during concurrent updates.

**Step 4: Run tests and verify**

**Step 5: Commit**

---

### Task 2: Amplifier Agent Protocol Integration

**Files:**
- Modify: `opencode_assets/agents/zen-architect.md`
- Modify: `opencode_assets/agents/modular-builder.md`
- Modify: `opencode_assets/agents/bug-hunter.md`
- Modify: `opencode_assets/skills/superpowers-bridge.md`

**Step 1: Inject "Read-Before-Respond" Protocol**
Add a mandatory instruction to each agent:
*"CRITICAL: Before any task, run `git notes --ref superpowers show` to sync with the Global Context. Use these findings to guide your logic."*

**Step 2: Add "Finding-Capture" Instructions**
Instruct agents on how to format their findings for the `implementation` or `architecture` blocks.

**Step 3: Update Bridge Documentation**
Formally document the schema and protocol in `superpowers-bridge.md`.

**Step 4: Commit**

---

### Task 3: Coordination CLI Tool (`record-finding`)

**Files:**
- Create: `commands/record-finding.js` (or add to existing CLI)

**Step 1: Implement `record-finding` command**
A simple CLI wrapper that allows agents to record a finding without writing raw JSON:
`superpowers record-finding --role architecture --key "schema" --value "{...}"`

**Step 2: Implement `sync-context` command**
A command to fetch and merge git notes from origin to ensure cross-worktree consistency.

**Step 3: Verify with an e-2-e test scenario**

**Step 4: Commit**
