# Codex Phase 1 Migration Plan

> **For Codex:** This plan creates a working Codex-focused package without changing the root Claude Code package. Do not edit root `skills/`, `hooks/`, or `.claude-plugin/` during Phase 1 except for documentation links that explicitly describe Codex usage.

**Goal:** Make `plugins/sonbbal-superpowers-codex` installable and useful in Codex by adding a minimal Codex-compatible skill set, Codex-specific workflow language, installation docs, and compatibility tests.

**Architecture:** Keep Claude Code files as the source package for Claude Code users. Add a separate Codex package under `plugins/sonbbal-superpowers-codex/` with copied-and-adapted skills that use Codex tool names and Codex delegation rules. Treat Phase 1 as a compatibility baseline, not a full rewrite of every Superpowers workflow.

**Tech Stack:** Markdown `SKILL.md` files, Codex plugin metadata, shell-based validation tests, existing repository docs.

---

## Scope

Phase 1 focuses on making the Codex package real and coherent:

- Codex plugin has actual skills in `plugins/sonbbal-superpowers-codex/skills/`.
- Codex skills do not instruct agents to call Claude Code-only tools such as `Skill`, `TodoWrite`, `Task`, `TeamCreate`, `SendMessage`, or `TaskUpdate`.
- Team-driven instructions respect Codex's delegation rule: use `spawn_agent` only when the user explicitly asks for subagents, delegation, parallel agent work, or a team workflow.
- Codex installation docs point to Sonbbal's package, not the upstream-only `obra/superpowers` path.
- Tests detect empty skill packaging and obvious Claude-only references in Codex skills.

Out of scope for Phase 1:

- Full parity with every root Superpowers skill.
- Rewriting the root Claude Code package.
- Implementing a runtime bridge for Claude Code team APIs.
- Running long interactive Claude Code or Codex integration sessions.

## File Structure

Create or modify only these paths in Phase 1:

- Create: `plugins/sonbbal-superpowers-codex/skills/using-superpowers/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/team-driven-development/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/model-assignment/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/verification-before-completion/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/test-driven-development/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/writing-plans/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/executing-plans/SKILL.md`
- Modify: `plugins/sonbbal-superpowers-codex/README.md`
- Modify: `.codex/INSTALL.md`
- Create: `tests/codex/run-tests.sh`
- Create: `tests/codex/test-plugin-package.sh`
- Create: `tests/codex/test-codex-skill-language.sh`
- Optional modify: `README.md` only to point users at the Codex package guide.

Do not move root `agents/` in Phase 1. If role prompts are needed, fold the necessary behavior into Codex skill text first.

## Task 1: Add Minimal Codex Skill Package

**Files:**
- Create: `plugins/sonbbal-superpowers-codex/skills/using-superpowers/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/verification-before-completion/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/test-driven-development/SKILL.md`

- [ ] **Step 1: Create Codex `using-superpowers`**

Write a Codex-specific bootstrap skill that says:

- Check relevant skills before acting.
- Read skill files from the installed Codex skill package when needed.
- Use `update_plan` for checklists.
- Use `spawn_agent`, `send_input`, and `wait_agent` only under Codex delegation rules.
- Do not mention Claude Code's `Skill` tool as an available action.

- [ ] **Step 2: Create Codex `verification-before-completion`**

Adapt the root skill but keep the core rule:

- Evidence before completion claims.
- Run fresh verification commands before claiming pass/fixed/complete.
- Report actual failures if verification fails.

Remove or rewrite any instruction that assumes Claude Code transcripts or tools.

- [ ] **Step 3: Create Codex `test-driven-development`**

Adapt the root skill with minimal changes:

- Keep RED-GREEN-REFACTOR.
- Keep "no production code without a failing test first".
- Remove Claude-specific wording where present.
- Keep references to local support files only if those files are copied into the Codex package.

- [ ] **Step 4: Verify skill discovery structure**

Run:

```bash
find plugins/sonbbal-superpowers-codex/skills -name SKILL.md | sort
```

Expected:

- At least 3 `SKILL.md` files exist.
- Each has YAML frontmatter with `name` and `description`.

