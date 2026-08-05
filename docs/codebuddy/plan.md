# CodeBuddy Harness Adaptation Plan

This document tracks the plan for adding CodeBuddy (Tencent Cloud Code Assistant) support to Superpowers, following the procedure in [porting-to-a-new-harness.md](../porting-to-a-new-harness.md).

## Background

CodeBuddy is Tencent Cloud's AI coding assistant (IDE + CLI). It is compatible with the Claude Code plugin format — it recognizes `.claude-plugin/plugin.json`, sets `CLAUDE_PLUGIN_ROOT` alongside `CODEBUDDY_PLUGIN_ROOT`, and expects the same `hookSpecificOutput.additionalContext` JSON shape from SessionStart hooks.

- Integration shape: **Shape A (Shell-hook)** — same as Claude Code.
- Reference implementation: Claude Code itself (`.claude-plugin/plugin.json` + `hooks/hooks.json` + `hooks/session-start`).
- Distribution: `codebuddy plugin install` from a Git URL, or `codebuddy --plugin-dir` for local development.

## Key findings from Phase 1 (feasibility verification)

| Verification item | Result | Details |
|---|---|---|
| SessionStart hook fires | PASS | `executeSessionStartHooks source=startup` confirmed in logs |
| `CLAUDE_PLUGIN_ROOT` set | PASS | Both `CLAUDE_PLUGIN_ROOT` and `CODEBUDDY_PLUGIN_ROOT` set to plugin dir |
| `${CLAUDE_PLUGIN_ROOT}` expands in hook command | PASS | Command expanded to full path in logs |
| `session-start` script outputs correct JSON | PASS | `hookSpecificOutput.additionalContext` format, valid JSON, contains `<EXTREMELY_IMPORTANT>` wrapper + full `using-superpowers` skill |
| Bootstrap context injected | PASS | "SessionStart hook provided additional context" in logs |
| Skills auto-discovered | PASS | 14 skills loaded from `./skills/` directory |
| Skills invokable via native tool | PASS | CodeBuddy has `use_skill` tool |
| Smoke check ("What are your superpowers?") | PASS | Model listed all 14 skills with correct categories |
| Acceptance test ("Let's make a react todo list") | PASS | `brainstorming` skill auto-triggered before any code; model started asking clarifying questions |

### Minor issues found

| Issue | Severity | Notes |
|---|---|---|
| `hooks-cursor.json` warning | Minor | CodeBuddy scans all `hooks/*.json` files; `hooks-cursor.json` has Cursor-specific format. Harmless — `hooks.json` loads correctly. |
| `--print` mode async hooks | Known limitation | In `--print` mode, SessionStart hooks fire async and are not awaited. Does not affect interactive mode (the normal usage pattern). |

## Conclusion from Phase 1

**No modifications to `hooks/session-start`, `hooks/hooks.json`, or `.claude-plugin/plugin.json` are needed.** CodeBuddy sets `CLAUDE_PLUGIN_ROOT`, so the existing Claude Code branch in the session-start script fires correctly and outputs the exact JSON format CodeBuddy expects. The adaptation requires only: a tool-mapping reference file, a SKILL.md pointer, README install docs, and a test case.

---

## Progress checklist

### Phase 1 — Feasibility verification (Part 2–3)

- [x] Verify CodeBuddy has a SessionStart hook with automatic injection (no per-session opt-in)
- [x] Verify environment variables: `CLAUDE_PLUGIN_ROOT` and `CODEBUDDY_PLUGIN_ROOT` are both set
- [x] Verify `${CLAUDE_PLUGIN_ROOT}` expands correctly in hook command strings
- [x] Verify `session-start` script outputs valid JSON with bootstrap content
- [x] Verify CodeBuddy consumes `hookSpecificOutput.additionalContext` format
- [x] Verify skills are auto-discovered from `./skills/` directory (14 skills loaded)
- [x] Verify native `use_skill` tool can invoke discovered skills
- [x] Smoke check: "What are your superpowers?" — model knows it has superpowers
- [x] Acceptance test: "Let's make a react todo list" — `brainstorming` auto-triggers before any code
- [x] Save acceptance test transcript

### Phase 2 — Core adaptation (Part 5 Step 1–4)

