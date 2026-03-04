# Hook Patterns

Real-world patterns from production hook deployments. Each pattern includes the config, the script, and gotchas.

## Pattern 1: Guard (Block Dangerous Actions)

**Event:** PreToolUse | **Matcher:** `Bash` | **Type:** command

Block specific commands by parsing `tool_input.command` from stdin.

**Config (`.claude/settings.json`):**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-dangerous.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Script:**
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block rm -rf with root-level paths
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/($|[^.])'; then
  echo "Blocked: rm -rf with root-level path" >&2
  exit 2
fi

exit 0
```

**Gotchas:**
- Matcher is `Bash` not `Bash(rm:*)` — filter content in script
- `exit 2` blocks, stderr becomes Claude's feedback
- Guard runs on EVERY Bash call — keep it fast
- Heredoc content in commands can trigger false positives

## Pattern 2: File Protection (Block Edits to Sensitive Files)

**Event:** PreToolUse | **Matcher:** `Edit|Write` | **Type:** command

Prevent edits to sensitive files by checking `tool_input.file_path`.

**Script:**
```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED=(".env" "package-lock.json" ".git/" "credentials")

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2
  fi
done

exit 0
```

## Pattern 3: Context Injection (SessionStart)

**Event:** SessionStart | **Matcher:** `startup|resume|clear|compact` | **Type:** command

Inject dynamic context at session start. stdout becomes Claude's context.

**Config:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/session-context.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Script:**
```bash
#!/bin/bash
echo "Current date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Recent commits:"
git log --oneline -5 2>/dev/null
echo "Open issues: $(gh issue list --limit 5 --json title -q '.[].title' 2>/dev/null | head -5)"
exit 0
```

**For environment variables, use `CLAUDE_ENV_FILE`:**
```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
fi
echo "Environment configured"
exit 0
```

## Pattern 4: Continuation Judge (Stop)

**Event:** Stop | **Type:** command or prompt

Prevent Claude from stopping before work is complete.

**Simple version (command):**
```bash
#!/bin/bash
INPUT=$(cat)

# CRITICAL: Prevent infinite loops
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

# Check if tests pass
if ! npm test &>/dev/null; then
  echo '{"decision": "block", "reason": "Tests are failing. Fix them before stopping."}'
  exit 0
fi

exit 0
```

**LLM version (prompt):**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all requested tasks are complete based on the conversation. Context: $ARGUMENTS. Respond with {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"what remains\"} to continue.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Gotchas:**
- ALWAYS check `stop_hook_active` in command hooks
- Throttle continuations to prevent runaway loops
- Stop fires when Claude finishes responding, NOT only at task completion
- Stop does NOT fire on user interrupts

## Pattern 5: Auto-Format (PostToolUse)

**Event:** PostToolUse | **Matcher:** `Edit|Write` | **Type:** command

Run formatter after every file edit.

**Config:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Gotcha:** PostToolUse cannot undo the action. The tool already ran. `exit 2` shows stderr to Claude but doesn't revert.

## Pattern 6: Audit Logging (PostToolUse)

**Event:** PostToolUse | **Matcher:** `Bash` | **Type:** command

Log every command Claude runs.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' >> ~/.claude/command-log.txt"
          }
        ]
      }
    ]
  }
}
```

## Pattern 7: Desktop Notification

**Event:** Notification | **Type:** command

Get alerted when Claude needs attention.

**macOS:**
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

## Pattern 8: Branch Warning (PreToolUse)

**Event:** PreToolUse | **Matcher:** `Edit|Write` | **Type:** command

Warn (but don't block) when editing on main branch.

```bash
#!/bin/bash
INPUT=$(cat)

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  # Use marker file for one-warning-per-session
  MARKER="/tmp/.claude-main-warn-$$"
  if [[ ! -f "$MARKER" ]]; then
    touch "$MARKER"
    echo "Warning: editing directly on $BRANCH. Consider creating a feature branch." >&2
  fi
fi

exit 0  # Warn only, never block
```

## Pattern 9: Compaction Reminder (PreCompact)

**Event:** PreCompact | **Type:** command

Remind Claude to save context before compaction.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: Save important context to auto memory before compaction.'"
          }
        ]
      }
    ]
  }
}
```

## Pattern 10: Config Change Audit

**Event:** ConfigChange | **Type:** command

Track settings changes for compliance.

```json
{
  "hooks": {
    "ConfigChange": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{timestamp: now | todate, source: .source, file: .file_path}' >> ~/claude-config-audit.log"
          }
        ]
      }
    ]
  }
}
```

## Pattern 11: Plugin Hook (hooks.json)

**Location:** `hooks/hooks.json` in plugin root

Plugin hooks merge with user and project hooks when the plugin is enabled.

```json
{
  "description": "Guard against dangerous operations",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/my-guard.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Key:** Use `${CLAUDE_PLUGIN_ROOT}` for portable paths within the plugin.

## Pattern 12: Skill/Agent Scoped Hook

Hooks defined in skill or agent frontmatter. Active only while the component runs.

```yaml
---
name: secure-operations
description: Use when performing operations requiring security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

For agents, `Stop` hooks auto-convert to `SubagentStop`.

## Anti-Pattern: Redundant Guards

Don't duplicate what the permissions system already handles:

```json
// WRONG — permissions already block this
"deny": ["Bash(rm -rf /)"],
// ALSO a hook that blocks rm -rf /

// RIGHT — use permissions for static blocks, hooks for dynamic checks
"deny": ["Bash(rm -rf /)"],
// Hook checks: is the target directory in a protected list?
```

Hooks are for dynamic, context-dependent checks. Static blocks belong in permissions.
