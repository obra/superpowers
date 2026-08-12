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
`${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro`. The generated agent is
`$HOME/.kiro/agents/superpowers.md`. The installer refuses to replace either
path unless it carries the Superpowers ownership marker.

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

Inspect both ownership markers before deleting anything:

```bash
cat "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro/.superpowers-kiro-install"
grep -F '<!-- Managed by the Superpowers Kiro installer. -->' "$HOME/.kiro/agents/superpowers.md"
```

If both commands show the expected markers, remove only these paths:

```bash
rm -rf "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro"
rm -f "$HOME/.kiro/agents/superpowers.md"
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
