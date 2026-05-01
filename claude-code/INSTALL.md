# Installing Sonbbal Superpowers for Claude Code

Install the Claude Code package from this repository. The runtime package lives in `claude-code/`; the repository root only keeps marketplace metadata and shared documentation.

## Prerequisites

- Claude Code
- Git

## Install

In Claude Code, run:

```text
/plugin marketplace add Sonbbal/superpowers
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

Start a new Claude Code session after installation.

## Verify

Ask Claude Code to use a Superpowers workflow, for example:

```text
Use brainstorming to design a small change before implementation.
```

For local repository verification, run:

```bash
bash tests/claude-code/test-plugin-package.sh
```

Expected result: the marketplace source points to `./claude-code`, and the package contains `skills/`, `agents/`, `commands/`, and `hooks/`.

## Update

```text
/plugin update sonbbal-superpowers
```

Restart Claude Code after updating.

## Migration From The Old Root Package Layout

Older versions used the repository root as the Claude Code package. Current versions use:

```text
claude-code/
```

If Claude Code still appears to load root-level package files after updating:

1. Run `/plugin update sonbbal-superpowers`.
2. Restart Claude Code.
3. If the old layout remains cached, uninstall and reinstall:

```text
/plugin uninstall sonbbal-superpowers
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

The root `.claude-plugin/marketplace.json` remains in place and points to `./claude-code`.

## Paste-Ready Prompt

See [../docs/prompts.md](../docs/prompts.md) for a prompt you can paste directly into Claude Code to install or update this package for the current project.
