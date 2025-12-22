# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Superpowers is a Claude Code plugin providing composable "skills" that enforce development workflows (TDD, brainstorming, systematic debugging, structured plan execution). Skills trigger automatically based on context.

## Structure

- `skills/` - Core skills, each subdirectory has a `SKILL.md`
- `commands/` - Slash commands (`/brainstorm`, `/write-plan`, `/execute-plan`)
- `agents/` - Subagent definitions
- `hooks/` - Session hooks
- `tests/claude-code/` - Skills tests using Claude CLI

## Testing

Run `./tests/claude-code/run-skill-tests.sh` for fast tests. Use `--integration` for full workflow tests (slow). See `tests/claude-code/README.md` for details.

## Working on Skills

Read `skills/writing-skills/SKILL.md` before creating or editing skills. Key points:
- Skills follow TDD: baseline test → write skill → verify compliance
- YAML frontmatter: only `name` and `description` fields
- Description format: "Use when..." (triggering conditions only)
