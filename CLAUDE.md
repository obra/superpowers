# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Issue Tracking (ENFORCED)

This project uses **bd (beads)** for issue tracking. Hooks auto-inject `bd prime` at session start.

**MANDATORY WORKFLOW:**

1. **Session Start**: Run `bd ready` to see available work. If work relates to an existing issue, claim it with `bd update <id> --status=in_progress`

2. **During Work**: If you discover work that should be tracked (multi-session, has dependencies, or non-trivial), create an issue with `bd create`

3. **Before Completion**: You CANNOT claim work is done without:
   - Closing related beads issues: `bd close <id>`
   - Or explaining why no issue applies (truly ad-hoc work)

**Quick reference:**
- `bd ready` - Find unblocked work
- `bd list --status=in_progress` - Your active work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd update <id> --status=in_progress` - Claim work

For full workflow details: `bd prime`

## What This Is

Hyperpowers is a Claude Code plugin providing composable "skills" that enforce development workflows (TDD, brainstorming, systematic debugging, structured plan execution). Skills trigger automatically based on context.

## Structure

- `skills/` - Core skills, each subdirectory has a `SKILL.md`
- `commands/` - Slash commands (`/brainstorm`, `/write-plan`)
- `agents/` - Subagent definitions
- `hooks/` - Session hooks
- `tests/claude-code/` - Skills tests using Claude CLI

## Testing

Run `./tests/claude-code/run-skill-tests.sh` for fast tests. Use `--integration` for full workflow tests (slow). See `tests/claude-code/README.md` for details.

## Working on Skills

Read `skills/writing-skills/SKILL.md` before creating or editing skills. Key points:
- Skills follow TDD: baseline test → write skill → verify compliance
- YAML frontmatter: `name`, `description`, and optional `allowed-tools` fields
- Description format: "Use when..." (triggering conditions only)

## Documenting Improvements

When making significant improvements to Hyperpowers, update the documentation:

1. **IMPROVEMENTS.md** - Add detailed entries for notable changes:
   - Categorize under existing sections or create new ones
   - Include commit hashes for traceability
   - Explain the motivation and impact

2. **README.md Improvements Section** - Update the summary if:
   - A new major feature category is added
   - An existing improvement is substantially enhanced
   - The improvement represents a key differentiator from upstream

3. **What qualifies as "significant"**:
   - New workflow phases or gates
   - New enforcement mechanisms
   - Subagent communication patterns
   - Model selection changes
   - Test infrastructure additions
   - Upstream feature merges