## Task 2: Port Planning And Execution Skills

**Files:**
- Create: `plugins/sonbbal-superpowers-codex/skills/writing-plans/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/executing-plans/SKILL.md`

- [ ] **Step 1: Create Codex `writing-plans`**

Adapt the root planning skill with these Codex-specific changes:

- Save plans to `docs/codex/plans/YYYY-MM-DD-<feature-name>.md` unless the user specifies another location.
- Use `update_plan` for task tracking language.
- Do not require automatic commits unless the user requested commits.
- In execution handoff, offer:
  1. Codex Team-Driven: only when user wants parallel agents or explicit delegation.
  2. Inline Execution: execute in the current Codex session with `executing-plans`.

- [ ] **Step 2: Create Codex `executing-plans`**

Adapt execution behavior:

- Review the plan before changing files.
- Use `update_plan` for progress.
- Execute batches inline unless the user explicitly requests delegated workers.
- Use `spawn_agent` only when permitted by the user request and when tasks are independent.
- Preserve the final verification gate.

- [ ] **Step 3: Remove Claude Code-only execution references**

Search the two new files:

```bash
rg -n "Claude Code|TodoWrite|Task tool|Skill tool|TeamCreate|SendMessage|TaskUpdate|Opus|Sonnet" plugins/sonbbal-superpowers-codex/skills/writing-plans plugins/sonbbal-superpowers-codex/skills/executing-plans
```

Expected:

- No hits, except historical explanation if clearly marked as "not available in Codex".

## Task 3: Rewrite Team-Driven Workflow For Codex

**Files:**
- Create: `plugins/sonbbal-superpowers-codex/skills/team-driven-development/SKILL.md`
- Create: `plugins/sonbbal-superpowers-codex/skills/model-assignment/SKILL.md`

- [ ] **Step 1: Create Codex `team-driven-development`**

Define Codex roles without Claude team APIs:

- Team Lead: current Codex session, coordinates work and integrates results.
- API/EDR Reviewer: a delegated agent only when parallel agent work is explicitly requested, otherwise a local checklist role.
- Audit Reviewer: a delegated agent only when explicitly requested, otherwise local verification checklist.
- Worker: a `spawn_agent` worker only when user explicitly asks for subagents/delegation/parallel agent work.

Core rule:

```text
Do not spawn agents just because a task is complex. Spawn agents only when the user explicitly requested subagents, delegation, parallel agents, or a team workflow.
```

- [ ] **Step 2: Replace `TeamCreate` and `SendMessage`**

Use Codex terms:

- `spawn_agent` to create workers when allowed.
- `send_input` to send follow-up instructions to an existing agent.
- `wait_agent` only when blocked on an agent result.
- `update_plan` for visible progress tracking.

- [ ] **Step 3: Create Codex `model-assignment`**

Replace Claude model names:

- Simple tasks: keep inherited model and default reasoning.
- Complex tasks: use higher reasoning effort when delegating if the tool call supports it.
- Security, architecture, data migration, and integration work: prefer local review plus high-reasoning delegated review only when delegation is allowed.
- Do not mention Opus, Sonnet, or Haiku as operational choices.

- [ ] **Step 4: Validate no unavailable team APIs remain**

Run:

```bash
rg -n "TeamCreate|SendMessage|TaskUpdate|Task tool|Opus|Sonnet|Haiku" plugins/sonbbal-superpowers-codex/skills/team-driven-development plugins/sonbbal-superpowers-codex/skills/model-assignment
```

Expected:

- No hits.

## Task 4: Update Codex Package Documentation

**Files:**
- Modify: `plugins/sonbbal-superpowers-codex/README.md`
- Modify: `.codex/INSTALL.md`
- Optional modify: `README.md`

- [ ] **Step 1: Replace migration placeholder README**

Update `plugins/sonbbal-superpowers-codex/README.md` to describe:

- What the Codex package contains.
- How it differs from the root Claude Code package.
- Which Phase 1 skills are included.
- Known limitations.
- How to run Codex compatibility tests.

- [ ] **Step 2: Update `.codex/INSTALL.md`**

Change upstream-only install instructions to Sonbbal-focused instructions:

