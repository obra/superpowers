# CLAUDE.md

This is a plugin for claude code that provides a set of skills to execute a complete software development workflow.

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
 
## Plugin Version Updates

**ALWAYS** offer to update the plugin version number once work is deemed completed. 
Suggest a patch version update (0.0.1 -> 0.0.2) for small updates, and a minor version update (0.1.1 -> 0.2.0) for larger improvements. 
Do not offer a major version update yet, this library is still in development and not stable. 
Always offer the user to provide their own version instead too alongside your suggested version. Use AskUserQuestion for this.
