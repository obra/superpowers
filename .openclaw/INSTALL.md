# Superpowers Wrapper for OpenClaw

This wrapper enables OpenClaw to natively discover and load skills from the [Superpowers](https://github.com/obra/superpowers) framework. By symlinking the canonical skills directly into OpenClaw's skill directory, you ensure you always have access to the latest upstream improvements without maintaining a duplicate fork.

## Section 1 — Prerequisites

- **OpenClaw**: Must be installed and configured on your system.
- **OpenClaw Workspace**: A valid workspace initialized (typically with an `AGENTS.md` file).

## Section 2 — Clone and Symlink

First, clone the framework to a stable location, then symlink the skills into OpenClaw's shared skills directory.

### Automated Setup

Run the included `setup.sh` script to automate cloning, symlinking, and snippet injection:

```bash
./setup.sh
```

### Manual Setup

Alternatively, you can run the following commands manually:

```bash
# Clone superpowers to a stable location
git clone https://github.com/obra/superpowers ~/.superpowers

# Symlink skills into OpenClaw's shared skills directory
mkdir -p ~/.openclaw/skills

for skill in ~/.superpowers/skills/*/; do
  ln -s "$skill" ~/.openclaw/skills/"$(basename "$skill")"
done
```

## Section 3 — Bootstrap Injection

OpenClaw needs to be aware of Superpowers at the start of each session.

1. Open your workspace's baseline document (typically `~/.openclaw/workspace/AGENTS.md` or similar).
2. Copy the contents of [`AGENTS-snippet.md`](AGENTS-snippet.md) and paste it at the bottom.

*(Note: `setup.sh` attempts to do this automatically if your workspace is at `~/.openclaw/workspace/AGENTS.md`.)*

## Section 4 — Verify Installation

You can verify the skills are discovered by OpenClaw by running:

```bash
openclaw skills info using-superpowers
```

You should see an output indicating `eligible=true` and `source=local`.

## Section 5 — Keeping Skills Updated

Because the skills are symlinked rather than copied, updating to the newest upstream version is a single command.

```bash
cd ~/.superpowers && git pull
```

No reinstallation required!
