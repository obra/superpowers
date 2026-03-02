# Why TaskCreate/TaskList/TaskUpdate Are Not Available in Claude Code Headless (-p) Mode

**Research Date:** 2026-03-02

---

## Research Answer

### Root Cause: The `isTTY` Check

TaskCreate, TaskList, TaskUpdate, and TaskGet are compiled into the Claude Code binary but are **gated behind a TTY check**. When Claude Code runs in headless mode (`-p`), `process.stdout.isTTY` returns `false`, which causes the internal `isInteractive` flag to be set to `false`, which in turn disables the task tools.

The gate function (decompiled from the binary as `sG()`) works as follows:

```javascript
function sG() {
  if (LE(process.env.CLAUDE_CODE_ENABLE_TASKS)) return false; // explicitly disabled
  if (A$(process.env.CLAUDE_CODE_ENABLE_TASKS)) return true;  // explicitly enabled
  if (eI()) return false; // non-interactive -> disabled
  return true; // interactive -> enabled
}

function eI() { return !k$.isInteractive }

// isInteractive is set based on:
I = $ || A || L || !process.stdout.isTTY;
bS$(!I) // setIsInteractive(!I)
```

**The key insight**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` controls whether agent team tools (TeamCreate, SendMessage, Teammate) are available. It does **NOT** control whether task management tools (TaskCreate, TaskList, TaskUpdate, TaskGet) are available. Those are controlled by a **separate** gate: `CLAUDE_CODE_ENABLE_TASKS`.

### The Fix: Set `CLAUDE_CODE_ENABLE_TASKS=true`

This was confirmed as a bug in [GitHub Issue #20463](https://github.com/anthropics/claude-code/issues/20463). Anthropic engineer `shawnm-anthropic` provided the official fix:

> "For headless mode, you currently need to opt into the new task tools using the environment variable `CLAUDE_CODE_ENABLE_TASKS=true`. We'll make that the default once folks have had a little bit of time to migrate their integrations."

### Why `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` Was Not Enough

There are **two separate feature gates** at play:

| Environment Variable | What It Controls | Gate Type |
|---|---|---|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | TeamCreate, SendMessage, Teammate tools | Feature flag for agent teams |
| `CLAUDE_CODE_ENABLE_TASKS=true` | TaskCreate, TaskList, TaskUpdate, TaskGet | TTY-bypass override for task tools |

Setting only `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enables the team orchestration tools but does NOT enable the task management tools in non-TTY environments. You need **both** environment variables for full agent team + task management functionality in headless mode.

### Corrected Command

Your command should be updated to include `CLAUDE_CODE_ENABLE_TASKS=true`:

```bash
timeout 3500 env -u CLAUDECODE \
  CLAUDE_CODE_ENABLE_TASKS=true \
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 \
  claude -p "$PROMPT" \
  --plugin-dir "$PLUGIN_DIR" \
  --model claude-opus-4-6 \
  --max-turns 30 < /dev/null > "$OUTPUT_FILE" 2>&1
```

Alternatively, you can set it in `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_ENABLE_TASKS": "true"
  }
}
```

### Tool Availability Matrix by Environment

