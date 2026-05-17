# Installing Superpowers Optimized for Codex

## What you get

| Feature | macOS / Linux (hooks enabled) | Windows native |
|---|---|---|
| 30+ workflow skills | ✅ | ✅ |
| Explicit/implicit skill activation | ✅ | ✅ |
| AGENTS.md workflow guidance | ✅ | ✅ |
| Startup context injection (project map, state, known issues) | ✅ with hooks | ❌ |
| Proactive skill routing on every prompt | ✅ with hooks | ❌ |
| Dangerous Bash command blocking | ✅ with hooks | ❌ |
| Stop-time discipline reminders | ⚠️ implemented; revalidate live after install/update | ❌ |
| Custom agents (code-reviewer, red-team) | ✅ manual install | ✅ manual install |
| Bash command compression | ✅ reactive `PostToolUse(Bash)` smart-compress | ❌ |
| Read/Write interception | ❌ Codex limitation | ❌ |
| Subagent leakage guard | ❌ Codex limitation | ❌ |

**Skills work on all platforms. Lifecycle hooks require macOS or Linux.**

**Important:** This document treats the **standard install** as the complete install for the current platform. On macOS/Linux that means skills + hooks + custom agents. On Windows native that means skills + custom agents; hooks remain unavailable because Codex does not support them there. A reduced setup may still function, but it should be treated as a fallback, not the default install story.

**Minimum tested Codex CLI for live hooks:** `codex-cli 0.118.0`. Older Codex builds may silently ignore the current top-level `hooks` registry shape.

---

## Prerequisites

