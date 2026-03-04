# Hook Event Schemas

Complete input schemas and decision control for all 17 hook events.

## Common Input Fields

Every event receives these fields as JSON on stdin (command hooks) or POST body (HTTP hooks):

| Field | Description |
|-------|-------------|
| `session_id` | Current session identifier |
| `transcript_path` | Path to conversation JSON |
| `cwd` | Working directory when hook fires |
| `permission_mode` | `default`, `plan`, `acceptEdits`, `dontAsk`, `bypassPermissions` |
| `hook_event_name` | Name of the event that fired |

---

## Setup Events

### SessionStart

**When:** New session, resume, /clear, or compaction.

**Matcher values:** `startup`, `resume`, `clear`, `compact`

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `source` | How the session started: `startup`, `resume`, `clear`, `compact` |
| `model` | Model identifier (e.g., `claude-sonnet-4-6`) |
| `agent_type` | Agent name if started with `claude --agent <name>` (optional) |

**Decision control:**
- stdout text → added as Claude's context
- `additionalContext` in `hookSpecificOutput` → added as context
- Access `CLAUDE_ENV_FILE` to persist environment variables for subsequent Bash commands
- Cannot block (exit 2 shows stderr to user only)

**Environment variable persistence:**
```bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
fi
```

---

## Agentic Loop Events

### UserPromptSubmit

**When:** User submits a prompt, before Claude processes it.

**No matcher support** — fires on every prompt submission.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `prompt` | The text the user submitted |

**Decision control:**
- stdout text → added as context (non-JSON)
- `additionalContext` → added as context (JSON)
- `decision: "block"` → prevents prompt processing, erases prompt
- `reason` → shown to user when blocking

### PreToolUse

**When:** After Claude creates tool parameters, before executing the tool call.

**Matcher:** tool name — `Bash`, `Edit|Write`, `mcp__.*`, etc.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `tool_name` | Name of the tool (`Bash`, `Edit`, `Write`, `Read`, `Glob`, `Grep`, `Agent`, `WebFetch`, `WebSearch`, or MCP tool) |
| `tool_input` | Tool-specific arguments (see below) |
| `tool_use_id` | Unique identifier for this tool call |

**Tool input schemas:**

**Bash:** `command` (string), `description` (string, optional), `timeout` (number, optional), `run_in_background` (boolean, optional)

**Write:** `file_path` (string), `content` (string)

**Edit:** `file_path` (string), `old_string` (string), `new_string` (string), `replace_all` (boolean, optional)

**Read:** `file_path` (string), `offset` (number, optional), `limit` (number, optional)

**Glob:** `pattern` (string), `path` (string, optional)

**Grep:** `pattern` (string), `path` (string, optional), `glob` (string, optional), `output_mode` (string, optional), `-i` (boolean, optional), `multiline` (boolean, optional)

**WebFetch:** `url` (string), `prompt` (string)

**WebSearch:** `query` (string), `allowed_domains` (array, optional), `blocked_domains` (array, optional)

**Agent:** `prompt` (string), `description` (string), `subagent_type` (string), `model` (string, optional)

**Decision control (via `hookSpecificOutput`):**

| Field | Description |
|-------|-------------|
| `permissionDecision` | `allow` (bypass permission), `deny` (block), `ask` (prompt user) |
| `permissionDecisionReason` | For allow/ask: shown to user. For deny: shown to Claude |
| `updatedInput` | Modify tool input before execution |
| `additionalContext` | Context for Claude before tool executes |

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Database writes are not allowed"
  }
}
```

### PermissionRequest

**When:** A permission dialog is about to be shown to the user.

**Matcher:** tool name (same as PreToolUse).

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `tool_name` | Tool requesting permission |
| `tool_input` | Tool arguments |
| `permission_suggestions` | Array of "always allow" options |

**Decision control (via `hookSpecificOutput`):**

| Field | Description |
|-------|-------------|
| `decision.behavior` | `allow` (grant) or `deny` |
| `decision.updatedInput` | For allow: modify tool input |
| `decision.updatedPermissions` | For allow: apply permission rules |
| `decision.message` | For deny: tells Claude why |
| `decision.interrupt` | For deny: if `true`, stops Claude |

### PostToolUse

**When:** After a tool completes successfully.

**Matcher:** tool name.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `tool_name` | Tool that completed |
| `tool_input` | Arguments sent to the tool |
| `tool_response` | Result returned by the tool |
| `tool_use_id` | Unique identifier |

**Decision control:**
- `decision: "block"` + `reason` → prompts Claude with reason (tool already ran, can't undo)
- `additionalContext` → additional context for Claude
- `updatedMCPToolOutput` → for MCP tools, replaces tool output

### PostToolUseFailure

**When:** A tool execution fails (throws error or returns failure).

**Matcher:** tool name.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `tool_name` | Tool that failed |
| `tool_input` | Arguments sent |
| `tool_use_id` | Unique identifier |
| `error` | String describing what went wrong |
| `is_interrupt` | Whether failure was caused by user interruption (optional) |

**Decision control:**
- `additionalContext` → context for Claude alongside the error
- Cannot block (tool already failed)

### Notification

**When:** Claude Code sends a notification.

**Matcher values:** `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `message` | Notification text |
| `title` | Notification title (optional) |
| `notification_type` | Which type fired |