| Environment | isTTY | TaskCreate Available? | Notes |
|---|---|---|---|
| CLI terminal (interactive) | true | YES | Works by default |
| CLI headless (`-p`) | false | NO (default) | Requires `CLAUDE_CODE_ENABLE_TASKS=true` |
| CLI headless (`-p`) + env var | false | YES | With `CLAUDE_CODE_ENABLE_TASKS=true` |
| VSCode extension | false | NO | Env var does NOT work (separate bug, Issue #23874) |
| Claude Desktop | false | NO | Same isTTY issue |
| Zed IDE | true | NO | Second gate beyond isTTY detects IDE harness |

### Additional Relevant Environment Variables

| Variable | Description |
|---|---|
| `CLAUDE_CODE_ENABLE_TASKS` | Enable task list tools (TaskCreate, TaskUpdate, etc.). Accepts: "1", "true", "yes", "on". Defaults to enabled only in interactive/TTY mode. |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable experimental agent teams (TeamCreate, Teammate, SendMessage). Set to "1". |
| `CLAUDE_CODE_TASK_LIST_ID` | Persistent cross-session task list identifier. Without this, each session gets a fresh task list. |
| `CLAUDE_AUTO_BACKGROUND_TASKS` | Automatically launches background tasks following inactivity periods. |

### The `--allowedTools` Flag

The `--allowedTools` flag is for **auto-approving** tools that already exist in the environment, not for injecting new tools. Since TaskCreate/TaskList/TaskUpdate are gated out by the `sG()` function before they can even appear in the tool list, `--allowedTools` cannot help here. The tools must first be enabled via `CLAUDE_CODE_ENABLE_TASKS=true`, and then optionally auto-approved via `--allowedTools`.

### Related Issue: Custom Agents and Task Tools

There is a separate but related bug ([Issue #23506](https://github.com/anthropics/claude-code/issues/23506), [Issue #13533](https://github.com/anthropics/claude-code/issues/13533)): when using `claude --agent <name>`, the `Task` tool (the subagent spawner, different from TaskCreate) is missing even though TaskCreate/TaskList/TaskUpdate/TaskGet and Teammate/SendMessage are available. This is a different tool and a different bug.

---

## Key Findings

- **TaskCreate/TaskList/TaskUpdate are disabled in headless mode by default** due to a `process.stdout.isTTY` check that returns `false` in pipe/non-interactive environments.
- **The fix is `CLAUDE_CODE_ENABLE_TASKS=true`** (or "1", "yes", "on") -- this is a DIFFERENT env var from `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.
- **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` only enables TeamCreate/Teammate/SendMessage**, not the TaskCreate/TaskList/TaskUpdate tools.
- **You need BOTH env vars** for full agent teams + task management in headless mode.
- **This was a confirmed bug** (Issue #20463, closed with the env var workaround). Anthropic plans to make task tools default-enabled in headless mode after a migration period.
- **`--allowedTools` cannot fix this** because the tools are gated out before they appear in the available tool list.
- **The `sG()` gate function** in the binary checks `CLAUDE_CODE_ENABLE_TASKS` first, then falls back to the `isInteractive` check. The env var explicitly overrides the TTY check.
- **TodoWrite works because it is a separate, older tool** that is not behind the same task-tools gate.

---

## References

1. **[BUG] Tasks tools not available in headless mode (Issue #20463)** - [https://github.com/anthropics/claude-code/issues/20463](https://github.com/anthropics/claude-code/issues/20463) - The exact bug report. Closed with `CLAUDE_CODE_ENABLE_TASKS=true` workaround confirmed by Anthropic engineer.

2. **[BUG] Task tools disabled in VSCode due to isTTY check (Issue #23874)** - [https://github.com/anthropics/claude-code/issues/23874](https://github.com/anthropics/claude-code/issues/23874) - Detailed decompilation of the gate function `sG()` showing the exact code path. Documents the isTTY check and a second gate for IDE environments.

3. **[BUG] Custom agents cannot spawn subagents (Issue #23506)** - [https://github.com/anthropics/claude-code/issues/23506](https://github.com/anthropics/claude-code/issues/23506) - Related but different issue where `--agent` flag causes the `Task` tool (subagent spawner) to be missing.

4. **[FEATURE] Add native Task orchestration tools to VSCode (Issue #21901)** - [https://github.com/anthropics/claude-code/issues/21901](https://github.com/anthropics/claude-code/issues/21901) - Feature request documenting that VSCode has no access to TaskCreate/TaskList/TaskUpdate/TaskGet.

5. **Claude Code Headless Mode Documentation** - [https://code.claude.com/docs/en/headless](https://code.claude.com/docs/en/headless) - Official docs for `-p` mode. Does not mention `CLAUDE_CODE_ENABLE_TASKS`.

6. **Claude Code Agent Teams Documentation** - [https://code.claude.com/docs/en/agent-teams](https://code.claude.com/docs/en/agent-teams) - Official docs for agent teams. Documents `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` but does not mention `CLAUDE_CODE_ENABLE_TASKS`.

7. **Claude Code CLI Environment Variables (Community Gist)** - [https://gist.github.com/unkn0wncode/f87295d055dd0f0e8082358a0b5cc467](https://gist.github.com/unkn0wncode/f87295d055dd0f0e8082358a0b5cc467) - Community-maintained list of all Claude Code env vars, including `CLAUDE_CODE_ENABLE_TASKS` description.

8. **Task* tools bypass PreToolUse/PostToolUse hooks (Issue #20243)** - [https://github.com/anthropics/claude-code/issues/20243](https://github.com/anthropics/claude-code/issues/20243) - Related issue about task tools bypassing hook controls.

9. **Claude Code Task Management Guide** - [https://claudefa.st/blog/guide/development/task-management](https://claudefa.st/blog/guide/development/task-management) - Community guide covering task system architecture and env vars.

10. **Claude Code Changelog** - [https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) - Official changelog; task tools introduced in v2.1.16+, `CLAUDE_CODE_ENABLE_TASKS` introduced around v2.1.19.

---

## Research Notes

- **Documentation Gap**: Neither the official headless mode docs nor the agent teams docs mention `CLAUDE_CODE_ENABLE_TASKS`. This is a significant documentation omission that causes confusion.
- **Two separate systems**: "Tasks" (TaskCreate/TaskList/TaskUpdate/TaskGet) and "Agent Teams" (TeamCreate/Teammate/SendMessage) are separate feature systems with separate feature gates. The agent teams docs tell users to use TaskCreate for coordinating work, but do not mention it requires a separate env var in headless mode.
- **Future default change**: Anthropic stated they plan to make `CLAUDE_CODE_ENABLE_TASKS` default to `true` in headless mode after a migration period, but as of the latest versions this has not happened yet.
- **VSCode remains broken**: Even with `CLAUDE_CODE_ENABLE_TASKS=true`, task tools do not appear in VSCode (Issue #23874 is still open). There appears to be a second gate beyond isTTY that detects IDE harnesses. This is a separate issue from headless mode.
- **Version sensitivity**: Task tools were introduced in v2.1.16+. Ensure you are running a recent version of Claude Code.
