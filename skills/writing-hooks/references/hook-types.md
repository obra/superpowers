# Hook Types

Four hook types with different execution models. Choose based on what your hook needs to do.

## Command Hooks (`type: "command"`)

Shell commands that receive JSON on stdin and communicate via exit codes + stdout/stderr.

**Configuration:**

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"command"` |
| `command` | Yes | Shell command to execute |
| `timeout` | No | Seconds before canceling (default: 600) |
| `statusMessage` | No | Custom spinner message while hook runs |
| `async` | No | Run in background without blocking (default: false) |
| `once` | No | Run only once per session, then removed (skills only) |

**Path variables:**
- `$CLAUDE_PROJECT_DIR` — project root
- `${CLAUDE_PLUGIN_ROOT}` — plugin root directory (for plugin hooks)

**Example:**
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-style.sh",
  "timeout": 30,
  "statusMessage": "Checking style..."
}
```

## HTTP Hooks (`type: "http"`)

POST event JSON to an HTTP endpoint. Response body uses the same JSON output format as command hooks.

**Configuration:**

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"http"` |
| `url` | Yes | URL to POST to |
| `headers` | No | Key-value pairs. Values support `$VAR_NAME` interpolation |
| `allowedEnvVars` | No | Env var names allowed in header interpolation |
| `timeout` | No | Seconds before canceling (default: 600) |
| `statusMessage` | No | Custom spinner message |

**Error handling:** Non-2xx responses, connection failures, and timeouts are non-blocking errors. To block a tool call, return 2xx with a JSON body containing the decision.

**Example:**
```json
{
  "type": "http",
  "url": "http://localhost:8080/hooks/pre-tool-use",
  "headers": {
    "Authorization": "Bearer $MY_TOKEN"
  },
  "allowedEnvVars": ["MY_TOKEN"],
  "timeout": 30
}
```

**Limitation:** HTTP hooks can only be configured by editing settings JSON directly. The `/hooks` menu only supports command hooks.

## Prompt Hooks (`type: "prompt"`)

Single-turn LLM evaluation. Sends your prompt + hook input to a Claude model. Returns a yes/no decision.

**Configuration:**

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"prompt"` |
| `prompt` | Yes | Prompt text. `$ARGUMENTS` placeholder for hook input JSON |
| `model` | No | Model to use (default: fast model) |
| `timeout` | No | Seconds before canceling (default: 30) |

**Response schema:**
```json
{ "ok": true }
{ "ok": false, "reason": "Explanation shown to Claude" }
```

**Use when:** The hook input data alone is enough to decide. No file access needed.

**Supported events:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Stop`, `SubagentStop`, `TaskCompleted`, `UserPromptSubmit`

**Example:**
```json
{
  "type": "prompt",
  "prompt": "Check if all tasks are complete. If not, respond with {\"ok\": false, \"reason\": \"what remains\"}. Context: $ARGUMENTS",
  "timeout": 30
}
```

## Agent Hooks (`type: "agent"`)

Multi-turn verification. Spawns a subagent with Read, Grep, Glob tool access to verify conditions.

**Configuration:**

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"agent"` |
| `prompt` | Yes | What to verify. `$ARGUMENTS` for hook input JSON |
| `model` | No | Model to use (default: fast model) |
| `timeout` | No | Seconds before canceling (default: 60) |

**Response schema:** Same as prompt hooks: `{ "ok": true/false, "reason": "..." }`

**Use when:** Verification requires reading files, searching code, or running commands.

**Supported events:** Same as prompt hooks.

**Example:**
```json
{
  "type": "agent",
  "prompt": "Verify all unit tests pass. Run the test suite and check results. $ARGUMENTS",
  "timeout": 120
}
```

## Async Command Hooks

Not a separate type — add `"async": true` to any command hook.

**Behavior:**
- Runs in background, Claude continues immediately
- Cannot block or return decisions (action already proceeded)
- Output delivered on next conversation turn via `systemMessage` or `additionalContext`
- Each execution creates a separate background process (no deduplication)

**Only `type: "command"` supports async.** Prompt and agent hooks cannot run asynchronously.

**Example:**
```json
{
  "type": "command",
  "command": "./scripts/run-tests.sh",
  "async": true,
  "timeout": 300
}
```

## Type Selection Guide

| Need | Type |
|------|------|
| Deterministic check (regex, file exists, exit code) | `command` |
| External service integration | `http` |
| "Should Claude continue?" judgment call | `prompt` |
| "Do the tests pass? Check the files." | `agent` |
| Long-running side effect (tests, deploy) | `command` + `async: true` |
| Non-git worktree operations | `command` only |

## Event Compatibility

| Events | Supported types |
|--------|----------------|
| PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Stop, SubagentStop, TaskCompleted, UserPromptSubmit | command, http, prompt, agent |
| ConfigChange, Notification, PreCompact, SessionEnd, SessionStart, SubagentStart, TeammateIdle, WorktreeCreate, WorktreeRemove | command only |
