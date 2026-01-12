# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Issue Tracking

This project uses **beads** for issue tracking.

**IMPORTANT: Always use the `bd` CLI for beads operations. Never manually edit `.beads/issues.jsonl`.**

```bash
# Essential commands
bd list                              # View all issues
bd show <issue-id>                   # View issue details
bd create "Issue title"              # Create new issue
bd update <issue-id> --status done   # Update status
bd sync                              # Sync to beads-sync branch (required for cross-machine sync)
```

Issues sync via the `beads-sync` branch, not main. Always run `bd sync` after creating/updating issues.

**Skills handle issue tracking automatically:**
- **research** - Discovers related issues, includes in research doc
- **writing-plans** - Carries issue context to plan header
- **subagent-driven-development** - Offers branch creation and status update at start
- **verification-before-completion** - Offers to create discovered work, update original issue
- **finishing-a-development-branch** - Includes issue reference in PR, offers close after merge

**Mandatory Checkpoints:**
- **Session Start** (subagent-driven-development): Branch creation offer, status update offer - MUST be presented
- **Before Completion** (verification-before-completion): Discovered work offers, original issue update - MUST be presented
- **After Merge/PR** (finishing-a-development-branch): Issue close offer - MUST be presented

"Mandatory" means the offer MUST be presented. User always decides whether to execute.

**No manual issue commands needed** - skills present offers at checkpoints.

**Detection priority:**
1. Explicit declaration in CLAUDE.md or project rules
2. Auto-detect: `.beads/` → `gh auth status` → Jira MCP
3. If none detected: Skills warn but proceed without tracking

**To configure:** Add to CLAUDE.md: "This project uses [beads|GitHub Issues|Jira] for issue tracking."

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
