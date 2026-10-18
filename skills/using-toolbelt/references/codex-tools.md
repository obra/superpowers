## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables `spawn_agent`, `wait_agent`, and `close_agent` for delivery and the review skills. Close each subagent once nothing will resume it, such as an implementer after its boundary is published.

`wait_agent` may return an intermediate agent MESSAGE before the agent's final answer. A MESSAGE is progress, not completion — call `wait_agent` again until the final answer (the message carrying the agent's status/report) arrives. Likewise, a wait interrupted by an unrelated event (such as a new user message) does not mean the agent failed; resume waiting on the same agent.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
