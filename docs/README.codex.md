# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery and the shared Superpowers runtime checkout.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/dmulcahey/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Git

### Steps

1. Clone the repo into the shared runtime location:
   ```bash
   git clone https://github.com/dmulcahey/superpowers.git ~/.superpowers/install
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.superpowers/install/skills ~/.agents/skills/superpowers
   ```

3. Install the `code-reviewer` custom agent:
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.superpowers/install/.codex/agents/code-reviewer.toml ~/.codex/agents/code-reviewer.toml
   ```

4. Restart Codex.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.superpowers\install\skills"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
Copy-Item "$env:USERPROFILE\.superpowers\install\.codex\agents\code-reviewer.toml" "$env:USERPROFILE\.codex\agents\code-reviewer.toml" -Force
```

## Migrating Existing Installs

If you already have `~/.codex/superpowers` or `~/.copilot/superpowers`, migrate them into the shared checkout with:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 https://github.com/dmulcahey/superpowers.git "$tmpdir/superpowers"
"$tmpdir/superpowers/bin/superpowers-migrate-install"
rm -rf "$tmpdir"
```

If `~/.superpowers/install` already exists, run `~/.superpowers/install/bin/superpowers-migrate-install` instead.

**Windows (PowerShell):**
```powershell
if (Test-Path "$env:USERPROFILE\.superpowers\install") {
  & "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"
} else {
  $tmpRoot = Join-Path $env:TEMP "superpowers-migrate"
  $tmpDir = Join-Path $tmpRoot ([guid]::NewGuid().ToString())
  git clone --depth 1 https://github.com/dmulcahey/superpowers.git (Join-Path $tmpDir "superpowers")
  & (Join-Path $tmpDir "superpowers\bin\superpowers-migrate-install.ps1")
  Remove-Item -Recurse -Force $tmpDir
}
```

Migration only consolidates the checkout. After migrating, continue with steps 2 and 3 to create or refresh `~/.agents/skills/superpowers` and `~/.codex/agents/code-reviewer.toml`, then restart Codex.

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.agents/skills/superpowers/ → ~/.superpowers/install/skills/
Unix-like: ~/.codex/agents/code-reviewer.toml → ~/.superpowers/install/.codex/agents/code-reviewer.toml
Windows: copy ~/.superpowers/install/.codex/agents/code-reviewer.toml to ~/.codex/agents/code-reviewer.toml
```

The `using-superpowers` skill is discovered automatically and acts as the entry router, including a session-scoped bypass gate before the normal Superpowers stack takes over — no additional configuration needed.

The `code-reviewer` custom agent is available after installation.

## Codex Subagents

Current Codex releases enable subagent workflows by default, so Superpowers does not require a separate `multi_agent` feature flag.

Codex ships built-in `default`, `worker`, and `explorer` agents:

- Use `worker` for implementation and fix tasks.
- Use `explorer` for read-heavy debugging, review, and codebase exploration.
- Use `default` when the task needs broader judgment instead of a narrow execution or exploration role.

Superpowers also installs its `code-reviewer` custom agent to `~/.codex/agents/code-reviewer.toml`.

If you want custom project-scoped agents, add TOML files under `.codex/agents/`. Personal custom agents live under `~/.codex/agents/`. Each custom agent file defines `name`, `description`, and `developer_instructions`; optional settings such as `nickname_candidates`, `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, and `skills.config` inherit from the parent session when omitted.

Use `[agents]` in your Codex config for global subagent controls such as `max_threads`, `max_depth`, and `job_max_runtime_seconds`. Most installs can leave `[agents]` unset; Codex defaults to six open agent threads and a max depth of one direct child layer.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill asks whether to use or bypass Superpowers for the session, then directs Codex to use one when the stack stays enabled

## Default Workflow

Superpowers' default planning pipeline is:

`brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation`

Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.

Only the user can initiate accelerated review, and section approval plus final approval remain human-owned even when the review uses reviewer subagents and persisted section packets.

During implementation, either `subagent-driven-development` or `executing-plans` starts from an engineering-approved current plan, runs a workspace-readiness preflight, and then drives task execution. Workspace preparation is the user's responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management. The completion flow runs `requesting-code-review`, keeps a conditional `qa-only` handoff, requires it when browser interaction or test-plan context warrants it, and requires the `document-release` handoff before workflow-routed branch completion.

## Runtime Helpers

Runtime helper state lives in `~/.superpowers/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.superpowers/projects/`.

Superpowers ships a supported public workflow inspection surface:
- `bin/superpowers-workflow` (Bash)
- `bin/superpowers-workflow.ps1` (PowerShell wrapper)

Use `status`, `next`, `artifacts`, `explain`, or `help` when you want to inspect workflow state directly from the terminal. These commands stay read-only: they do not create, repair, or rewrite branch-scoped manifests, and `next` stops at the execution handoff boundary instead of calling `superpowers-plan-execution recommend`.

Superpowers also ships workflow-status runtime helpers:
- `bin/superpowers-workflow-status` (Bash)
- `bin/superpowers-workflow-status.ps1` (PowerShell wrapper)

Generated workflow skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh` first to resolve the conservative next stage, including before spec/plan docs exist. This helper is an internal runtime surface, not a supported public workflow CLI. Default `status` output is JSON for machine consumers; `status --summary` is a human-oriented one-line view. `reason` is the canonical diagnostic field, and any `note` field is only a compatibility alias. It keeps branch-scoped manifests at `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`; that local manifest is rebuildable, and repo docs remain authoritative for approval state.

Optional: enable contributor mode for future sessions with:

```bash
~/.superpowers/install/bin/superpowers-config set superpowers_contributor true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set superpowers_contributor true
```

If you disable update notices, re-enable them with:

```bash
~/.superpowers/install/bin/superpowers-config set update_check true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set update_check true
```

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Codex decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
cd ~/.superpowers/install && git pull
```

Skills update instantly through the symlink.

If you copied the Codex agent file on Windows, copy `~/.superpowers/install/.codex/agents/code-reviewer.toml` into `~/.codex/agents/code-reviewer.toml` again after updating.

If you migrated from `~/.codex/superpowers` or `~/.copilot/superpowers`, rerun `~/.superpowers/install/bin/superpowers-migrate-install` after updating if you need to restore the compatibility links. In PowerShell, use `& "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"`.

Generated skill preambles run `~/.superpowers/install/bin/superpowers-update-check` automatically when that install root is active, so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/code-reviewer.toml
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"
```

Optionally delete the shared clone if no other platform uses it: `rm -rf ~/.superpowers/install` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.superpowers\install"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Verify the agent file: `ls -la ~/.codex/agents/code-reviewer.toml`
3. Check skills exist: `ls ~/.superpowers/install/skills`
4. Check the source agent exists: `ls ~/.superpowers/install/.codex/agents/code-reviewer.toml`
5. Restart Codex — skills and agents are discovered at startup

**Windows (PowerShell):**
1. Verify the junction: `Get-Item "$env:USERPROFILE\.agents\skills\superpowers"`
2. Verify the copied agent file: `Get-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"`
3. Check skills exist: `Get-ChildItem "$env:USERPROFILE\.superpowers\install\skills"`
4. Check the source agent exists: `Get-Item "$env:USERPROFILE\.superpowers\install\.codex\agents\code-reviewer.toml"`
5. If you updated Superpowers, recopy `code-reviewer.toml` into `~/.codex/agents/`
6. Restart Codex — skills and agents are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/dmulcahey/superpowers/issues
- Main documentation: https://github.com/dmulcahey/superpowers
