# Installing Superpowers for OpenClaw

Enable superpowers skills in OpenClaw via native skill discovery. Clone and symlink.

## Prerequisites

- Git
- [OpenClaw](https://github.com/openclaw/openclaw) installed and running

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.openclaw/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.openclaw/workspace/.agents/skills
   ln -s ~/.openclaw/superpowers/skills ~/.openclaw/workspace/.agents/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\workspace\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.openclaw\workspace\.agents\skills\superpowers" "$env:USERPROFILE\.openclaw\superpowers\skills"
   ```

3. **Restart OpenClaw** (`openclaw gateway restart`) to discover the skills.

## Verify

```bash
ls -la ~/.openclaw/workspace/.agents/skills/superpowers
```

You should see a symlink pointing to your superpowers skills directory.

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.openclaw/workspace/.agents/skills/superpowers
```

Optionally delete the clone: `rm -rf ~/.openclaw/superpowers`.