- Clone `https://github.com/Sonbbal/superpowers.git`.
- Use the Codex plugin package when installing through `.agents/plugins/marketplace.json`.
- Keep symlink fallback instructions only if they point to the Codex-compatible skills directory.

- [ ] **Step 3: Optionally update root README Codex section**

If root README still points Codex users only to upstream docs, add a short pointer to:

```text
plugins/sonbbal-superpowers-codex/README.md
```

Keep root Claude Code installation instructions intact.

## Task 5: Add Codex Compatibility Tests

**Files:**
- Create: `tests/codex/run-tests.sh`
- Create: `tests/codex/test-plugin-package.sh`
- Create: `tests/codex/test-codex-skill-language.sh`

- [ ] **Step 1: Create package structure test**

`test-plugin-package.sh` should verify:

- `plugins/sonbbal-superpowers-codex/.codex-plugin/plugin.json` exists.
- `plugin.json` has `"skills": "./skills"`.
- At least one `SKILL.md` exists under `plugins/sonbbal-superpowers-codex/skills`.
- Required Phase 1 skills exist.

- [ ] **Step 2: Create Codex language test**

`test-codex-skill-language.sh` should fail if Codex skills contain unavailable operational tool references:

```bash
rg -n "TeamCreate|SendMessage|TaskUpdate|TodoWrite|Task tool|Skill tool|NotebookEdit|Opus|Sonnet|Haiku" plugins/sonbbal-superpowers-codex/skills
```

Allowlist only comments that explicitly explain "not available in Codex"; otherwise fail.

- [ ] **Step 3: Create Codex test runner**

`run-tests.sh` should run both tests and print a small summary:

```bash
bash tests/codex/test-plugin-package.sh
bash tests/codex/test-codex-skill-language.sh
```

- [ ] **Step 4: Run tests**

Run:

```bash
bash tests/codex/run-tests.sh
```

Expected:

- All Codex compatibility tests pass.

## Task 6: Final Review And Git Hygiene

**Files:**
- Check: `plugins/sonbbal-superpowers-codex/**`
- Check: `.agents/plugins/marketplace.json`
- Check: `.codex/INSTALL.md`
- Check: `tests/codex/**`

- [ ] **Step 1: Review diff**

Run:

```bash
git diff --stat
git diff -- plugins/sonbbal-superpowers-codex .codex/INSTALL.md tests/codex README.md
```

Expected:

- Codex package and docs changed.
- Root Claude Code `skills/`, `hooks/`, and `.claude-plugin/` unchanged.

- [ ] **Step 2: Run existing fast tests**

Run:

```bash
bash tests/opencode/run-tests.sh
bash tests/codex/run-tests.sh
```

Expected:

- OpenCode fast tests still pass.
- Codex compatibility tests pass.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected:

- `.agents/` and `plugins/` are intentionally present for Codex packaging.
- No unrelated generated files are present.

## Success Criteria

- `plugins/sonbbal-superpowers-codex/skills/` contains real Codex-compatible skills.
- Installing the Codex plugin no longer results in an empty skill package.
- Codex skills use Codex tool names and delegation constraints.
- No Phase 1 Codex skill tells the agent to use Claude Code-only runtime APIs.
- Sonbbal Codex installation docs no longer point users only to the upstream `obra/superpowers` package.
- `bash tests/codex/run-tests.sh` passes.
- Existing OpenCode fast tests still pass.

## Risks

- **Risk:** Copying root skills creates divergence.
  **Mitigation:** Keep Phase 1 small and document that root Claude Code files remain the upstream source for Claude Code behavior.

- **Risk:** Codex team-driven workflow becomes weaker without mandatory spawned agents.
  **Mitigation:** Preserve the quality gates as local checklists and use delegated reviewers only when the user explicitly authorizes agent work.

- **Risk:** Tests over-block explanatory mentions of Claude terms.
  **Mitigation:** Keep the language test focused on operational instructions, and add a small allowlist for clearly historical or contrastive documentation.

- **Risk:** Automatic commit instructions conflict with Codex collaboration norms.
  **Mitigation:** Remove mandatory commit language from Codex skills unless the user asks for commits.
