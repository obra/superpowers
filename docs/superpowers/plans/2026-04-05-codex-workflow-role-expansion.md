# Codex Workflow Role Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Superpowers' native Codex role catalog so implementation,
exploration, and verification work can use first-class `superpowers_*` roles in
addition to the existing reviewer roles.

**Architecture:** Add three new role TOMLs under `.codex/agents/`, then update
Codex-facing skills and docs to prefer those roles where they match the
workflow. Finish by expanding fast and integration tests so the larger role
catalog is both documented and exercised.

**Tech Stack:** TOML role files, Markdown docs, existing Codex shell tests

---

### Task 1: Add native Codex workflow roles

**Files:**
- Create: `.codex/agents/superpowers_implementer.toml`
- Create: `.codex/agents/superpowers_explorer.toml`
- Create: `.codex/agents/superpowers_verifier.toml`
- Test: `tests/codex/test-native-agent-catalog.sh`

- [ ] **Step 1: Add the new role files**

```toml
name = "superpowers_implementer"
sandbox_mode = "workspace-write"
```

```toml
name = "superpowers_explorer"
sandbox_mode = "read-only"
```

```toml
name = "superpowers_verifier"
sandbox_mode = "workspace-write"
```

- [ ] **Step 2: Write the catalog test**

Run a fast Codex check that asks the CLI to list available `spawn_agent` role
names beginning with `superpowers_` and verify the new roles appear alongside
the existing reviewer roles.

- [ ] **Step 3: Run the catalog test**

Run: `bash tests/codex/test-native-agent-catalog.sh`
Expected: PASS, with Codex exposing the full native Superpowers role catalog

### Task 2: Update Codex-facing workflow guidance

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `.codex/INSTALL.md`
- Modify: `docs/README.codex.md`
- Modify: `tests/codex/README.md`

- [ ] **Step 1: Rewrite the role catalog and dispatch guidance**

Document the expanded native role set and make the preferred mapping explicit:

```md
- implementer -> `superpowers_implementer`
- spec compliance reviewer -> `superpowers_spec_reviewer`
- code quality reviewer -> `superpowers_reviewer`
- focused repository exploration -> `superpowers_explorer`
- verification/test-only subagent -> `superpowers_verifier`
```

- [ ] **Step 2: Preserve clear fallback behavior**

Document that:

- reviewer-style prompt fallbacks still use `worker` or `default`
- implementation falls back to built-in `worker`
- focused exploration falls back to built-in `explorer`

- [ ] **Step 3: Refresh install and troubleshooting docs**

Ensure the Codex docs describe the role catalog as native workflow roles instead
of reviewer-only roles and mention the new role names in the verification
section.

### Task 3: Update semantic and integration tests

**Files:**
- Create: `tests/codex/test-native-agent-catalog.sh`
- Modify: `tests/codex/run-skill-tests.sh`
- Modify: `tests/codex/test-subagent-driven-development.sh`
- Modify: `tests/codex/test-subagent-driven-development-integration.sh`

- [ ] **Step 1: Update the semantic workflow assertion**

Change the fast `subagent-driven-development` Codex mapping test so it expects:

- implementer -> `superpowers_implementer`
- reviewers -> native reviewer roles
- built-in roles only as fallback when a matching native role is unavailable

- [ ] **Step 2: Update the real integration assertion**

Use session metadata to require native workflow-role evidence:

```bash
"agent_role":"superpowers_implementer"
"agent_role":"superpowers_spec_reviewer"
"agent_role":"superpowers_reviewer"
```

- [ ] **Step 3: Run the fast Codex suite**

Run: `bash tests/codex/run-skill-tests.sh`
Expected: PASS

- [ ] **Step 4: Run the integration test**

Run: `bash tests/codex/run-skill-tests.sh --test test-subagent-driven-development-integration.sh --integration`
Expected: PASS, including native implementer evidence in session metadata
