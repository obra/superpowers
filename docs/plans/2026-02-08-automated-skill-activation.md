# Automated Skill Activation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement automated, persona-based skill activation for OpenCode.

**Architecture:** A hybrid detection system (Prompt + Git-Notes State) will identify the active Amplifier persona and automatically inject relevant Superpowers skills into the system prompt.

**Tech Stack:** JavaScript (ESM), Git Notes, OpenCode Plugin API.

---

### Task 1: Role-Based Tagging

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`

**Step 1: Add `semantic_tags` to frontmatter**
- Brainstorming/Writing-Plans: `semantic_tags: [role:architect]`
- TDD/Subagent-Dev: `semantic_tags: [role:builder]`
- Debugging: `semantic_tags: [role:hunter]`

**Step 2: Commit**
Commit with: "feat: add role-based semantic tags to core skills"

---

### Task 2: Plugin Detection & Injection Logic

**Files:**
- Modify: `.opencode/plugins/superpowers.js`

**Step 1: Integrate Git-Notes State**
Import `getState` from `lib/git-notes-state.js` and `indexSkills` from `lib/index-skills.js`.

**Step 2: Implement Persona Detection**
Logic to check:
1. `last_agent` in `git-notes`.
2. `@mentions` in the current prompt (if available in the hook).

**Step 3: Implement Automated Injection**
- Find skills matching the detected role.
- Append their content to the `system` prompt array in the `transform` hook.

**Step 4: Commit**
Commit with: "feat: implement persona-based automated skill activation"

---

### Task 3: Verification & Edge Cases

**Files:**
- Create: `tests/opencode/test-auto-activation.js`

**Step 1: Mock Persona State**
Write a test that simulates an "Architect" session and verifies that `brainstorming` content is included in the output system prompt.

**Step 2: Verify Priority**
Ensure manually loaded skills via the `skill` tool still take precedence or complement the automated ones.

**Step 3: Commit**
Commit with: "test: add verification for automated skill activation"
