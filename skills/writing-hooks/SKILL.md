---
name: writing-hooks
description: >
  Use when creating, editing, or debugging Claude Code hooks — lifecycle
  automation, file guards, context injection, permission control, Stop
  continuation judges, or audit logging
license: MIT
compatibility: "claude-code >= 2.1.64"
metadata:
  author: cameronsjo
  version: "1.0"
---

# Writing Hooks

## Overview

**Writing hooks is deterministic enforcement applied to Claude Code's lifecycle.**

Hooks are shell commands, HTTP endpoints, or LLM prompts that execute at specific points in Claude Code's lifecycle. They guarantee behavior that skills can only suggest and rules can only document.

**Core principle:** If it MUST always happen (or never happen), it's a hook. If it requires judgment, it's a skill. If it's a code standard, it's a rule.

**REQUIRED BACKGROUND:** You MUST understand superpowers:test-driven-development before creating hooks. Same discipline: no hook without a failing test first.

## When to Use Hooks vs Skills vs Rules

| Signal | Mechanism | Example |
|--------|-----------|---------|
| Must always block X | Hook (PreToolUse, exit 2) | Block `rm -rf /` |
| Must always inject context | Hook (SessionStart, stdout) | Date/time on every session |
| Must always format after edit | Hook (PostToolUse, command) | Run Prettier on write |
| Requires judgment about approach | Skill | TDD methodology |
| Code standard to follow | Rule (CLAUDE.md) | "Use Conventional Commits" |
| Needs LLM evaluation | Hook (type: prompt/agent) | "Are all tasks complete?" |

## Hook Architecture

Choose event → choose matcher → choose type → handle I/O.

### Lifecycle Events

| Phase | Event | Can Block? | Matcher filters on |
|-------|-------|------------|-------------------|
| Setup | `SessionStart` | No | `startup\|resume\|clear\|compact` |
| Loop | `UserPromptSubmit` | Yes | *(no matcher)* |
| Loop | `PreToolUse` | Yes | tool name |
| Loop | `PermissionRequest` | Yes | tool name |
| Loop | `PostToolUse` | No | tool name |
| Loop | `PostToolUseFailure` | No | tool name |
| Loop | `Notification` | No | notification type |
| Loop | `SubagentStart` | No | agent type |
| Loop | `SubagentStop` | Yes | agent type |
| Loop | `Stop` | Yes | *(no matcher)* |
| Teams | `TeammateIdle` | Yes | *(no matcher)* |
| Teams | `TaskCompleted` | Yes | *(no matcher)* |
| Config | `ConfigChange` | Yes | config source |
| Worktree | `WorktreeCreate` | Yes | *(no matcher)* |
| Worktree | `WorktreeRemove` | No | *(no matcher)* |
| Compact | `PreCompact` | No | `manual\|auto` |
| Teardown | `SessionEnd` | No | exit reason |

Full input schemas and decision control: [Event Schemas](${CLAUDE_SKILL_DIR}/references/event-schemas.md)

### Hook Types

| Type | How it works | Blocks? | Use when |
|------|-------------|---------|----------|
| `command` | Shell script, stdin/stdout/exit codes | Yes | Deterministic checks |
| `http` | POST JSON to URL, response body | Yes (via body) | External services |
| `prompt` | Single-turn LLM evaluation | Yes | Judgment calls |
| `agent` | Multi-turn subagent with tool access | Yes | Verify against codebase |
| `command` + `async: true` | Background, no blocking | No | Long-running side effects |

Full type configuration: [Hook Types](${CLAUDE_SKILL_DIR}/references/hook-types.md)

## Common Patterns

### Guard Pattern (block dangerous actions)
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if echo "$COMMAND" | grep -q 'drop table'; then
  echo "Blocked: dropping tables is not allowed" >&2
  exit 2
