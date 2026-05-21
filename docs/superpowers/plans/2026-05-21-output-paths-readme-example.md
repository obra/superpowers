# Output Paths README Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document how users can override Superpowers' default spec and plan output paths from their agent instruction file.

**Architecture:** This is a README-only documentation fix plus a static README regression check. It deliberately avoids editing behavior-shaping skill text because the maintainer comment on #939 asked for a README example, and the closed prior PR #1020 bundled skill edits without eval evidence.

**Tech Stack:** Markdown, Bash static grep test.

---

### Task 1: Add RED README Static Test

**Files:**
- Create: `tests/docs/test-readme-output-paths.sh`
- Read: `README.md`

- [ ] **Step 1: Create the static test**

Create `tests/docs/test-readme-output-paths.sh` with assertions that `README.md` contains:

```text
## Customizing Output Paths
## Output Paths
| Design specs | `docs/design-docs/` |
| Execution plans (active) | `docs/exec-plans/active/` |
Design specs MUST be saved to `docs/design-docs/`, NOT `docs/superpowers/specs/`.
Execution plans MUST be saved to `docs/exec-plans/active/`, NOT `docs/superpowers/plans/`.
```

- [ ] **Step 2: Run the test before editing README**

Run:

```bash
bash tests/docs/test-readme-output-paths.sh
```

Expected: fails because README does not yet contain the override example.

### Task 2: Add README Example

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a short section after Basic Workflow**

Add a `## Customizing Output Paths` section that explains:

- Superpowers defaults to `docs/superpowers/specs/` and `docs/superpowers/plans/`.
- Users can override those paths in their project agent instruction file.
- For Claude Code the file is `CLAUDE.md`; Codex users can use `AGENTS.md`; Gemini users can use `GEMINI.md`.
- The override should include both the table and explicit imperative instruction from the #939 workaround.

- [ ] **Step 2: Keep the example concrete**

Use this fenced Markdown example:

```markdown
## Output Paths

| Artifact | Location |
|---|---|
| Design specs | `docs/design-docs/` |
| Execution plans (active) | `docs/exec-plans/active/` |

**IMPORTANT: Design specs MUST be saved to `docs/design-docs/`, NOT `docs/superpowers/specs/`. Execution plans MUST be saved to `docs/exec-plans/active/`, NOT `docs/superpowers/plans/`.**
```

### Task 3: Verify

**Files:**
- Test: `tests/docs/test-readme-output-paths.sh`

- [ ] **Step 1: Run the README static test**

Run:

```bash
bash tests/docs/test-readme-output-paths.sh
```

Expected: `STATUS: PASSED`.

- [ ] **Step 2: Run syntax and whitespace checks**

Run:

```bash
bash -n tests/docs/test-readme-output-paths.sh
git diff --check
```

Expected: no output.
