# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Superpowers is a **composable skills library and workflow framework** distributed as a plugin for AI coding agents (Claude Code, Cursor, OpenCode, Codex, Gemini). It is not a traditional application — skills are Markdown files with YAML frontmatter that get injected into agent sessions.

The plugin works by injecting `skills/using-superpowers/SKILL.md` into every session via the SessionStart hook, which instructs the agent to load other skills on demand using Claude Code's built-in `Skill` tool.

## Repository Structure

```
skills/          # 14 skill modules — the core library (each is a directory with SKILL.md)
hooks/           # SessionStart bash script that injects skills into agent sessions
.claude-plugin/  # Claude Code plugin descriptor (plugin.json, marketplace.json)
.cursor-plugin/  # Cursor IDE plugin descriptor
.opencode/       # OpenCode plugin (superpowers.js bootstrap loader)
.codex/          # Codex installation docs
tests/           # Platform-specific test suites (bash scripts + Node.js)
docs/            # Specs, plans, platform-specific READMEs
agents/          # Agent guidance files (code-reviewer.md)
commands/        # Deprecated command definitions
```

## Skill File Format

Every skill lives in `skills/<skill-name>/SKILL.md` with this structure:

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions — NOT a workflow summary]
---

# Skill Name
...
```

**Critical frontmatter rules:**
- Only `name` and `description` fields — no others
- Total frontmatter ≤ 1024 characters
- `name`: letters, numbers, hyphens only (no parentheses or special chars)
- `description`: starts with "Use when...", third person, describes triggering conditions ONLY — **never** summarize the skill's workflow (Claude will follow the description as a shortcut instead of reading the body)

## Running Tests

**Brainstorm server tests** (Node.js + WebSocket):
```bash
cd tests/brainstorm-server && npm install && npm test
```

**Claude Code skill tests** (bash):
```bash
bash tests/claude-code/run-skill-tests.sh
```

**Skill triggering tests** (bash):
```bash
bash tests/skill-triggering/run-all.sh
```

**Explicit skill request tests** (bash, requires a running Claude Code session):
```bash
bash tests/explicit-skill-requests/run-all.sh
```

**OpenCode tests** (bash):
```bash
bash tests/opencode/run-tests.sh
```

## How the Hook Works

`hooks/session-start` is a POSIX bash script that:
1. Reads `skills/using-superpowers/SKILL.md`
2. JSON-escapes it
3. Outputs a platform-specific JSON response:
   - Claude Code: `hookSpecificOutput.additionalContext`
   - Cursor: `additional_context`
   - Detected via `CLAUDE_PLUGIN_ROOT` / `CURSOR_PLUGIN_ROOT` env vars

## Writing and Testing Skills

Skills follow TDD principles — **run a baseline test WITHOUT the skill first**, document what the agent does wrong, then write the skill to address those specific failures.

The `skills/writing-skills/SKILL.md` is the authoritative guide. Key rules:
- **Iron Law:** No skill without a failing baseline test first
- Token efficiency matters: frequently-loaded skills should be <200 words; getting-started workflows <150 words
- Use `wc -w skills/<name>/SKILL.md` to check word count
- Render skill flowcharts (GraphViz dot format): `./skills/writing-skills/render-graphs.js ../some-skill`
- Cross-reference other skills with `superpowers:skill-name` syntax — do NOT use `@` file links (they force-load and burn context)

## Skill Workflow (for development tasks)

The core workflow when building features:
1. **brainstorming** → design doc
2. **using-git-worktrees** → isolated branch
3. **writing-plans** → task breakdown (2-5 min tasks with exact file paths)
4. **subagent-driven-development** → dispatch subagents per task with two-stage review
5. **test-driven-development** → RED-GREEN-REFACTOR within each task
6. **finishing-a-development-branch** → merge/PR decision

## Platform Plugin Files

| Platform | Entry point | Version field |
|----------|-------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | Update `version` on release |
| Cursor | `.cursor-plugin/plugin.json` | Update `version` on release |
| OpenCode | `.opencode/plugins/superpowers.js` | JS bootstrap loader |
| Gemini | `gemini-extension.json` | Root-level descriptor |
| Root | `package.json` | Keep in sync with plugin versions |

## Contributing New Skills

1. Follow `skills/writing-skills/SKILL.md` — the full TDD process for skills
2. Personal/experimental skills go in `~/.claude/skills/` (not this repo)
3. Submit broadly-useful skills as PRs; see the Skill Creation Checklist in `writing-skills/SKILL.md`
