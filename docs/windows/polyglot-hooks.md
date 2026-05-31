# Cross-Platform Hook Dispatcher for Claude Code

Claude Code plugins need hook commands that can run on Windows, macOS, and Linux. Superpowers uses a small polyglot dispatcher, `hooks/run-hook.cmd`, so the same hook entry can be invoked by Windows `cmd.exe` and by Unix shells.

## The Problem

Claude Code runs hook commands through the system shell:

- Windows: `cmd.exe`
- macOS/Linux: `bash` or `sh`

That creates a few portability traps:

1. Windows cannot run shell scripts directly from `cmd.exe`.
2. Git Bash may be installed but not available on `PATH`.
3. Paths may contain spaces, especially under plugin install directories.
4. Claude Code on Windows may prepend `bash` to commands that contain `.sh`, which can interfere with wrapper-based hook dispatch.

## Current Structure

Superpowers uses one generic dispatcher and extensionless hook scripts:

```text
hooks/
├── hooks.json           # Points Claude Code at run-hook.cmd
├── run-hook.cmd         # Cross-platform dispatcher
└── session-start        # Hook logic, run through bash
```

The hook script is named `session-start`, not `session-start.sh`. The extensionless name is deliberate: it avoids Claude Code's Windows `.sh` auto-detection path while still letting `run-hook.cmd` invoke the script with bash.

## hooks.json

The Claude Code hook config points at the dispatcher and passes the extensionless script name:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

The plugin root is quoted because install paths may contain spaces.

## How run-hook.cmd Works

### On Windows

When `cmd.exe` runs `run-hook.cmd`, it:

1. Requires a script name argument such as `session-start`.
2. Uses `%~dp0` to locate the `hooks/` directory.
3. Looks for Git Bash in the standard locations:
   - `C:\Program Files\Git\bin\bash.exe`
   - `C:\Program Files (x86)\Git\bin\bash.exe`
4. Falls back to `bash` on `PATH`.
5. Runs the extensionless hook script with bash.
6. Exits with the hook script's exit code.

If no bash executable is found, the dispatcher exits `0` without printing an error. That keeps Superpowers usable on Windows even when SessionStart context injection cannot run.

### On macOS and Linux

Unix shells treat the initial CMD block as a no-op heredoc section, then run the Unix portion:

```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

The named extensionless script is executed with `bash` from the same `hooks/` directory.

## Writing Hook Scripts

Put hook logic in extensionless bash scripts under `hooks/` and invoke them through `run-hook.cmd`.

Do:

- Use extensionless script names, for example `session-start`.
- Quote variable expansions: `"$VAR"`.
- Prefer bash builtins where practical.
- Pass the script name as the first argument to `run-hook.cmd`.

Avoid:

- Pointing `hooks.json` directly at `.sh` files.
- Reintroducing per-hook `.cmd` wrappers when the generic dispatcher is enough.
- Depending on `cygpath` or `bash -l`; the current dispatcher does not need either.
- Treating missing bash as a hard failure for startup context injection.

## Testing on Windows

You can simulate the Claude Code hook command from PowerShell:

```powershell
$env:CLAUDE_PLUGIN_ROOT = "C:\path\to\plugin"
cmd /c ""%CLAUDE_PLUGIN_ROOT%\hooks\run-hook.cmd" session-start"
```

If Git Bash is installed in a standard location or `bash` is on `PATH`, the hook script should run. If bash is absent, the command should exit cleanly.

## Troubleshooting

### The hook does nothing on Windows

Check whether Git Bash is installed in one of the standard locations or whether `bash` is available on `PATH`. The dispatcher exits cleanly when bash is not found.

### The script opens in an editor or Claude prepends bash unexpectedly

Make sure `hooks.json` points to `run-hook.cmd` and passes an extensionless script name such as `session-start`. Do not point hooks directly at `.sh` files.

### A path with spaces fails

Keep `${CLAUDE_PLUGIN_ROOT}` quoted in `hooks.json`. The dispatcher derives the hook directory from `%~dp0` on Windows and from `dirname "$0"` on Unix.

## Related Issues

- [anthropics/claude-code#9758](https://github.com/anthropics/claude-code/issues/9758) - `.sh` scripts open in editor on Windows
- [anthropics/claude-code#3417](https://github.com/anthropics/claude-code/issues/3417) - Hooks don't work on Windows
- [anthropics/claude-code#6023](https://github.com/anthropics/claude-code/issues/6023) - `CLAUDE_PROJECT_DIR` not found
