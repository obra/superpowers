# Superpowers for Kiro CLI v3

This integration uses a Kiro v3 Markdown custom agent, startup `file://`
resources, and native `skill://` discovery. It does not support Kiro CLI v2,
which is no longer being extended — Kiro prompts you to migrate v2 agents with
`/upgrade-agent`, and new capabilities land in v3 only.

## Requirements

- Kiro CLI with the v3 agent engine
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
they carry the Superpowers ownership marker.

## Worker agents

Superpowers skills dispatch a general-purpose subagent and supply the reviewer
or implementer persona entirely through a prompt template. The workers exist to
be that neutral target: they carry no role, no checklist, and no output
conventions, so the template governs completely. They do carry `skill://`
discovery and pre-approval for reads and skill loading, because a worker that
cannot read the code it was asked to review is useless.

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

- Kiro's v3 workflow currently requires the TUI; classic and non-interactive
  acceptance are not claimed.
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
  was verified on Kiro CLI 2.16.2; model availability varies by account.
- The worker agents must appear as dispatchable subagents in your session. The
  list of available agents is fixed when a session starts, so restart Kiro after
  installing before expecting skills to dispatch to them.

## Troubleshooting

### The installer refuses an existing agent or payload

The destination exists without the ownership marker. Move or rename it after
reviewing its contents; the installer intentionally will not overwrite it.

### Skills do not trigger

Start a clean v3 session and send `Let's make a react todo list`. A working
installation invokes `Load skill: brainstorming` before writing code. Confirm
the generated agent contains absolute `file:///` and `skill:///` resources that
point at the managed payload.

### The requested version is rejected

Use a stable tag in `vMAJOR.MINOR.PATCH` form. The archive's `package.json`
version must match the tag without its leading `v`.