**Decision control:**
- `additionalContext` → added to conversation
- Cannot block notifications

### SubagentStart

**When:** A subagent is spawned via the Agent tool.

**Matcher:** agent type — `Bash`, `Explore`, `Plan`, or custom agent names.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `agent_id` | Unique identifier for the subagent |
| `agent_type` | Agent name |

**Decision control:**
- `additionalContext` → injected into subagent's context
- Cannot block subagent creation

### SubagentStop

**When:** A subagent finishes responding.

**Matcher:** agent type (same as SubagentStart).

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `stop_hook_active` | `true` if already continuing from a stop hook |
| `agent_id` | Subagent identifier |
| `agent_type` | Agent name |
| `agent_transcript_path` | Path to subagent's transcript |
| `last_assistant_message` | Text of subagent's final response |

**Decision control:** Same as Stop — `decision: "block"` + `reason` prevents subagent from stopping.

### Stop

**When:** Main Claude Code agent finishes responding. Does NOT fire on user interrupts.

**No matcher support.**

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `stop_hook_active` | `true` if already continuing from a previous stop hook |
| `last_assistant_message` | Text of Claude's final response |

**Decision control:**
- `decision: "block"` + `reason` → prevents Claude from stopping, `reason` becomes next instruction
- **CRITICAL:** Check `stop_hook_active` to prevent infinite loops

```bash
INPUT=$(cat)
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0  # Allow Claude to stop — already continued once
fi
```

---

## Team Events

### TeammateIdle

**When:** Agent team teammate is about to go idle after finishing its turn.

**No matcher support.**

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `teammate_name` | Name of the teammate |
| `team_name` | Name of the team |

**Decision control:** Exit code only. Exit 2 → teammate receives stderr as feedback and continues.

### TaskCompleted

**When:** A task is being marked as completed (via TaskUpdate or teammate finishing with in-progress tasks).

**No matcher support.**

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `task_id` | Task identifier |
| `task_subject` | Task title |
| `task_description` | Task details (optional) |
| `teammate_name` | Teammate completing (optional) |
| `team_name` | Team name (optional) |

**Decision control:** Exit code only. Exit 2 → task stays in-progress, stderr fed to model.

---

## Configuration Events

### ConfigChange

**When:** A configuration file changes during a session.

**Matcher values:** `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills`

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `source` | Configuration type that changed |
| `file_path` | Path to the changed file (optional) |

**Decision control:**
- `decision: "block"` + `reason` → prevents change from taking effect
- `policy_settings` changes cannot be blocked (hooks still fire for audit)

---

## Worktree Events

### WorktreeCreate

**When:** Worktree is being created via `--worktree` or `isolation: "worktree"`. Replaces default git behavior.

**No matcher support.** Only `type: "command"` hooks supported.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `name` | Slug identifier for the new worktree |

**Decision control:** Hook prints absolute path to created worktree on stdout. Non-zero exit fails creation.

### WorktreeRemove

**When:** Worktree is being removed at session exit or subagent finish.

**No matcher support.** Only `type: "command"` hooks supported.

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `worktree_path` | Absolute path to the worktree being removed |

**Decision control:** None. Cannot block removal. Failures logged in debug mode only.

---

## Lifecycle Events

### PreCompact

**When:** Before context compaction.

**Matcher values:** `manual`, `auto`

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `trigger` | `manual` (/compact) or `auto` (context window full) |
| `custom_instructions` | What user passed to /compact (manual only) |

**Decision control:** Cannot block. Used for side effects (save context, remind user).

### SessionEnd

**When:** Session terminates.

**Matcher values:** `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`

**Additional input fields:**

| Field | Description |
|-------|-------------|
| `reason` | Why the session ended |

**Decision control:** None. Cannot block termination. Used for cleanup.
