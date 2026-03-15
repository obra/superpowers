# Windsurf Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Windsurf equivalent |
|-----------------|---------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_to_file` |
| `Edit` (file editing) | `edit` or `multi_edit` |
| `Bash` (run commands) | `run_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `find_by_name` |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively via `@skill-name` — just follow the instructions |
| `WebSearch` | `search_web` |
| `WebFetch` | `read_url_content` |
| `Task` tool (dispatch subagent) | Use **Worktrees** and **Simultaneous Cascades** (see below) |

## Subagent Equivalents in Windsurf

Windsurf Cascade does not have a `Task` tool for spawning subagents from within a conversation. Instead, Windsurf uses **Simultaneous Cascades** (optionally with **Worktrees**) to achieve parallel execution and context isolation.

### When a skill tells you to "dispatch a subagent":

**Option 1: Simultaneous Cascades (Basic Parallel)**
- Use when tasks operate on **completely different files/directories** (e.g., different repos in multi-repo workspace, or frontend vs backend)
- Simply tell the user to open a new Cascade tab and provide the exact prompt
- No file isolation needed if tasks won't conflict

**Option 2: Simultaneous Cascades + Worktrees (Isolated Parallel)** — **RECOMMENDED DEFAULT**
- Use when tasks might edit the same files or run conflicting global commands
- Tell the user to:
  1. Open a new Cascade tab
  2. Switch to **Worktree mode** (bottom right of input box)
  3. Paste the exact prompt (this acts as the "subagent instructions")
- Each Worktree operates in an isolated Git environment (`~/.windsurf/worktrees/<repo_name>`)
- Multiple Cascades can edit files, run tests, and execute commands concurrently without race conditions
- When work is done, user clicks "Merge" to bring changes back to main workspace

**Default to Worktrees for safety** unless you're certain the tasks are completely disjoint. If tasks might touch the same files or run global commands (like `npm run format`, `cargo build`), Worktrees are required to prevent conflicts.

## Additional Windsurf tools

These tools are available in Windsurf but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `list_dir` | List files and directories in a path |
| `code_search` | Fast context search using parallel grep and readfile |
| `create_memory` | Save important context to memory database |
| `browser_preview` | Spin up browser preview for web servers |
| App Deploys | Deploy web applications to Netlify via Cascade tool calls |

## Windsurf-specific features

- **Skills**: Discovered from `.windsurf/skills/` (workspace) and `~/.codeium/windsurf/skills/` (global)
- **Rules**: Stored in `.windsurf/rules/` (workspace) and `~/.codeium/windsurf/memories/global_rules.md` (global)
- **Workflows**: Stored in `.windsurf/workflows/` (workspace)
- **Cascade Modes**: Code mode, Plan mode, Ask mode
- **Auto-execution**: Commands can be auto-executed based on safety level
