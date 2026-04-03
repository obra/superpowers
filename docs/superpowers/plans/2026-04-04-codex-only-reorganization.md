# Codex-Only Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize this repository into a Codex-only fork that preserves the Superpowers workflow philosophy while making the product, skills, docs, and validation model natively Codex-first.

**Architecture:** Rework the repository in five layers: canonical entry points, Codex-native core skills, Codex-native supporting skills, Codex-only docs and validation, then legacy artifact removal. Lock the product identity first, then rewrite the behavior-shaping files, then delete the obsolete surface.

**Tech Stack:** Markdown, shell scripts, Git, Codex AGENTS.md + skills conventions

**Spec:** `docs/superpowers/specs/2026-04-04-codex-only-reorganization-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `AGENTS.md` | Canonical repo instructions for Codex | Replace symlink with real file |
| `CLAUDE.md` | Legacy upstream instruction file | Delete |
| `README.md` | Product overview and install entry | Rewrite for Codex-only |
| `.codex/INSTALL.md` | Short install bootstrap | Rewrite |
| `docs/README.codex.md` | Detailed Codex guide | Rewrite |
| `package.json` | Repo metadata | Remove stale OpenCode entrypoint |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report form | Rewrite for Codex CLI/App |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR requirements | Rewrite for Codex-only terminology |
| `skills/using-superpowers/SKILL.md` | Core Codex operating contract | Rewrite |
| `skills/using-superpowers/references/codex-conventions.md` | Codex-only workflow reference | Create |
| `skills/using-superpowers/references/codex-tools.md` | Claude-to-Codex mapping file | Delete |
| `skills/using-superpowers/references/copilot-tools.md` | Non-Codex mapping file | Delete |
| `skills/using-superpowers/references/gemini-tools.md` | Non-Codex mapping file | Delete |
| `skills/requesting-code-review/SKILL.md` | Code review workflow | Rewrite |
| `agents/code-reviewer.md` | Reviewer prompt | Rewrite |
| `skills/subagent-driven-development/SKILL.md` | Main multi-agent execution workflow | Rewrite |
| `skills/subagent-driven-development/*.md` | Implementer/reviewer prompts | Rewrite |
| `skills/executing-plans/SKILL.md` | Inline execution fallback | Rewrite |
| `skills/writing-skills/SKILL.md` | Meta-skill for authoring | Rewrite |
| `skills/writing-skills/codex-best-practices.md` | Codex-native skill authoring reference | Create |
| `skills/writing-skills/anthropic-best-practices.md` | Claude-specific authoring reference | Delete |
| `skills/writing-skills/examples/CLAUDE_MD_TESTING.md` | Claude-specific example | Delete |
| `skills/writing-skills/persuasion-principles.md` | Meta guidance | Patch `TodoWrite` references |
| `skills/brainstorming/visual-companion.md` | Browser companion guidance | Rewrite for Codex CLI first |
| `skills/writing-plans/SKILL.md` | Planning workflow | Patch Codex-native wording |
| `skills/using-git-worktrees/SKILL.md` | Isolation workflow | Patch CLI-first/App-secondary notes |
| `skills/finishing-a-development-branch/SKILL.md` | Finish workflow | Patch CLI-first/App-secondary notes |
| `skills/dispatching-parallel-agents/SKILL.md` | Parallel-agent guidance | Patch Codex-native wording |
| `skills/receiving-code-review/SKILL.md` | Review response workflow | Patch legacy terms |
| `skills/verification-before-completion/SKILL.md` | Verification workflow | Patch legacy terms |
| `skills/systematic-debugging/SKILL.md` | Debugging workflow | Patch legacy terms |
| `skills/test-driven-development/SKILL.md` | TDD workflow | Patch legacy terms |
| `docs/testing.md` | Validation guide | Rewrite for Codex-only checks |
| `scripts/validate-codex-only.sh` | Top-level validation runner | Create |
| `tests/codex/test-repo-surface.sh` | Repo surface validation | Create |
| `tests/codex/test-forbidden-terms.sh` | Legacy-term validation | Create |
| `tests/codex/test-doc-consistency.sh` | Codex doc consistency validation | Create |
| `commands/*.md` | Deprecated command shims | Delete |
| `docs/README.opencode.md` | OpenCode install guide | Delete |
| `docs/windows/polyglot-hooks.md` | Claude hook documentation | Delete |
| `docs/plans/2025-11-22-opencode-support-*.md` | OpenCode historical docs | Delete |
| `tests/claude-code/` | Claude integration tests | Delete |
| `tests/explicit-skill-requests/` | Claude prompt tests | Delete |
| `tests/opencode/` | OpenCode tests | Delete |
| `tests/skill-triggering/` | Legacy skill-trigger tests | Delete |
| `tests/subagent-driven-dev/` | Legacy harness-specific tests | Delete |
| `.claude-plugin/` | Claude plugin package | Delete |
| `.cursor-plugin/` | Cursor plugin package | Delete |
| `.opencode/` | OpenCode package/install files | Delete |
| `hooks/` | Multi-platform hook layer | Delete |
| `GEMINI.md` | Gemini integration file | Delete |
| `gemini-extension.json` | Gemini extension manifest | Delete |

---

### Task 1: Make `AGENTS.md` Canonical and Remove the Claude Root

**Files:**
- Create: `AGENTS.md` (real file, not symlink)
- Delete: `CLAUDE.md`
- Modify: `package.json`
- Modify: `.github/ISSUE_TEMPLATE/bug_report.md`
- Modify: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Verify the current root instruction setup**

Run:

```bash
ls -l AGENTS.md CLAUDE.md
```

Expected:

- `AGENTS.md` is a symlink to `CLAUDE.md`
- `CLAUDE.md` is a real file

- [ ] **Step 2: Remove the symlink and create a real `AGENTS.md`**

Run:

```bash
rm AGENTS.md
```

Create `AGENTS.md` with exactly this content:

```markdown
# Codex-Only Superpowers

## Product Definition

- This repository is a Codex-only fork of Superpowers.
- Codex CLI is the primary target surface.
- Codex App compatibility is secondary and should not distort the main workflow.

## Operating Rules

- Use Codex-native terminology in all docs, skills, prompts, and tests.
- Prefer `AGENTS.md`, native skill discovery, `update_plan`, `spawn_agent`, and Codex shell/file tools over translated Claude concepts.
- Do not describe Codex behavior through `Task tool`, `TodoWrite`, or `Skill tool` mappings.

## Workflow Priority

- Preserve the Superpowers workflow philosophy: brainstorming, specs, plans, isolated execution, review, verification, finish.
- Rewrite implementation language and repository structure to feel natively Codex-first.
- Remove active non-Codex product surface rather than maintaining compatibility layers.

## Validation

- Run the Codex-only validation scripts before claiming this reorganization is complete.
- Treat lingering references to Claude Code, Cursor, OpenCode, Gemini, Copilot, `Task tool`, `TodoWrite`, or `Skill tool` as bugs unless intentionally preserved in archived history.
```

- [ ] **Step 3: Delete `CLAUDE.md` and confirm `AGENTS.md` is now authoritative**

Run:

```bash
rm CLAUDE.md
test -L AGENTS.md; echo $?
```

Expected:

- `AGENTS.md` still exists
- `test -L AGENTS.md` prints `1`

- [ ] **Step 4: Replace `package.json` with Codex-neutral metadata**

Replace the file contents with:

```json
{
  "name": "superpowers-codex",
  "version": "5.0.7",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 5: Rewrite the bug report template for Codex surfaces**

In `.github/ISSUE_TEMPLATE/bug_report.md`, replace the environment table with:

```markdown
## Environment

| Field | Value |
|-------|-------|
| Superpowers version | |
| Codex surface (`CLI` or `App`) | |
| Codex version | |
| Model | |
| OS + shell | |
```

Replace the "platform issue" checkbox block intro with:

```markdown
## Is this a Superpowers issue or a Codex issue?
<!-- If the behavior reproduces without Superpowers loaded, treat it as a
     Codex or model issue instead of a Superpowers bug. -->
```

- [ ] **Step 6: Rewrite the PR template environment section**

In `.github/PULL_REQUEST_TEMPLATE.md`, replace:

```markdown
## Environment tested

| Harness (e.g. Claude Code, Cursor) | Harness version | Model | Model version/ID |
|-------------------------------------|-----------------|-------|------------------|
|                                     |                 |       |                  |
```

with:

```markdown
## Environment tested

| Codex surface (`CLI` or `App`) | Codex version | Model | Model version/ID |
|--------------------------------|---------------|-------|------------------|
|                                |               |       |                  |
```

Also replace all remaining `Harness` wording in that file with `Codex surface`.

- [ ] **Step 7: Verify no Claude-root references remain in the updated root files**

Run:

```bash
rg -n 'CLAUDE.md|Claude Code|Harness' AGENTS.md package.json .github/ISSUE_TEMPLATE/bug_report.md .github/PULL_REQUEST_TEMPLATE.md
```

Expected:

- no matches

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md package.json .github/ISSUE_TEMPLATE/bug_report.md .github/PULL_REQUEST_TEMPLATE.md
git rm CLAUDE.md
git commit -m "refactor: make AGENTS canonical for Codex-only fork"
```

---

### Task 2: Rewrite the Public Codex Documentation Surface

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `.codex/INSTALL.md`

- [ ] **Step 1: Replace `README.md` with a Codex-only overview**

Replace the full file with:

```markdown
# Superpowers for Codex

Superpowers is a Codex-native workflow layer that turns repeatable software work into explicit skills, specs, plans, review loops, and verification steps.

This fork is intentionally Codex-only. It preserves the original Superpowers workflow philosophy while rewriting the product surface for OpenAI Codex.

## Why This Fork Exists

Upstream Superpowers evolved as a cross-platform project with heavy Claude Code assumptions. This fork removes the translation layer and speaks to Codex directly.

## Installation

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

For manual installation and troubleshooting, see `docs/README.codex.md`.

## Workflow

1. `brainstorming` turns an idea into an approved design.
2. `writing-plans` turns the design into a detailed implementation plan.
3. `using-git-worktrees` isolates the work when needed.
4. `subagent-driven-development` or `executing-plans` carries out the plan.
5. `requesting-code-review` and `verification-before-completion` keep quality gates explicit.
6. `finishing-a-development-branch` closes the loop.

## Skill Library

- Planning: `brainstorming`, `writing-plans`, `executing-plans`
- Execution: `subagent-driven-development`, `dispatching-parallel-agents`
- Quality: `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- Engineering discipline: `test-driven-development`, `systematic-debugging`
- Git isolation: `using-git-worktrees`, `finishing-a-development-branch`
- Meta: `using-superpowers`, `writing-skills`

## Validation

Run the Codex-only checks described in `docs/testing.md` before considering the reorganization complete.

## Contributing

This fork accepts Codex-first improvements only. If a change exists only to support another platform, it does not belong in this repository.

## License

MIT License. See `LICENSE`.
```

- [ ] **Step 2: Replace `docs/README.codex.md` with the detailed guide**

Replace the full file with:

```markdown
# Superpowers for Codex

This guide explains how to install and use the Codex-only Superpowers fork.

## Quick Install

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Install

### Prerequisites

- Codex CLI
- Git

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Make the skills visible to Codex:

   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

## How It Works

- Codex reads `AGENTS.md` for repository instructions.
- Codex discovers skills from `.agents/skills` and repository skill folders.
- Superpowers adds workflow discipline on top of Codex-native skills and multi-agent tools.

## Codex CLI vs Codex App

- CLI is the primary supported surface in this fork.
- App compatibility is best-effort and intentionally secondary.
- If a workflow behaves differently in App, prefer the CLI interpretation unless a skill explicitly documents the App caveat.

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm -rf ~/.codex/superpowers
```

## Troubleshooting

### Skills do not appear

```bash
ls -la ~/.agents/skills/superpowers
ls ~/.codex/superpowers/skills
```

### Instructions look stale

Restart Codex. `AGENTS.md` and skill discovery are evaluated when a session starts.

## Validation

See `docs/testing.md` for the Codex-only validation steps.
```

- [ ] **Step 3: Replace `.codex/INSTALL.md` with a short bootstrap file**

Replace the full file with:

```markdown
# Installing Superpowers for Codex

Install the Codex-only Superpowers fork by cloning it locally and exposing the skills to Codex.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Link the skills into Codex's user skill directory:

   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

## Verify

```bash
ls -la ~/.agents/skills/superpowers
```

Expected: a symlink pointing at `~/.codex/superpowers/skills`
```

- [ ] **Step 4: Verify the docs are Codex-only**

Run:

```bash
rg -n 'Claude Code|Cursor|OpenCode|Gemini|Copilot|/plugin|/add-plugin|marketplace' README.md docs/README.codex.md .codex/INSTALL.md
```

Expected:

- no matches

- [ ] **Step 5: Commit**

```bash
git add README.md docs/README.codex.md .codex/INSTALL.md
git commit -m "docs: rewrite public docs for Codex-only fork"
```

---

### Task 3: Rewrite `using-superpowers` as a Codex-Native Operating Contract

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`
- Create: `skills/using-superpowers/references/codex-conventions.md`
- Delete: `skills/using-superpowers/references/codex-tools.md`
- Delete: `skills/using-superpowers/references/copilot-tools.md`
- Delete: `skills/using-superpowers/references/gemini-tools.md`

- [ ] **Step 1: Replace `skills/using-superpowers/SKILL.md`**

Replace the full file with:

```markdown
---
name: using-superpowers
description: Use when starting any conversation in this repository to enforce Codex-native skill usage before any response or action
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If there is even a small chance a skill applies, you must use it.
</EXTREMELY-IMPORTANT>

## Instruction Priority

1. User instructions
2. Repository `AGENTS.md`
3. Relevant Superpowers skills
4. Default Codex behavior

## Codex-Native Rule

Do not translate from another platform's tool model.

Use Codex-native mechanisms directly:

- native skill discovery and explicit skill mention
- `update_plan` for checklist tracking
- `spawn_agent` for delegated work
- native file and shell tools for editing and verification

## Required Behavior

- Check for relevant skills before responding or acting.
- Use process skills first when they determine how the task should be approached.
- Follow the chosen skill exactly unless user instructions override it.
- Treat "this seems simple" as a red flag, not an exception.

## Skill Priority

1. Process skills such as brainstorming and debugging
2. Execution and workflow skills such as writing-plans or subagent-driven-development
3. Domain-specific or support skills

## Checklist Tracking

If a skill has a checklist, create one `update_plan` item per checklist item before proceeding.

## Reference

If you need extra repository-specific Codex guidance, read `references/codex-conventions.md`.
```

- [ ] **Step 2: Create `skills/using-superpowers/references/codex-conventions.md`**

Create the file with:

```markdown
# Codex Conventions for Superpowers

## Canonical Concepts

- Repository instructions come from `AGENTS.md`
- Skills are discovered natively by Codex
- Checklist tracking uses `update_plan`
- Delegated work uses `spawn_agent`

## CLI-First Rules

- Prefer Codex CLI behavior when a workflow differs between CLI and App
- Keep App notes short and isolated
- Do not make App UI concepts the main control flow for a core skill

## Review and Verification

- Prefer Codex-native review flows and explicit validation commands
- Treat lingering references to translated Claude concepts as repository bugs
```

- [ ] **Step 3: Delete the old cross-platform reference files**

Run:

```bash
git rm skills/using-superpowers/references/codex-tools.md
git rm skills/using-superpowers/references/copilot-tools.md
git rm skills/using-superpowers/references/gemini-tools.md
```

- [ ] **Step 4: Verify the rewritten skill has no legacy terms**

Run:

```bash
rg -n 'Claude Code|Copilot|Gemini|OpenCode|Skill tool|Task tool|TodoWrite' skills/using-superpowers
```

Expected:

- no matches

- [ ] **Step 5: Commit**

```bash
git add skills/using-superpowers/SKILL.md skills/using-superpowers/references/codex-conventions.md
git commit -m "refactor: rewrite using-superpowers for Codex-native behavior"
```

---

### Task 4: Rewrite the Core Execution and Review Skills

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `agents/code-reviewer.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Replace `skills/requesting-code-review/SKILL.md`**

Replace the full file with:

```markdown
---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Use a dedicated Codex reviewer agent to catch issues before they compound.

## When to Request Review

- After each task in subagent-driven development
- After completing a major feature
- Before merge or branch handoff
- When stuck and a fresh technical read would help

## How to Request Review

1. Read `agents/code-reviewer.md`
2. Substitute the task-specific scope, requirements, and diff range
3. Spawn a reviewer agent with the filled prompt
4. Wait for the reviewer result
5. Fix blocking issues before moving on

## Diff Range

```bash
BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

Use `origin/main` or another explicit base when the review should cover more than the last commit.

## Quality Bar

- Fix critical issues immediately
- Fix important issues before continuing
- Document why you disagree if you reject review feedback
- Do not skip review because the change feels small
```

- [ ] **Step 2: Replace `agents/code-reviewer.md`**

Replace the full file with:

```markdown
# Codex Code Reviewer

Review the requested change set for behavioral regressions, missing tests, integration risks, and mismatches against the stated requirements.

## Inputs

- What was implemented
- What it was supposed to do
- The base SHA
- The head SHA
- Any extra review focus areas

## Required Output

### Findings

- Order findings by severity
- Include file paths
- Explain why the issue matters

### Open Questions

- List any ambiguities or assumptions that block a confident approval

### Summary

- State whether the change is ready to proceed

Do not pad the output. Prefer concise, high-signal review feedback.
```

- [ ] **Step 3: Rewrite the `subagent-driven-development` skill to use Codex-native mechanics**

In `skills/subagent-driven-development/SKILL.md`, make these exact structural changes:

1. Replace every `TodoWrite` reference with `update_plan`
2. Replace every `Task tool` reference with `spawn_agent`
3. Replace every "named subagent type" instruction with built-in Codex roles (`worker`, `explorer`, or a project-defined role if one exists)
4. Replace the opening Overview paragraph with:

```markdown
Execute a plan by dispatching a fresh Codex agent per task, then run two review stages after each task: spec compliance first, code quality second.

**Why subagents:** Fresh Codex agents keep task context narrow, preserve the coordinator's context window, and make review loops more reliable.
```

5. Replace the "Prompt Templates" section with:

```markdown
## Prompt Templates

- `implementer-prompt.md` - worker prompt for implementation
- `spec-reviewer-prompt.md` - worker prompt for spec compliance review
- `code-quality-reviewer-prompt.md` - worker prompt for code quality review

Read the template, substitute the task-specific values, and pass the final text directly to `spawn_agent`.
```

6. Update the example workflow so the coordinator says `update_plan` instead of `Create TodoWrite`, and "spawn reviewer agent" instead of "dispatch Task tool"

- [ ] **Step 4: Replace the three subagent prompt template files with plain prompt bodies**

Replace `skills/subagent-driven-development/implementer-prompt.md` with:

```markdown
# Implementer Prompt

You are implementing one task from a pre-written plan.

Read the task text provided by the coordinator, implement only that scope, run the specified verification steps, and report one of:

- DONE
- DONE_WITH_CONCERNS
- NEEDS_CONTEXT
- BLOCKED

Do not expand scope. Do not silently skip required verification.
```

Replace `skills/subagent-driven-development/spec-reviewer-prompt.md` with:

```markdown
# Spec Reviewer Prompt

Review whether the implementation exactly matches the assigned task and spec.

Look for:

- missing requested behavior
- extra unrequested behavior
- mismatches between the written task and the implementation

Return either:

- ✅ Spec compliant
- ❌ Issues found
```

Replace `skills/subagent-driven-development/code-quality-reviewer-prompt.md` with:

```markdown
# Code Quality Reviewer Prompt

Review the implementation for correctness risks, maintainability issues, and missing tests after spec compliance has already passed.

Focus on:

- bugs and regressions
- weak validation against stated contracts
- missing tests
- avoidable complexity

Return findings ordered by severity, then a short approval decision.
```

- [ ] **Step 5: Patch `skills/executing-plans/SKILL.md` to make Codex the default execution model**

Make these exact replacements:

1. Replace any wording like "platform with subagent support (such as Claude Code or Codex)" with:

```markdown
If Codex multi-agent support is available, prefer `superpowers:subagent-driven-development`. Use this skill when you intentionally want inline execution with checkpoints.
```

2. Replace every `TodoWrite` reference with `update_plan`

3. Replace every legacy platform comparison with Codex-native wording

- [ ] **Step 6: Verify the core execution files no longer use translated Claude tooling**

Run:

```bash
rg -n 'Task tool|TodoWrite|Skill tool|Claude Code|general-purpose subagent' \
  skills/requesting-code-review/SKILL.md \
  skills/subagent-driven-development \
  skills/executing-plans/SKILL.md \
  agents/code-reviewer.md
```

Expected:

- no matches

- [ ] **Step 7: Commit**

```bash
git add skills/requesting-code-review/SKILL.md agents/code-reviewer.md skills/subagent-driven-development skills/executing-plans/SKILL.md
git commit -m "refactor: rewrite core execution skills for Codex-native workflows"
```

---

### Task 5: Rewrite the Meta-Skill Layer for Codex

**Files:**
- Modify: `skills/writing-skills/SKILL.md`
- Create: `skills/writing-skills/codex-best-practices.md`
- Modify: `skills/writing-skills/persuasion-principles.md`
- Delete: `skills/writing-skills/anthropic-best-practices.md`
- Delete: `skills/writing-skills/examples/CLAUDE_MD_TESTING.md`

- [ ] **Step 1: Rewrite the opening of `skills/writing-skills/SKILL.md`**

Make these exact replacements in the file:

1. Replace:

```markdown
**Personal skills live in agent-specific directories (`~/.claude/skills` for Claude Code, `~/.agents/skills/` for Codex)**
```

with:

```markdown
**Personal skills live in Codex skill directories such as `~/.agents/skills/` or repo-local `.agents/skills/`.**
```

2. Replace:

```markdown
A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future Claude instances find and apply effective approaches.
```

with:

```markdown
A **skill** is a reusable workflow package for Codex. Skills help future Codex sessions find and apply effective approaches consistently.
```

3. Rename the section heading:

```markdown
## Claude Search Optimization (CSO)
```

to:

```markdown
## Codex Skill Discovery
```

4. Replace every `Claude` occurrence in the file with `Codex` when referring to the future agent reader, except inside quoted historical examples that are being deleted in this task

- [ ] **Step 2: Create a Codex-native best-practices reference**

Create `skills/writing-skills/codex-best-practices.md` with:

```markdown
# Codex Skill Best Practices

## Core Rules

- Keep each skill focused on one job
- Write the description around trigger conditions, not workflow summaries
- Prefer Codex-native terminology
- Use supporting reference files only when they improve clarity or reduce context load

## Discovery

- `name` should be concrete and searchable
- `description` should describe when to use the skill
- Avoid vague descriptions that summarize the workflow but hide the trigger

## Context

- Assume Codex reads `AGENTS.md` and skill metadata before loading the full skill
- Keep frequently-loaded skills short and explicit
- Move heavy reference material into separate files
```

- [ ] **Step 3: Patch `persuasion-principles.md`**

Replace both `TodoWrite` references with `update_plan` and replace any `Claude` references that describe the future executing agent with `Codex`.

- [ ] **Step 4: Delete the non-Codex authoring references**

Run:

```bash
git rm skills/writing-skills/anthropic-best-practices.md
git rm skills/writing-skills/examples/CLAUDE_MD_TESTING.md
```

- [ ] **Step 5: Verify the writing-skills package is Codex-native**

Run:

```bash
rg -n 'Anthropic|Claude|~/.claude|TodoWrite' skills/writing-skills
```

Expected:

- matches only in files intentionally kept for historical reasons
- no matches in `skills/writing-skills/SKILL.md`, `skills/writing-skills/codex-best-practices.md`, or `skills/writing-skills/persuasion-principles.md`

- [ ] **Step 6: Commit**

```bash
git add skills/writing-skills/SKILL.md skills/writing-skills/codex-best-practices.md skills/writing-skills/persuasion-principles.md
git commit -m "refactor: rewrite writing-skills for Codex-native authoring"
```

---

### Task 6: Patch the Remaining Workflow Skills for Codex CLI First

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/using-git-worktrees/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/receiving-code-review/SKILL.md`
- Modify: `skills/verification-before-completion/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`

- [ ] **Step 1: Rewrite the platform-launch section in `visual-companion.md`**

Delete the separate sections for:

- Claude Code (macOS / Linux)
- Claude Code (Windows)
- Gemini CLI
- Other environments

Replace them with:

```markdown
**Codex CLI (primary):**

```bash
scripts/start-server.sh --project-dir /path/to/project
```

Run the server from Codex CLI and keep the returned `screen_dir` and `state_dir` for follow-up turns.

**Codex App (secondary compatibility):**

If the App environment constrains background process behavior, fall back to the same workflow philosophy: start the server in the simplest supported way, read the event/state files on the next turn, and keep browser use optional rather than mandatory.
```
```

- [ ] **Step 2: Patch `skills/writing-plans/SKILL.md`**

Make these exact replacements:

1. Replace:

```markdown
**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."
```

with:

```markdown
**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."
```

Leave the line as-is.

2. Replace the "Context" line with:

```markdown
**Context:** This plan is for a Codex-first repository. Assume Codex CLI is the primary execution surface unless the task explicitly calls out an App caveat.
```

3. Replace the "Execution Handoff" options text with:

```markdown
**1. Subagent-Driven (recommended)** - Spawn a fresh Codex agent per task and review between tasks

**2. Inline Execution** - Execute tasks in this session with checkpoints
```

- [ ] **Step 3: Patch the git/worktree skills for CLI-first wording**

In both `skills/using-git-worktrees/SKILL.md` and `skills/finishing-a-development-branch/SKILL.md`:

1. Keep the core flow CLI-first
2. Move any Codex App caveat into a short subsection titled `## Codex App Note`
3. Remove references that compare Codex to Claude

- [ ] **Step 4: Patch the remaining support skills for legacy terms**

Run:

```bash
rg -n 'Claude Code|Claude|TodoWrite|Task tool|Skill tool|OpenCode|Cursor|Gemini|Copilot' \
  skills/dispatching-parallel-agents/SKILL.md \
  skills/receiving-code-review/SKILL.md \
  skills/verification-before-completion/SKILL.md \
  skills/systematic-debugging/SKILL.md \
  skills/test-driven-development/SKILL.md
```

For each match:

- replace platform-neutral future-agent references with `Codex`
- replace `TodoWrite` with `update_plan`
- remove any non-Codex product comparisons

- [ ] **Step 5: Verify the patched workflow skills are Codex-clean**

Run:

```bash
rg -n 'Claude Code|OpenCode|Cursor|Gemini|Copilot|TodoWrite|Task tool|Skill tool' \
  skills/brainstorming/visual-companion.md \
  skills/writing-plans/SKILL.md \
  skills/using-git-worktrees/SKILL.md \
  skills/finishing-a-development-branch/SKILL.md \
  skills/dispatching-parallel-agents/SKILL.md \
  skills/receiving-code-review/SKILL.md \
  skills/verification-before-completion/SKILL.md \
  skills/systematic-debugging/SKILL.md \
  skills/test-driven-development/SKILL.md
```

Expected:

- no matches

- [ ] **Step 6: Commit**

```bash
git add skills/brainstorming/visual-companion.md skills/writing-plans/SKILL.md skills/using-git-worktrees/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/dispatching-parallel-agents/SKILL.md skills/receiving-code-review/SKILL.md skills/verification-before-completion/SKILL.md skills/systematic-debugging/SKILL.md skills/test-driven-development/SKILL.md
git commit -m "refactor: patch supporting workflow skills for Codex CLI first"
```

---

### Task 7: Replace the Validation Layer and Remove the Legacy Surface

**Files:**
- Modify: `docs/testing.md`
- Create: `scripts/validate-codex-only.sh`
- Create: `tests/codex/test-repo-surface.sh`
- Create: `tests/codex/test-forbidden-terms.sh`
- Create: `tests/codex/test-doc-consistency.sh`
- Delete: `commands/brainstorm.md`
- Delete: `commands/write-plan.md`
- Delete: `commands/execute-plan.md`
- Delete: `docs/README.opencode.md`
- Delete: `docs/windows/polyglot-hooks.md`
- Delete: `docs/plans/2025-11-22-opencode-support-design.md`
- Delete: `docs/plans/2025-11-22-opencode-support-implementation.md`
- Delete: `tests/claude-code/`
- Delete: `tests/explicit-skill-requests/`
- Delete: `tests/opencode/`
- Delete: `tests/skill-triggering/`
- Delete: `tests/subagent-driven-dev/`
- Delete: `.claude-plugin/`
- Delete: `.cursor-plugin/`
- Delete: `.opencode/`
- Delete: `hooks/`
- Delete: `GEMINI.md`
- Delete: `gemini-extension.json`

- [ ] **Step 1: Replace `docs/testing.md`**

Replace the file with:

```markdown
# Testing the Codex-Only Superpowers Fork

This repository is validated as a Codex-first product.

## Validation Layers

1. Repository surface checks
2. Forbidden legacy-term checks
3. Documentation consistency checks

## Run All Checks

```bash
scripts/validate-codex-only.sh
```

## Individual Checks

```bash
tests/codex/test-repo-surface.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
```

## What These Checks Enforce

- `AGENTS.md` is canonical
- non-Codex product artifacts are removed
- public docs are Codex-only
- core product files do not use translated Claude tooling terms
```

- [ ] **Step 2: Create the repo-surface validation script**

Create `tests/codex/test-repo-surface.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

test -f AGENTS.md
test ! -L AGENTS.md
test ! -e CLAUDE.md
test ! -d .claude-plugin
test ! -d .cursor-plugin
test ! -d .opencode
test ! -d hooks
test ! -f GEMINI.md
test ! -f gemini-extension.json

echo "repo surface ok"
```

- [ ] **Step 3: Create the forbidden-terms validation script**

Create `tests/codex/test-forbidden-terms.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

rg -n \
  'Claude Code|Cursor|OpenCode|Gemini|Copilot|Task tool|TodoWrite|Skill tool|activate_skill|/plugin|/add-plugin|marketplace' \
  AGENTS.md README.md .codex docs skills agents .github package.json scripts tests/codex && {
  echo "forbidden terms found"
  exit 1
}

echo "forbidden terms ok"
```

- [ ] **Step 4: Create the docs-consistency validation script**

Create `tests/codex/test-doc-consistency.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

rg -q 'Codex-only|Codex-only fork' README.md
rg -q 'AGENTS.md' docs/README.codex.md
rg -q 'scripts/validate-codex-only.sh' docs/testing.md

echo "doc consistency ok"
```

- [ ] **Step 5: Create the top-level validator**

Create `scripts/validate-codex-only.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

tests/codex/test-repo-surface.sh
tests/codex/test-forbidden-terms.sh
tests/codex/test-doc-consistency.sh
```

Make the scripts executable:

```bash
chmod +x scripts/validate-codex-only.sh tests/codex/test-repo-surface.sh tests/codex/test-forbidden-terms.sh tests/codex/test-doc-consistency.sh
```

- [ ] **Step 6: Delete the deprecated command shims and non-Codex docs**

Run:

```bash
git rm commands/brainstorm.md commands/write-plan.md commands/execute-plan.md
git rm docs/README.opencode.md docs/windows/polyglot-hooks.md
git rm docs/plans/2025-11-22-opencode-support-design.md docs/plans/2025-11-22-opencode-support-implementation.md
```

- [ ] **Step 7: Delete the harness-specific tests and legacy product directories**

Run:

```bash
git rm -r tests/claude-code tests/explicit-skill-requests tests/opencode tests/skill-triggering tests/subagent-driven-dev
git rm -r .claude-plugin .cursor-plugin .opencode hooks
git rm GEMINI.md gemini-extension.json
```

- [ ] **Step 8: Run the full validation suite**

Run:

```bash
scripts/validate-codex-only.sh
```

Expected:

```text
repo surface ok
forbidden terms ok
doc consistency ok
```

- [ ] **Step 9: Commit**

```bash
git add docs/testing.md scripts/validate-codex-only.sh tests/codex
git commit -m "refactor: replace validation layer and remove legacy product surface"
```

---

### Task 8: Final Cleanup Verification

**Files:**
- Modify: any files needed to fix validation failures from Task 7

- [ ] **Step 1: Verify the final repository surface**

Run:

```bash
find . -maxdepth 2 \
  \( -path './.git' -o -path './node_modules' \) -prune -o -type f | sort
```

Expected:

- no `.claude-plugin`, `.cursor-plugin`, `.opencode`, `hooks`, `GEMINI.md`, or `gemini-extension.json`

- [ ] **Step 2: Run the forbidden-term scan over the active product surface**

Run:

```bash
rg -n 'Claude Code|Cursor|OpenCode|Gemini|Copilot|Task tool|TodoWrite|Skill tool|activate_skill|/plugin|/add-plugin|marketplace' \
  AGENTS.md README.md .codex docs skills agents .github package.json scripts tests/codex
```

Expected:

- no matches

- [ ] **Step 3: Check the working tree is limited to intended changes**

Run:

```bash
git status --short
```

Expected:

- only the files modified or deleted by this plan

- [ ] **Step 4: Commit any final cleanup fixups**

```bash
git add -A
git commit -m "refactor: finalize Codex-only reorganization"
```

---

## Self-Review

### 1. Spec coverage

Coverage against `docs/superpowers/specs/2026-04-04-codex-only-reorganization-design.md`:

- Product definition and repository boundary: Tasks 1, 2, 7
- Canonical `AGENTS.md` + Codex-native instruction system: Tasks 1, 3
- Full rewrite of Class A skills: Tasks 3, 4, 5
- Partial rewrite of Class B skills: Task 6
- Documentation reorganization: Tasks 1, 2, 7
- Testing/validation redesign: Task 7
- Legacy surface removal: Tasks 7, 8
- Acceptance criteria/final verification: Task 8

No uncovered spec sections remain.

### 2. Placeholder scan

Checked for common stub markers and vague deferred-work language.

None remain in the plan.

### 3. Type and naming consistency

Consistent names used throughout:

- `AGENTS.md`
- `spawn_agent`
- `update_plan`
- `scripts/validate-codex-only.sh`
- `tests/codex/*`
- `skills/using-superpowers/references/codex-conventions.md`

No mixed old/new naming is left in the planned changes.
