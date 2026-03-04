# Hook JSON I/O

How hooks communicate with Claude Code: stdin input, exit codes, stdout/stderr output, and structured JSON responses.

## Input

Command hooks receive JSON on stdin. HTTP hooks receive it as POST body. Every event includes the [common input fields](${CLAUDE_SKILL_DIR}/references/event-schemas.md) plus event-specific fields.

**Reading input in bash:**
```bash
#!/bin/bash
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
```

**CRITICAL:** Always consume stdin, even if you don't use it. Not reading stdin can cause the hook to hang.

## Exit Codes

| Code | Effect | stdout | stderr |
|------|--------|--------|--------|
| `0` | Proceed | Parsed for JSON | Ignored (verbose mode only) |
| `2` | Block | **Ignored** (including JSON) | Fed to Claude as error message |
| Other | Proceed (non-blocking error) | Ignored | Shown in verbose mode |

**Choose one approach:** Exit codes OR JSON. Never both. Exit 2 ignores all stdout (including JSON).

## stdout Behavior by Event

| Event | stdout on exit 0 |
|-------|-------------------|
| `SessionStart` | Added as Claude's context |
| `UserPromptSubmit` | Added as context (plain text or JSON) |
| `WorktreeCreate` | Absolute path to created worktree |
| All other events | Parsed for JSON, shown in verbose mode only |

## JSON Output Schema

Exit 0 and print a JSON object to stdout for structured control.

### Universal Fields

| Field | Default | Description |
|-------|---------|-------------|
| `continue` | `true` | `false` stops Claude entirely (takes precedence over all decisions) |
| `stopReason` | none | Message shown to user when `continue: false` |
| `suppressOutput` | `false` | Hide stdout from verbose mode |
| `systemMessage` | none | Warning message shown to user |

**Stop Claude entirely:**
```json
{ "continue": false, "stopReason": "Build failed, fix errors before continuing" }
```

### Decision Patterns by Event

Three different patterns depending on the event:

#### Pattern 1: Top-level `decision` (most events)

Used by: `UserPromptSubmit`, `PostToolUse`, `PostToolUseFailure`, `Stop`, `SubagentStop`, `ConfigChange`

```json
{
  "decision": "block",
  "reason": "Explanation for decision"
}
```

Omit `decision` to allow. The only value is `"block"`.

#### Pattern 2: `hookSpecificOutput` with `permissionDecision` (PreToolUse)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Database writes not allowed",
    "updatedInput": { "command": "echo 'blocked'" },
    "additionalContext": "Production environment detected"
  }
}
```

| Value | Effect |
|-------|--------|
| `allow` | Bypass permission system entirely |
| `deny` | Block the tool call, reason shown to Claude |
| `ask` | Show permission prompt to user |

`updatedInput` modifies tool arguments before execution. Combine with `allow` to auto-approve modified input, or `ask` to show modified input to user.

#### Pattern 3: `hookSpecificOutput` with `decision.behavior` (PermissionRequest)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": { "command": "npm run lint" },
      "updatedPermissions": [{ "type": "toolAlwaysAllow", "tool": "Bash" }]
    }
  }
}
```

For deny: `decision.message` (tells Claude why), `decision.interrupt` (`true` stops Claude).

#### Pattern 4: Exit code only (TeammateIdle, TaskCompleted)

No JSON support. Exit 2 blocks, stderr is fed back as feedback.

#### Pattern 5: stdout path (WorktreeCreate)

Hook prints absolute path to stdout. Non-zero exit fails creation.

### Additional Context

Several events support injecting context via `additionalContext` in `hookSpecificOutput`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Sprint: auth-refactor. Focus on login endpoint."
  }
}
```

Supported by: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `Notification`, `SubagentStart`

## HTTP Response Handling

| Response | Effect |
|----------|--------|
| 2xx + empty body | Success, equivalent to exit 0 |
| 2xx + plain text | Success, text added as context |
| 2xx + JSON body | Success, parsed same as command hook JSON |
| Non-2xx | Non-blocking error, execution continues |
| Connection failure/timeout | Non-blocking error, execution continues |

**HTTP cannot block via status code.** To block, return 2xx with a JSON body containing the decision.

## Prompt/Agent Hook Response

Prompt and agent hooks use a different schema:

```json
{ "ok": true }
{ "ok": false, "reason": "Explanation shown to Claude" }
```

`ok: false` blocks the action. `reason` is required when blocking.

## Shell Profile Interference

If your shell profile (`~/.zshrc`, `~/.bashrc`) contains unconditional `echo` statements, they pollute stdout and break JSON parsing:

```
Shell ready on arm64      <-- from .zshrc
{"decision": "block"}     <-- from hook
```

**Fix:** Wrap echo statements in interactive-only guards:
```bash
if [[ $- == *i* ]]; then
  echo "Shell ready"
fi
```

## Debugging

- **Verbose mode:** `Ctrl+O` to see hook output in transcript
- **Debug mode:** `claude --debug` for full execution details
- **Manual testing:**
  ```bash
  echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
  echo $?
  ```
