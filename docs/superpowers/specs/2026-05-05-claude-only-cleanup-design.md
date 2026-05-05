# Strip Non-Claude Providers from Superpowers

**Date:** 2026-05-05
**Status:** Approved
**Scope:** Personal fork — make superpowers a Claude Code-only plugin

## Goal

Remove all multi-provider support (Codex, Cursor, OpenCode, Gemini CLI, Copilot CLI, Factory Droid) from this fork, leaving a clean Claude Code-only project.

## Files and Directories to Delete

| Path | Reason |
|------|--------|
| `.codex-plugin/` | Codex CLI/App plugin manifest |
| `.cursor-plugin/` | Cursor plugin manifest |
| `.opencode/` | OpenCode plugin JS entry + install docs |
| `GEMINI.md` | Gemini CLI context file |
| `AGENTS.md` | Symlink to CLAUDE.md (used by Codex) |
| `gemini-extension.json` | Gemini CLI extension manifest |
| `scripts/sync-to-codex-plugin.sh` | Codex marketplace sync script |
| `hooks/hooks-cursor.json` | Cursor-specific hooks config |
| `docs/README.opencode.md` | OpenCode documentation |
| `docs/plans/2025-11-22-opencode-support-design.md` | OpenCode design doc |
| `docs/plans/2025-11-22-opencode-support-implementation.md` | OpenCode implementation plan |
| `docs/superpowers/plans/2026-03-23-codex-app-compatibility.md` | Codex app plan |
| `docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md` | Codex app spec |
| `skills/using-superpowers/references/` | Tool mapping files (codex-tools.md, copilot-tools.md, gemini-tools.md) |

## Files to Edit

### `README.md`

- Remove all non-Claude installation sections (Codex CLI, Codex App, Factory Droid, Gemini CLI, OpenCode, Cursor, GitHub Copilot CLI)
- Update quickstart line to only mention Claude Code
- Remove "updates are somewhat coding-agent dependent" phrasing
- Remove contributing note about "all coding agents we support"

### `skills/using-superpowers/SKILL.md`

- Remove "How to Access Skills" entries for Copilot CLI, Gemini CLI, and "other environments"
- Remove the "Platform Adaptation" section entirely (references to copilot-tools.md, codex-tools.md, gemini-tools.md)
- Remove GEMINI.md from the instruction priority list
- Clean up any remaining multi-platform references

### `skills/executing-plans/SKILL.md`

- Remove the note: "Tell your human partner that Superpowers works much better with access to subagents... (such as Claude Code or Codex)"
- Replace with a simple note about requiring subagent support (Claude Code always has it)

### `skills/writing-skills/SKILL.md`

- Remove: "Personal skills live in agent-specific directories (`~/.claude/skills` for Claude Code, `~/.agents/skills/` for Codex)"
- Replace with Claude Code-only path reference

### `package.json`

- Remove `"type": "module"` (only needed for OpenCode ES module import)
- Remove `"main": ".opencode/plugins/superpowers.js"` (OpenCode entry point)

### `.version-bump.json`

- Remove entries for `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, and `gemini-extension.json`
- Keep: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

### `CLAUDE.md`

- Remove "New Harness Support" section (session transcript requirement)
- Remove references to cross-platform skill compatibility in "What We Will Not Accept" and "Skill Changes Require Evaluation"
- Simplify contributing section to remove multi-harness testing requirement
- Remove "works across all of the coding agents we support" from contributing

## What Remains Unchanged

- `.claude-plugin/` directory (plugin.json, marketplace.json)
- All skill SKILL.md files (content simplified per above)
- `hooks/hooks.json` and `hooks/session-start` and `hooks/run-hook.cmd` (Claude Code hooks)
- `scripts/bump-version.sh`
- Tests directory
- Non-provider-specific docs and plans
- Assets
- LICENSE, CODE_OF_CONDUCT.md
- `.github/` (issue templates, PR template)

## Approach

Single-pass: one commit that deletes all non-Claude files and edits remaining content. No intermediate states.

## Verification

After the change:
- `git status` shows only Claude-related files
- No remaining references to Codex, Cursor, OpenCode, Gemini, Copilot, or Factory Droid in any skill or doc
- `.claude-plugin/plugin.json` unchanged and valid
- `hooks/hooks.json` unchanged and valid
