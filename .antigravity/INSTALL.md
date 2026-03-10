# Installing Superpowers for Antigravity

Enable superpowers skills in Google Antigravity via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.antigravity/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.antigravity/superpowers/skills ~/.agents/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.antigravity\superpowers\skills"
   ```

3. **Install the global workflow bootstrap:**

   This copies the `using-superpowers` bootstrap into Antigravity's global workflows directory so it triggers in every conversation, regardless of workspace.

   ```bash
   mkdir -p ~/.gemini/antigravity/global_workflows
   cp ~/.antigravity/superpowers/skills/using-superpowers/SKILL.md ~/.gemini/antigravity/global_workflows/superpowers.md
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\global_workflows"
   Copy-Item "$env:USERPROFILE\.antigravity\superpowers\skills\using-superpowers\SKILL.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
   ```

4. **Restart Antigravity** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.agents\skills" | Where-Object { $_.LinkType }
```

You should see a symlink (or junction on Windows) pointing to your superpowers skills directory.

## Updating

```bash
cd ~/.antigravity/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.gemini/antigravity/global_workflows/superpowers.md
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
```

Optionally delete the clone: `rm -rf ~/.antigravity/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.antigravity\superpowers"`).
