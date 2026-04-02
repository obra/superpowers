# Installing Superpowers for Pi

## Prerequisites

- [Pi](https://github.com/mariozechner/pi-coding-agent) installed
- Git

## Installation

```bash
pi install https://github.com/obra/superpowers
```

Pi clones the repo and discovers all skills from the `skills/` directory automatically.

### Alternative: Local Clone

If you already have a local clone:

```bash
pi install /path/to/superpowers
```

## Verify

Check that the package appears:

```bash
pi list
```

Then start pi and use `/skill:brainstorming` to confirm skills load.

## Configure Required Subagents

Some Superpowers skills call a `code-reviewer` subagent.

Pi packages do not install agent profiles automatically, so install the bundled profile once:

If installed from GitHub:

```bash
mkdir -p ~/.pi/agent/agents
ln -sf ~/.pi/agent/git/github.com/obra/superpowers/.pi/agents/code-reviewer.md ~/.pi/agent/agents/code-reviewer.md
```

If installed from a local path:

```bash
mkdir -p ~/.pi/agent/agents
ln -sf /path/to/superpowers/.pi/agents/code-reviewer.md ~/.pi/agent/agents/code-reviewer.md
```

Verify:

```bash
ls ~/.pi/agent/agents/code-reviewer.md
```

## Updating

Update superpowers:

```bash
pi update https://github.com/obra/superpowers
```

Or pull manually if using a local path:

```bash
cd /path/to/superpowers && git pull
```

## Uninstalling

```bash
pi remove https://github.com/obra/superpowers
```

Or, if installed from a local path:

```bash
pi remove /path/to/superpowers
```