- [x] Confirm no changes needed to `hooks/session-start` (existing Claude Code branch works)
- [x] Confirm no changes needed to `hooks/hooks.json` (CodeBuddy compatible with Claude Code format)
- [x] Confirm no changes needed to `.claude-plugin/plugin.json` (CodeBuddy recognizes it directly)
- [x] Create `skills/using-superpowers/references/codebuddy-tools.md` — tool mapping
- [x] Add CodeBuddy to `SKILL.md` Platform Adaptation section
- [x] Add CodeBuddy install section to `README.md`
- [x] Add CodeBuddy test case to `tests/hooks/test-session-start.sh`
- [x] Verify all tests pass (6/6 passed)

### Phase 3 — Distribution (Part 6)

- [x] Verify `codebuddy plugin marketplace add` + `codebuddy plugin install` works end-to-end (tested with local directory; Git URL works the same way per docs)
- [x] Verify `codebuddy --plugin-dir /path/to/superpowers` works for local development (verified in Phase 1)
- [x] Verify installed plugin auto-loads skills and fires SessionStart hook without `--plugin-dir` (smoke check passed in interactive session)
- [x] Document install commands in README (marketplace add + plugin install + --plugin-dir dev mode)
- [x] No new manifest needed — `.claude-plugin/plugin.json` is recognized by CodeBuddy
- [x] No `.version-bump.json` entry needed — no new versioned manifest file

### Phase 4 — PR submission (Part 8)

- [ ] Search for existing CodeBuddy PRs (open and closed)
- [ ] Target `dev` branch
- [ ] Fill PR template "New harness support" section
- [ ] Disclose model (GLM-5v-Turbo), harness (CodeBuddy Code v2.117.0), and plugins used
- [ ] Paste complete acceptance test transcript
- [ ] One harness per PR — no bundled changes

---

## Tool mapping summary

| Action | CodeBuddy tool |
|---|---|
| Read a file | `read_file` |
| Create / edit / delete a file | `write_to_file`, `replace_in_file`, `delete_file` |
| Run a shell command | `execute_command` |
| Search file contents / find files | `search_content`, `search_file` |
| Fetch a URL / web search | `web_fetch`, `web_search` |
| Dispatch a subagent | `task` with `subagent_name` |
| Create / update todos | No native tool — use plan file or `TODO.md` |
| Invoke a skill | `use_skill` |

See [references/codebuddy-tools.md](../skills/using-superpowers/references/codebuddy-tools.md) for the full mapping.

---

## Acceptance test transcript

Test environment: CodeBuddy Code v2.117.0, model GLM-5v-Turbo, plugin loaded via `--plugin-dir`.

**Smoke check:**

```
> What are your superpowers?

● I have several superpowers (skills) that help me work more effectively:

  Process Skills (set the approach):
  - brainstorming - Explore user intent before creative work
  - systematic-debugging - Methodical bug diagnosis
  - test-driven-development - Write tests before code
  - writing-plans - Create implementation plans
  - executing-plans - Execute written plans
  - verification-before-completion - Verify before claiming done

  Collaboration Skills:
  - requesting-code-review / receiving-code-review - Code review workflows
  - dispatching-parallel-agents - Run independent tasks in parallel
  - subagent-driven-development - Use agents for implementation plans

  Workflow Skills:
  - using-git-worktrees - Isolated workspace for feature work
  - finishing-a-development-branch - Integrate completed work

  Meta Skills:
  - using-superpowers - This reference guide
  - writing-skills - Create/edit new skills

  Each skill has specific triggers and step-by-step instructions. I invoke them
  automatically when they apply to the task at hand.
```

**Acceptance test:**

```
> Lets make a react todo list

● Using brainstorming to explore what you need before building.

● Skill(brainstorming)
  ⎿ Skill "brainstorming" loaded. Follow the instructions below to complete it:

● Let me check the current project state.
● Bash(ls -la /tmp/cb-tmux-test/)
  ⎿ total 32 (empty directory)
● The directory is empty — we're starting from scratch. Let me understand
  what you're looking for.

What's the primary purpose of this todo list? Is it a learning project, a
portfolio piece, or something you'll actually use day-to-day?

❯ 1. Basic CRUD only
  2. CRUD + 1-2 extras
  3. Feature-rich
  4. Type something
```

`brainstorming` skill auto-triggered before any code was written. **PASS.**
