# Superpowers for TRAE

Guide for using Superpowers with TRAE via native skill discovery.

## Quick Install

Tell TRAE:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.trae/INSTALL.md
```

## Manual Installation

### Prerequisites

- TRAE installed
- Git

### Steps

1. Clone the repo:

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.trae/superpowers
   ```

2. Link skills into TRAE's global skills directory:

   ```bash
   bash ~/.trae/superpowers/scripts/install-trae.sh
   ```

3. Restart TRAE.

### Project-local Skills (Alternative)

If TRAE isn’t picking up global skills in your environment, you can install into the current project’s `.trae/skills/` instead:

```bash
cd /path/to/your/project
bash ~/.trae/superpowers/scripts/install-trae.sh --project
```

## How It Works

TRAE supports skills defined by `SKILL.md` folders and discovers:

- **Global skills** from `~/.trae/skills/`
- **Project skills** from `.trae/skills/` within your current project

This repo ships skills under `./skills/`. The installer links them individually into `~/.trae/skills/` so:

- Updates happen by `git pull` in the clone
- Your existing global skills remain intact
- User-owned skill directories are never overwritten

## Updating

```bash
cd ~/.trae/superpowers && git pull
bash ~/.trae/superpowers/scripts/install-trae.sh
```

## Troubleshooting

### Skills not showing up

1. Verify the directory exists: `ls -la ~/.trae/skills`
2. Ensure each skill is a directory containing `SKILL.md`
3. Restart TRAE — some environments load skills at startup
