# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery,
Codex-native role configs, and multi-agent prompt patterns.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Create the user-level skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Restart Codex.

4. Optional but recommended: enable multi-agent and copy the role examples from
   `~/.codex/superpowers/.codex/examples/`.

### Windows

Use a junction instead of a symlink:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

## Repo-Local Skills Pattern

Codex also scans repo-local `.agents/skills/` folders from your working
directory up to the repo root. If you want Superpowers available only inside a
specific project, create a repo-local symlink instead of using the user-level
one:

```bash
mkdir -p .agents/skills
ln -s ~/.codex/superpowers/skills .agents/skills/superpowers
```

This is useful when you want project-scoped skill availability without changing
your global Codex setup.

## Recommended Codex Setup

Superpowers now ships a Codex example bundle under `.codex/examples/`. It is
not an active project config; it is a copy-and-adapt template.

### Stable pieces

- `.codex/examples/config.toml` - enables `multi_agent` and wires example roles
- `.codex/examples/agents/` - role-specific TOML files
- `.codex/examples/prompts/` - ready-to-paste orchestration prompts
- `.codex/examples/notify.py` - stable notification example

### Experimental pieces

- `.codex/examples/hooks.json`
- `.codex/examples/hooks/`

The hooks example is source-derived from the Codex codebase and should be
treated as experimental. It requires:

```toml
[features]
codex_hooks = true
```

## Multi-Agent Roles

The example role catalog includes:

- `explorer` - read-only code path tracing and evidence gathering
- `worker` - the smallest defensible implementation
- `reviewer` - final branch or PR review
- `monitor` - polling and long-running verification
- `browser_debugger` - optional browser-driven UI reproduction
- `spec_reviewer` - exact-scope verification for a task
- `quality_reviewer` - correctness, tests, and maintainability review

The `browser_debugger` role is optional. It assumes a browser MCP server such
as `chrome_devtools`. If you do not have browser tooling configured, use the
same prompts with `explorer + worker` instead.

## Prompt Library

Superpowers now ships Codex-style prompt examples under
`.codex/examples/prompts/`.

Notable patterns:

- `dispatching-parallel-agents.md` - independent domains, UI debugging with
  `browser_debugger + explorer + worker`, and `spawn_agents_on_csv`
- `subagent-driven-development.md` - per-task execution with
  `worker -> spec_reviewer -> quality_reviewer -> monitor -> reviewer`

These examples are written in the same style as the Codex multi-agent docs:
“Have X do Y” with explicit role assignment and orchestration goals.

## How It Works

Codex discovers skills natively from `.agents/skills/` and reads `SKILL.md`
frontmatter to decide when a skill applies. Superpowers also ships
`agents/openai.yaml` metadata inside each public skill directory for better
Codex UI presentation and default prompt examples.

Codex loads `AGENTS.md` guidance separately from skills. You do not need an old
bootstrap block in `~/.codex/AGENTS.md`; native skill discovery is now the
integration path.

## Usage

Skills are discovered automatically. Codex activates them when:

- You mention a skill by name, such as `$brainstorming`
- The request matches a skill description
- Another Superpowers skill directs Codex to use one

For the two role-heavy workflows:

- `dispatching-parallel-agents` teaches how to split independent work across
  Codex roles
- `subagent-driven-development` teaches the per-task review pipeline with
  `worker`, `spec_reviewer`, and `quality_reviewer`

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

The symlinked skills update immediately after the pull. Restart Codex if you
want it to reload skill metadata at session start.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

**Windows (PowerShell):**

```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
```

Optionally delete the clone:

```bash
rm -rf ~/.codex/superpowers
```

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check the skill directories exist: `find ~/.codex/superpowers/skills -maxdepth 2 -name SKILL.md`
3. Restart Codex so it reloads skill metadata

### Multi-agent roles not working

1. Confirm `[features] multi_agent = true` in your real `~/.codex/config.toml`
2. Copy the role examples from `.codex/examples/agents/` into your real
   `~/.codex/agents/` or project `.codex/agents/`
3. Check that the `config_file` paths in your real config point to existing
   files

### Browser debugger not available

If you do not have a browser MCP server configured, remove `browser_debugger`
from the prompt and use `explorer + worker` instead. The rest of the workflow
still applies.

### Experimental hooks not firing

1. Confirm `[features] codex_hooks = true`
2. Copy `.codex/examples/hooks.json` and `.codex/examples/hooks/` into your
   real `~/.codex/` or project `.codex/`
3. Remember that this surface is experimental and may change with Codex

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