- OpenAI Codex CLI (`npm i -g @openai/codex`)
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/REPOZY/superpowers-prepared.git ~/.codex/superpowers-prepared
```

### 2. Create the skills symlink

**macOS / Linux:**
```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers-prepared/skills ~/.agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers-prepared\skills"
```

### 3. Install custom agents

Installs `code-reviewer` and `red-team` agents for use in Codex subagent workflows.

These agent files are part of the standard Codex install for this plugin. Without them, the install is intentionally incomplete.

**macOS / Linux:**
```bash
mkdir -p ~/.codex/agents
cp ~/.codex/superpowers-prepared/codex-agents/*.toml ~/.codex/agents/
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
Copy-Item "$env:USERPROFILE\.codex\superpowers-prepared\codex-agents\*.toml" "$env:USERPROFILE\.codex\agents\"
```

After installing, these agents are available by name in Codex subagent workflows (e.g., "Use the code-reviewer agent to review this branch").

> **Why this is a separate filesystem step:** Codex does not officially support bundling TOML custom agents via the plugin manifest. Manual placement in `~/.codex/agents/` is required by the platform.

### 4. (macOS/Linux only) Enable lifecycle hooks

Hooks add startup context injection (project map, known issues, session state). They are **disabled on Windows native** — skip this step on Windows.

**4a.** Add to `~/.codex/config.toml`:
```toml
[features]
codex_hooks = true
```

**4b.** Link the hook registry:
```bash
ln -s ~/.codex/superpowers-prepared/hooks/codex-hooks.json ~/.codex/hooks.json
```

If `~/.codex/hooks.json` already exists, merge this plugin's Codex entries from the top-level `hooks` object in `~/.codex/superpowers-prepared/hooks/codex-hooks.json` into your existing file instead of replacing it.

### 5. Restart Codex

Quit and relaunch the CLI. Skills, hooks, and custom agents are discovered at startup.

### 6. Verify complete setup

**Check skills:**
```bash
ls -la ~/.agents/skills/superpowers
```

**Check custom agents:**
```bash
ls -la ~/.codex/agents/code-reviewer.toml ~/.codex/agents/red-team.toml
```

**Check hooks (macOS/Linux, if you completed step 4):**
```bash
grep -n "codex_hooks" ~/.codex/config.toml
test -f ~/.codex/hooks.json && echo "hooks.json present"
grep -n '"hooks"' ~/.codex/hooks.json
```

Confirm `codex --version` reports `0.118.0` or newer before trusting live hook behavior.

---

## Hook behavior notes

**What hooks do:**
- **SessionStart:** Inject project context (project map, state, known issues, using-superpowers skill) at session start. Check for plugin updates (non-destructive: only applies if the clone is clean and can fast-forward to `origin/main`).
- **UserPromptSubmit:** Proactive skill routing — analyzes each prompt and injects skill suggestions before the model responds.
- **PreToolUse (Bash):** Safety dispatcher — blocks dangerous shell commands (rm -rf ~, curl|sh, fork bombs, etc.) and secret exfiltration attempts before execution.
- **PostToolUse (Bash):** Reactive smart-compress — replaces verbose Bash output after execution with a compressed summary when an existing compression rule matches and the summary is materially smaller.
- **Stop:** Discipline reminders — TDD warning if source files changed without test changes, commit reminder if many files are uncommitted, decision log prompt if core files were modified. Treat visible live surfacing as a required post-install verification step until confirmed in the actual installed environment.

Hooks are helpful Codex guardrails, not full Claude Code parity. Codex still does not expose Claude's `PostToolUse(Edit|Write|Skill)`, `SubagentStop`, `Read/Edit/Write` interception, or Claude's pre-execution Bash rewrite path. The Codex `PostToolUse(Bash)` smart-compress hook is reactive: it replaces noisy Bash output after execution, which improves context usage but is not the same mechanism as Claude's `PreToolUse` rewrite.

**Windows:** Codex lifecycle hooks are disabled on Windows native. This is a Codex platform limitation. Skills still work. Use WSL for hook functionality on Windows.

To disable startup update checks:
- Set `SUPERPOWERS_AUTO_UPDATE=0`, or
- Create `~/.config/superpowers/update.conf` with `auto_update=false`

---

## Migrating from old install path

If you previously installed to `~/.codex/superpowers` (old path):

```bash
# Update and rename
if [ -d ~/.codex/superpowers ] && [ ! -d ~/.codex/superpowers-prepared ]; then
  mv ~/.codex/superpowers ~/.codex/superpowers-prepared
fi
cd ~/.codex/superpowers-prepared && git pull

# Recreate symlink to new path
rm -f ~/.agents/skills/superpowers
ln -s ~/.codex/superpowers-prepared/skills ~/.agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
if ((Test-Path "$env:USERPROFILE\.codex\superpowers") -and -not (Test-Path "$env:USERPROFILE\.codex\superpowers-prepared")) {
  Rename-Item "$env:USERPROFILE\.codex\superpowers" "superpowers-prepared"
}
cmd /c rmdir "$env:USERPROFILE\.agents\skills\superpowers"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers-prepared\skills"
```

Also remove any old bootstrap block from `~/.codex/AGENTS.md` referencing `superpowers-codex bootstrap` — no longer needed.

---

## Updating

```bash
cd ~/.codex/superpowers-prepared && git pull
cp ~/.codex/superpowers-prepared/codex-agents/*.toml ~/.codex/agents/
```

Skills and hooks update from the clone automatically. Custom agents are copied files, so re-copy them after pulling updates.

After updating hooks, restart Codex and rerun live smoke checks against the actual installed home. `Stop` reminder visibility is the main behavior still worth revalidating.

### Clean reinstall fallback

Use a clean reinstall instead of the standard update flow when:

- the installed clone is dirty or diverged
- the install path changed
- hooks still behave inconsistently after update
- custom agent files are stale or missing
- you want a pristine known-good install and are fine losing local changes inside the installed clone

**Warning:** this removes the installed clone and any local changes inside `~/.codex/superpowers-prepared`.

**macOS / Linux:**
```bash
rm -f ~/.agents/skills/superpowers
rm -f ~/.codex/agents/code-reviewer.toml ~/.codex/agents/red-team.toml
test -L ~/.codex/hooks.json && rm ~/.codex/hooks.json
rm -rf ~/.codex/superpowers-prepared

git clone https://github.com/REPOZY/superpowers-prepared.git ~/.codex/superpowers-prepared
mkdir -p ~/.agents/skills ~/.codex/agents
ln -s ~/.codex/superpowers-prepared/skills ~/.agents/skills/superpowers
cp ~/.codex/superpowers-prepared/codex-agents/*.toml ~/.codex/agents/
ln -s ~/.codex/superpowers-prepared/hooks/codex-hooks.json ~/.codex/hooks.json
```

**Windows (PowerShell):**
```powershell
cmd /c rmdir "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item -Force "$env:USERPROFILE\.codex\agents\code-reviewer.toml","$env:USERPROFILE\.codex\agents\red-team.toml" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.codex\hooks.json" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers-prepared"

git clone https://github.com/REPOZY/superpowers-prepared.git "$env:USERPROFILE\.codex\superpowers-prepared"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills","$env:USERPROFILE\.codex\agents" | Out-Null
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers-prepared\skills"
Copy-Item "$env:USERPROFILE\.codex\superpowers-prepared\codex-agents\*.toml" "$env:USERPROFILE\.codex\agents\"
```

After a clean reinstall:

1. On macOS/Linux, confirm `codex_hooks = true` is still set in `~/.codex/config.toml`
2. Restart Codex
3. On macOS/Linux, re-run the live hook smoke checks against the actual installed home

---

## Uninstalling

**macOS / Linux:**
```bash
rm ~/.agents/skills/superpowers
rm -f ~/.codex/agents/code-reviewer.toml ~/.codex/agents/red-team.toml
test -L ~/.codex/hooks.json && rm ~/.codex/hooks.json
rm -rf ~/.codex/superpowers-prepared   # optional: delete the clone
```

**Windows (PowerShell):**
```powershell
cmd /c rmdir "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item -Force "$env:USERPROFILE\.codex\agents\code-reviewer.toml","$env:USERPROFILE\.codex\agents\red-team.toml" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers-prepared"
```

---

## Troubleshooting

### Hooks not running (macOS/Linux)

1. Confirm `codex --version` is `0.118.0` or newer
2. Confirm `codex_hooks = true` is set in `~/.codex/config.toml`
3. Confirm `~/.codex/hooks.json` exists and includes this plugin's Codex hook entries under a top-level `hooks` object
4. Restart Codex after any hook-file change
5. If hooks still do not fire, inspect the installed `~/.codex/superpowers-prepared/hooks/codex-hooks.json` and validate the JSON syntax
