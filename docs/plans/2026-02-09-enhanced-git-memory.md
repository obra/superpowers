# Enhanced Git Memory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the existing git-notes based coordination system into a persistent "Long-Term Project Memory" capable of storing architectural decisions, patterns, and glossary terms.

**Architecture:** Extend the JSON schema in `refs/notes/superpowers` to include a `knowledge_base`. Add CLI tools to efficiently query (recall) and update (memorize) this knowledge without reading the entire state into context.

**Tech Stack:** Node.js, Git Notes, JSON.

---

## Phase 1: Schema & Infrastructure Upgrade

**Objective:** Expand the state schema to support long-term knowledge storage.

### Task 1.1: Schema Expansion
**Files:**
- Modify: `superpowers/lib/state-schema.js`

**Step 1: Update Schema Definition**
Add `knowledge_base` to the `SCHEMA` object:
```javascript
export const SCHEMA = {
    // ... existing keys
    knowledge_base: {
        decisions: 'array',  // for ADRs
        patterns: 'array',   // for reusable code patterns
        glossary: 'object'   // for domain terms
    },
    // ...
};
```

**Step 2: Update Validation Logic**
Enhance `validate()` to check nested keys in `knowledge_base` (similar to how `metadata` is handled).

**Step 3: Verify with Tests**
Create `superpowers/tests/memory/test-schema-expansion.js` to ensure the new schema is enforced correctly.

---

## Phase 2: Memory Tooling (Recall & Memorize)

**Objective:** Create CLI tools for agents to interact with the memory efficiently.

### Task 2.1: Implement `recall` Tool
**Files:**
- Create: `superpowers/lib/memory-ops.js` (core logic)
- Create: `superpowers/commands/recall.js` (CLI wrapper)

**Step 1: Implement `queryMemory(path)`**
In `memory-ops.js`, implement a function that:
1. Calls `getState()` (from `git-notes-state.js`).
2. Traverses the JSON object based on a dot-notation path (e.g., `knowledge_base.decisions`).
3. Returns only the requested fragment to save tokens.

**Step 2: Create CLI Command**
`node superpowers/commands/recall.js --path "knowledge_base.decisions"`

### Task 2.2: Implement `memorize` Tool
**Files:**
- Modify: `superpowers/lib/memory-ops.js`
- Create: `superpowers/commands/memorize.js`

**Step 1: Implement `appendToMemory(section, item)`**
In `memory-ops.js`, implement a function that:
1. Reads current state.
2. Pushes a new item to an array (for `decisions`/`patterns`) or updates a key (for `glossary`).
3. Calls `updateState()` to save back to git notes.

**Step 2: Create CLI Command**
`node superpowers/commands/memorize.js --section "decisions" --value '{"id": "ADR-001", "title": "Use Polly"}'`

---

## Phase 3: Snapshot & Human Readability

**Objective:** Bridge the gap between "Agent Memory" (JSON) and "Human Documentation" (Markdown).

### Task 3.1: Implement `snapshot-memory` Tool
**Files:**
- Create: `superpowers/commands/snapshot-memory.js`

**Step 1: Implement Snapshot Logic**
A script that:
1. Reads the full `knowledge_base` from git notes.
2. Formats it into a readable Markdown file (e.g., `docs/memory/SNAPSHOT.md`).
   - Converts `decisions` array to a list of headers.
   - Converts `glossary` object to a definition list.
3. Writes the file to the repo (without committing, or optionally committing).

---

## Phase 4: Integration & Verification

**Objective:** Ensure agents (Architect) know how to use the new memory tools.

### Task 4.1: Update Skills & Prompts
**Files:**
- Modify: `superpowers/skills/brainstorming/SKILL.md`
- Modify: `.opencode/plugins/superpowers.js`

**Step 1: Update Brainstorming Skill**
Add instructions: "Before proposing a design, use `recall --path knowledge_base.decisions` to review existing architectural constraints."

**Step 2: Update Plugin (Optional)**
Inject a hint about "Project Memory" availability in the system prompt.

### Task 4.2: End-to-End Verification
**Files:**
- Create: `superpowers/tests/memory/test-e2e-memory.js`

**Step 1: Simulate Agent Workflow**
1. Memorize a decision.
2. Recall the decision.
3. Snapshot the memory.
4. Verify the markdown file exists and contains the decision.
