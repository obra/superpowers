# OpenCode Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On OpenCode these resolve to the tools below.

| Action skills request | OpenCode tool |
|----------------------|---------------|
| Read a file | `read` |
| Create a file | `write` |
| Edit an existing file | `edit` |
| Delete a file | `bash` with `rm`/`del` |
| Apply a diff/patch | `patch` |
| Run a shell command | `bash` |
| Search file contents | `grep` |
| Find files by name | `glob` |
| Fetch a URL | `webfetch` |
| Search the web | `websearch` (requires `OPENCODE_ENABLE_EXA=1`) |
| Invoke a skill | OpenCode's native `skill` tool |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `task` with `subagent_type: "general"` (or `"explore"` for read-only codebase exploration) |
| Multiple parallel dispatches | Multiple `task` calls in one response |
| Task tracking ("create a todo", "mark complete") | `todowrite` |
| Ask user questions | `question` |
| LSP code intelligence | `lsp` (experimental, requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`) |

## Instructions file

When a skill mentions "your instructions file", on OpenCode this is **`AGENTS.md`** at the project root. OpenCode also reads `~/.config/opencode/AGENTS.md` for global context. As a fallback, `CLAUDE.md` is used if `AGENTS.md` does not exist.

Additional instruction files can be configured via `opencode.json`:

```json
{
  "instructions": ["CONTRIBUTING.md", "docs/guidelines.md"]
}
```

## Personal skills directory

User-level skills live at **`~/.config/opencode/skills/`**. OpenCode also reads:
- `~/.claude/skills/` (Claude Code compatibility)
- `~/.agents/skills/` (cross-runtime, shared with Codex, Copilot CLI, Gemini CLI)
- `.opencode/skills/` (project-level)
- `.claude/skills/` (project-level, Claude compatibility)
- `.agents/skills/` (project-level, cross-runtime)

Each skill is a subdirectory containing a `SKILL.md` with `name` and `description` frontmatter.

## Model selection for subagents

**Important limitation:** OpenCode's `task` tool does NOT accept a `model` parameter. Subagents inherit the model of the parent agent. To use different models for different task types, create separate OpenCode agents with different models configured:

```json
{
  "agent": {
    "superpowers-implementer": {
      "mode": "subagent",
      "model": "anthropic/claude-haiku-4-5"
    },
    "superpowers-reviewer": {
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5"
    }
  }
}
```

Then dispatch with the appropriate `subagent_type`.

**Alternative:** Use OpenCode's variant system (`Ctrl+T` in TUI) to switch reasoning levels before dispatching tasks:
- Mechanical tasks → `low`/`minimal` variant
- Integration tasks → default variant
- Review/architecture tasks → `high`/`max` variant

## Environment Detection

Skills that create worktrees or finish branches should detect their environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR)

## Compaction

OpenCode supports auto-compaction. The SDD progress ledger (`.superpowers/sdd/progress.md`) is git-ignored scratch. After compaction, trust the ledger file and `git log` over conversation memory.

## Permissions

Recommend configuring these in `opencode.json` for Superpowers workflows:

```json
{
  "permission": {
    "external_directory": {
      ".worktrees/**": "allow",
      "worktrees/**": "allow"
    },
    "doom_loop": "allow"
  }
}
```

`external_directory` is needed because worktrees live outside the main repo. `doom_loop` is set to `allow` because the SDD review→fix→re-review cycle can trigger false-positive loop detection.