fi
exit 0
```

### Context Injection (SessionStart → stdout)
```bash
#!/bin/bash
echo "Current sprint: auth-refactor"
echo "$(git log --oneline -5)"
exit 0  # stdout becomes Claude's context
```

### Continuation Judge (Stop → block to continue)
```json
{ "decision": "block", "reason": "Tests not passing yet" }
```

### Audit Logging (PostToolUse → append)
```bash
jq -r '.tool_input.command' >> ~/.claude/command-log.txt
```

More patterns with complete examples: [Patterns](${CLAUDE_SKILL_DIR}/references/patterns.md)

## Matchers: The #1 Gotcha

**Matchers filter on tool name, NOT permission syntax.**

```yaml
# WRONG — permission syntax, hook never fires
"matcher": "Bash(git commit:*)"

# RIGHT — matches tool name, filter content in script
"matcher": "Bash"
```

Then filter inside the script:
```bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[[ "$COMMAND" != git\ commit* ]] && exit 0
```

**Matcher values by event:**
- Tool events (`PreToolUse`, `PostToolUse`, etc.): `Bash`, `Edit|Write`, `mcp__.*`
- `SessionStart`: `startup`, `resume`, `clear`, `compact`
- `SessionEnd`: `clear`, `logout`, `prompt_input_exit`, `other`
- `Notification`: `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`
- `PreCompact`: `manual`, `auto`
- `ConfigChange`: `user_settings`, `project_settings`, `local_settings`, `skills`
- Events with no matcher: `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`

## TDD for Hooks

Same discipline as writing-skills. **No hook without a failing test first.**

### RED: Baseline Without Hook

Run the scenario without the hook. Document what happens:
- Does Claude execute the dangerous command?
- Does Claude stop when it shouldn't?
- Is context missing after compaction?

### GREEN: Write Minimal Hook

Write the hook addressing exactly what you observed. Test the same scenario — behavior should change.

### REFACTOR: Edge Cases

- False positives (legitimate commands blocked?)
- False negatives (dangerous commands slipping through?)
- Performance (hook adds latency to every tool call?)
- Timeout (hook hangs and blocks Claude?)

**Testing methodology:** [Testing Hooks](${CLAUDE_SKILL_DIR}/references/testing-hooks.md)

### Manual Verification

Test hooks outside Claude Code:
```bash
# Simulate PreToolUse input
echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m test"}}' | ./my-hook.sh
echo $?  # Check exit code
```

## Anti-Patterns

- **Permission-syntax matchers:** `Bash(git commit:*)` never matches — use `Bash`
- **Missing `stop_hook_active` check:** Stop hooks without this guard cause infinite loops
- **grep instead of jq for JSON:** Fragile — breaks on escaped quotes, nested objects
- **No stdin consumption:** Hook must read stdin even if it doesn't use it, or it may hang
- **Missing shebang:** Always include `#!/bin/bash` — hooks run in a fresh shell
- **Blocking on observe-only events:** `PostToolUse` exit 2 shows stderr but can't undo the action
- **Heredoc false positives:** Guard scripts that scan command text match prose in heredocs
- **No timeout:** Long-running hooks block Claude — always set `"timeout"` in config
- **Mixing exit codes and JSON:** Exit 0 for JSON output, exit 2 for stderr blocking — never both

## Hook Locations

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes (commit) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes (bundled) |
| Skill/agent frontmatter `hooks:` | While component active | Yes (in file) |
| Managed policy settings | Organization-wide | Yes (admin) |

## JSON I/O Quick Reference

| Exit Code | Effect |
|-----------|--------|
| `0` | Proceed. Parse stdout for JSON. |
| `2` | Block. stderr → Claude feedback. |
| Other | Non-blocking error. stderr → verbose log. |

Full JSON output schema and decision control: [JSON I/O](${CLAUDE_SKILL_DIR}/references/json-io.md)

## References

- [Event Schemas](${CLAUDE_SKILL_DIR}/references/event-schemas.md) — All 17 events: input fields, decision control
- [Hook Types](${CLAUDE_SKILL_DIR}/references/hook-types.md) — command, http, prompt, agent configuration
- [JSON I/O](${CLAUDE_SKILL_DIR}/references/json-io.md) — Exit codes, JSON output, decision patterns
- [Testing Hooks](${CLAUDE_SKILL_DIR}/references/testing-hooks.md) — TDD methodology for hooks
- [Patterns](${CLAUDE_SKILL_DIR}/references/patterns.md) — Real-world patterns with complete examples
