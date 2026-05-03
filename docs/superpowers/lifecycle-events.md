# Superpowers Lifecycle Events (Plugin Author Reference)

Superpowers core fires lifecycle events at well-defined moments during plan and task workflows. Plugin authors subscribe by dropping shell scripts into a registered directory.

## Quick start

1. Create a directory for your plugin's hook scripts:
   ```bash
   mkdir -p ~/.config/my-plugin/hooks
   ```

2. Add an executable hook script for the event you care about:
   ```bash
   cat > ~/.config/my-plugin/hooks/TaskClaimed.sh <<'EOF'
   #!/usr/bin/env bash
   echo "Task $SP_TASK_NUMBER claimed in $SP_PLAN_PATH" >&2
   EOF
   chmod +x ~/.config/my-plugin/hooks/TaskClaimed.sh
   ```

3. Register the dir in your shell rc:
   ```bash
   export SUPERPOWERS_HOOK_DIRS="$HOME/.config/my-plugin/hooks${SUPERPOWERS_HOOK_DIRS:+:$SUPERPOWERS_HOOK_DIRS}"
   ```

4. Restart your agent session. The hook fires automatically when a task is claimed.

## How dispatch works

When core wants to emit an event, the calling skill resolves the script path through a harness fallback chain and invokes:

```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" <EventName> [key=value ...]
```

`CLAUDE_PLUGIN_ROOT` is set by Claude Code; `CURSOR_PLUGIN_ROOT` by Cursor; users on other harnesses (Codex, Gemini, OpenCode) should export `SUPERPOWERS_ROOT` themselves. If none is set, the emit is silently skipped — no error.

`emit-hook.sh` then:

1. Reads `$SUPERPOWERS_HOOK_DIRS` (colon-separated, like `$PATH`). If unset/empty, exits 0 immediately.
2. Translates each `key=value` arg into an `SP_<KEY>` env var (key uppercased; values may contain `=`).
3. For each registered dir in order, runs `<dir>/<EventName>.sh` if it exists and is executable.
4. Hooks run sequentially, never in parallel. Stdin is `/dev/null`; stdout is discarded; stderr is captured and surfaced.
5. Plugin failures (nonzero exit, timeout, missing exec bit) log a warning to stderr but never propagate. `emit-hook.sh` always exits 0.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `SUPERPOWERS_HOOK_DIRS` | unset (no plugins) | Colon-separated list of plugin hook directories. |
| `SUPERPOWERS_HOOK_TIMEOUT` | `10` | Seconds before a hook script is killed. Integer only. |

## Event catalog

### `PlanWritten`

Fired by `writing-plans` skill after self-review passes.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Absolute path to the plan markdown file |
| `SP_PLAN_TITLE` | H1 heading from the plan |

**Plugin guidance:** plugins may mutate the plan file at this point (e.g., add a `**Refs:** xxx` line to each task body). The implementer prompt sends full task body text, so plan-level enrichment propagates naturally to subagent prompts.

### `TaskClaimed`

Fired when a task transitions to in_progress in `executing-plans` and `subagent-driven-development`.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Plan the task belongs to |
| `SP_TASK_NUMBER` | Integer matching `### Task N:` heading in plan |
| `SP_TASK_TITLE` | Task heading text |

### `TaskCompleted`

Fired when a task reaches completed state. Same payload as `TaskClaimed`.

### `BlockedOnHuman`

Fired when a task cannot proceed and needs human resolution.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Plan the task belongs to |
| `SP_TASK_NUMBER` | Integer matching `### Task N:` heading in plan |
| `SP_TASK_TITLE` | Task heading text |
| `SP_REASON` | Free-text explanation of the block |

## Failure modes

| Condition | Behavior |
|---|---|
| `SUPERPOWERS_HOOK_DIRS` unset/empty | Silent no-op |
| Hook script not present | Silent skip; continue |
| Hook script not executable | Warning logged; skip |
| Hook script exits nonzero | Warning logged; continue |
| Hook script exceeds timeout | Killed (SIGTERM, then SIGKILL after 1s); warning logged; continue |
| `timeout(1)` / `gtimeout(1)` not available | One-time warning; hooks run unbounded |

## Writing a plugin: example

A minimal plugin that logs every event to a file:

```
~/.config/my-plugin/hooks/
├── PlanWritten.sh
├── TaskClaimed.sh
├── TaskCompleted.sh
└── BlockedOnHuman.sh
```

Each script could simply be:

```bash
#!/usr/bin/env bash
set -euo pipefail
event_name="$(basename "$0" .sh)"
echo "[$(date -u +%FT%TZ)] $event_name plan=$SP_PLAN_PATH task=${SP_TASK_NUMBER:-} reason=${SP_REASON:-}" \
  >> "$HOME/.config/my-plugin/events.log"
```

Plugins that don't care about an event simply don't ship a script for it. Multiple plugins coexist by registering multiple dirs in `SUPERPOWERS_HOOK_DIRS`.

## Stability and forward compatibility

- New events may be added in future releases. Plugins ignore events they don't subscribe to.
- New env vars may be added to existing event payloads. Plugins ignore vars they don't read.
- Existing env var names will not change without a major version bump.
- The `SP_*` prefix is reserved for core. Plugins should not rely on or set their own `SP_*` env vars.

## See also

- [Lifecycle Events Design Spec](specs/2026-05-02-lifecycle-events-design.md)
