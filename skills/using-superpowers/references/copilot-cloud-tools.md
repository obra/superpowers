# Copilot Cloud Agent (Web) Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Copilot cloud agent equivalent |
|-----------------|-------------------------------|
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Grep` (search file content) | `grep` |
| `Glob` (search files by name) | `glob` |
| `Skill` tool (invoke a skill) | `skill` |
| `WebFetch` | `web_fetch` |
| `WebSearch` | `web_search` |
| `Task` tool (dispatch subagent) | `task` (see [Agent types](#agent-types)) |
| Multiple `Task` calls (parallel) | Multiple `task` calls |
| `TodoWrite` (task tracking) | `report_progress` with markdown checklists |
| `EnterPlanMode` / `ExitPlanMode` | No equivalent — agent operates in a single mode |

## Agent types

Copilot cloud agent's `task` tool accepts an `agent_type` parameter:

| Claude Code agent | Copilot cloud agent equivalent |
|-------------------|-------------------------------|
| `general-purpose` | `"general-purpose"` |
| `Explore` | `"explore"` |
| Named plugin agents (e.g. `superpowers:code-reviewer`) | Not directly supported — inline the agent prompt in the `task` call |

When a skill says to dispatch a named agent type:

1. Find the agent's prompt file (e.g., `agents/code-reviewer.md` or the skill's local prompt template like `code-quality-reviewer-prompt.md`)
2. Read the prompt content
3. Fill any template placeholders (`{BASE_SHA}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
4. Dispatch a `general-purpose` task with the filled content as the prompt

## Environment differences

Copilot cloud agent runs in a **sandboxed GitHub Actions environment**, not a local machine. This affects several skills:

### No direct git push

The agent cannot run `git push` directly. Use `report_progress` to commit and push changes. This tool also updates the PR description with a progress checklist.

### No `gh` CLI for PR creation

Use the `create_pull_request` tool instead of `gh pr create`.

### Git worktrees not needed

The agent gets its own branch automatically. Skills that reference `superpowers:using-git-worktrees` can skip worktree setup — the sandbox is already an isolated workspace on the correct branch.

### Finishing a development branch

Instead of the full `superpowers:finishing-a-development-branch` workflow (which offers merge/PR/keep/discard options), use:

- `report_progress` to commit and push final changes
- `create_pull_request` to open a PR when ready
- `parallel_validation` to run Code Review and CodeQL Security Scan before finalizing

## Additional Copilot cloud agent tools

| Tool | Purpose |
|------|---------|
| `report_progress` | Commit, push changes, and update the PR description with a progress checklist |
| `create_pull_request` | Create a pull request for the current branch |
| `parallel_validation` | Run Code Review and CodeQL Security Scan in parallel |
| `gh-advisory-database` | Check GitHub Advisory DB for vulnerabilities in dependencies |
| GitHub MCP tools (`github-mcp-server-*`) | Native GitHub API access (issues, PRs, code search, workflow runs, actions) |

## Skill compatibility notes

| Skill | Cloud agent status |
|-------|--------------------|
| `brainstorming` | Works as-is |
| `writing-plans` | Works as-is |
| `executing-plans` | Works — use `report_progress` instead of `TodoWrite` for tracking |
| `subagent-driven-development` | Works — `task` tool supports subagent dispatch |
| `dispatching-parallel-agents` | Works — multiple `task` calls run concurrently |
| `test-driven-development` | Works as-is |
| `systematic-debugging` | Works as-is |
| `using-git-worktrees` | **Skip** — sandbox is already isolated |
| `finishing-a-development-branch` | **Adapt** — use `report_progress` + `create_pull_request` (see above) |
| `verification-before-completion` | Works as-is |
| `requesting-code-review` | Works — dispatch reviewer via `task` tool |
| `receiving-code-review` | Works as-is |
| `writing-skills` | Works as-is |
