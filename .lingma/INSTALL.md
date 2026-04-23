# Installing Superpowers for Lingma IDE

Enable superpowers skills in Lingma IDE via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.lingma/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.lingma/skills
   ln -s ~/.lingma/superpowers/skills ~/.lingma/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.lingma\skills"
   cmd /c mklink /J "$env:USERPROFILE\.lingma\skills\superpowers" "$env:USERPROFILE\.lingma\superpowers\skills"
   ```

3. **Restart Lingma IDE** (quit and relaunch) to discover the skills.

## Verify

```bash
ls -la ~/.lingma/skills/superpowers
```

You should see a symlink (or junction on Windows) pointing to your superpowers skills directory.

## Updating

```bash
cd ~/.lingma/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.lingma/skills/superpowers
```

Optionally delete the clone: `rm -rf ~/.lingma/superpowers`.
