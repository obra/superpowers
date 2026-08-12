# Superpowers for Kiro v3 (CLI and IDE)

This integration uses a Kiro v3 Markdown custom agent, startup `file://`
resources, and native `skill://` discovery. Because the Kiro CLI v3 and the
Kiro IDE (1.0+) run the same v3 agent engine and agent format, one installed
agent works in both — no per-surface setup. It does not support Kiro CLI v2,
which is no longer being extended — Kiro prompts you to migrate v2 agents with
`/upgrade-agent`, and new capabilities land in v3 only.

Testing note: this integration was developed and used primarily on the Kiro
CLI. The IDE has been smoke-tested (the agent loads, skills are discovered, and
`brainstorming` triggers on the acceptance prompt) but not exercised across the
full range of skills.

## Requirements

- Kiro CLI with the v3 agent engine, or Kiro IDE 1.0+ (same v3 agent engine)
- macOS, Linux, or WSL
- `curl` and `tar`

Native Windows is not supported by the initial installer.

## Installation

Install the latest stable release:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh
```

Install a specific release:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh -s -- v1.2.3
```

To inspect the installer before running it:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh -o /tmp/install-kiro.sh
less /tmp/install-kiro.sh
sh /tmp/install-kiro.sh
```

The payload is installed at
`${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro`. The installer generates
three agents in `$HOME/.kiro/agents`:

| Agent | Purpose |
|-------|---------|
| `superpowers.md` | The agent you start sessions with |
| `superpowers-worker-default-model.md` | Neutral worker for skill dispatches, model resolved by Kiro |
| `superpowers-worker-lite-model.md` | Neutral worker pinned to `claude-sonnet-5` for mechanical work |

The installer refuses to replace the payload or any of the three agents unless
they carry the Superpowers ownership marker. It also refuses when a same-named
`.json` config exists, because that form takes precedence and would leave the
generated agent unloadable.

## Worker agents

Superpowers skills dispatch a general-purpose subagent and supply the reviewer
or implementer persona entirely through a prompt template. The workers exist to
be that neutral target: they declare no role, no checklist, and no output
conventions of their own, so the template governs. They do carry `skill://`
discovery and pre-approval for reads and skill loading, because a worker that
cannot read the code it was asked to review is useless.

The workers deliberately do not *declare* the Superpowers bootstrap as a
resource. Note that a dispatching session may still propagate its own startup
resources into a subagent, depending on the surface; the bootstrap's own
`<SUBAGENT-STOP>` clause is what tells a dispatched worker to ignore it.

Without them, an agent asked to run a code review has no general-purpose target
and may substitute a purpose-built agent, which silently replaces the template's
severity calibration and output format with its own.

Choose the tier by choosing the worker. Kiro resolves a subagent's model from
its agent config, and a per-dispatch model value is not honored on every
surface. `superpowers-worker-default-model` omits `model`; note that this does
not necessarily inherit the model of your session.

## Usage

Start a v3 TUI session in any project:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

Kiro loads `using-superpowers` and the Kiro tool mapping at startup. It exposes
skill metadata from `skill://` resources and uses its native Load skill action
to load full skill instructions on demand.

Only file reads and skill loading are pre-approved by the profile. Writes,
shell commands, network access, and other consequential actions retain Kiro's
normal permission behavior.

### In the Kiro IDE

Select the `superpowers` agent from the agent selector, then start a chat. The
IDE reads the same generated agent from `~/.kiro/agents/`.

Restart the IDE after installing (or after any agent change): the IDE fixes the
available agent and skill list when a session starts, so a freshly installed
agent may appear but load no skills until you restart. Use the context view (or
ask the agent to list its skills) to confirm the Superpowers skills are present.

## Updating or changing versions

Rerun the installation command. With no argument it installs the latest stable
release; with a tag such as `v1.2.3` it installs that release. The installer
replaces the one managed payload and does not retain rollback versions.

## Removal

Inspect the ownership marker on every managed path before deleting anything:

```bash
cat "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro/.superpowers-kiro-install"
for agent in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
  grep -FL '<!-- Managed by the Superpowers Kiro installer. -->' \
    "$HOME/.kiro/agents/$agent.md"
done
```

The `grep -FL` loop prints the path of any file that is **missing** the marker.
It should print nothing. Anything it prints is not managed by the installer —
do not delete it.

If the marker check printed nothing, remove only these paths:

```bash
rm -rf "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro"
rm -f "$HOME/.kiro/agents/superpowers.md"
rm -f "$HOME/.kiro/agents/superpowers-worker-default-model.md"
rm -f "$HOME/.kiro/agents/superpowers-worker-lite-model.md"
```

## Repository-local development

From a Superpowers checkout, use the tracked `.kiro/agents/superpowers.md`:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

The repository profile uses relative resources. The installed profile uses
absolute resources so it works from unrelated project directories.

## Why this is not a Kiro Power

Kiro Powers currently do not provide a supported CLI package that installs a
custom agent, native Agent Skills, startup resources, and updates as one unit.
The shell installer is transitional and should be replaced when Kiro provides a
native package mechanism.

## Current limitations

- On the CLI, the v3 workflow requires the TUI; classic and non-interactive
  acceptance are not claimed. In the IDE, use a normal chat session.
- IDE support rides on the shared v3 engine and has only been smoke-tested. The
  agent and skills load and `brainstorming` triggers, but the full skill set has
  not been exercised in the IDE.
- The installer supports macOS, Linux, and WSL, not native Windows.
- GitHub release archives are downloaded over HTTPS and checked for required
  files and matching version metadata, but no separate checksum or signature is
  published.
- A tag predating Kiro support cannot be installed because its archive lacks the
  required Kiro files.
- Model identifiers are not validated when an agent config is written, so a
  wrong one surfaces only at dispatch time, where it fails loudly. If
  `superpowers-worker-lite-model` reports a rejected model, replace
  `claude-sonnet-5` with an identifier your account offers. The pinned default
  was verified on Kiro CLI 2.17.0 and IDE 1.0.293; model availability varies by
  account.
- The worker agents must appear as dispatchable subagents in your session. The
  list of available agents is fixed when a session starts, so restart Kiro after
  installing before expecting skills to dispatch to them.
- Install paths containing spaces are untested. The generated profile embeds the
  payload path in `file://` and `skill://` URIs without percent-encoding, and
  whether Kiro's resolver accepts a raw space there is unknown. The failure mode
  would be silent — skills simply never load — so if that happens, check whether
  `${XDG_DATA_HOME:-$HOME/.local/share}` contains a space and reinstall with
  `XDG_DATA_HOME` set to a path without one.

## Troubleshooting

### The installer refuses an existing agent or payload

The destination exists without the ownership marker. Move or rename it after
reviewing its contents; the installer intentionally will not overwrite it.

### The installer reports that a `.json` config would shadow an agent

A Kiro agent can be defined by either `<name>.md` or `<name>.json`, and the JSON
form takes precedence. If you set Superpowers up manually, or installed it
before this Markdown-based installer existed, you may have a
`~/.kiro/agents/superpowers.json`. Installing beside it would create an agent
that never loads, so the installer stops instead.

Move the old config aside and rerun:

```bash
mv "$HOME/.kiro/agents/superpowers.json" "$HOME/.kiro/agents/superpowers.json.disabled"
```

Keep it until you have confirmed the new installation works, then delete it. If
it referenced its own skills payload — commonly `~/.kiro/superpowers` — that
directory is now unused, since this installer keeps its payload under
`${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro`.

### Skills do not trigger

Start a clean v3 session and send `Let's make a react todo list`. A working
installation invokes `Load skill: brainstorming` before writing code. Confirm
the generated agent contains absolute `file:///` and `skill:///` resources that
point at the managed payload.

### Skills do not appear in the IDE after installing

The IDE fixes the available agent and skill list at session start. After
installing or changing the agent, fully restart the IDE, then reselect the
`superpowers` agent. If the agent loads but no skills appear, this restart is
almost always the cause — confirm with the context view or by asking the agent
to list its skills.

### The requested version is rejected

Use a stable tag in `vMAJOR.MINOR.PATCH` form. The archive's `package.json`
version must match the tag without its leading `v`.
