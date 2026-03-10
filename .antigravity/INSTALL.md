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

3. **Install Antigravity-adapted skills:**

   These are condensed, Antigravity-native versions of the upstream skills that reference the correct Antigravity tools (`browser_subagent`, `task.md`, `view_file`) instead of Claude Code tools. They include `subagent-development`, an Antigravity-exclusive self-orchestration skill.

   ```bash
   cp -r ~/.antigravity/superpowers/.antigravity/skills/* ~/.agents/skills/
   ```

   **Windows (PowerShell):**
   ```powershell
   Copy-Item -Recurse -Force "$env:USERPROFILE\.antigravity\superpowers\.antigravity\skills\*" "$env:USERPROFILE\.agents\skills\"
   ```

4. **Install the global workflow bootstrap:**

   This copies the Antigravity-native `superpowers-bootstrap` into Antigravity's global workflows directory so it triggers in every conversation, regardless of workspace.

   ```bash
   mkdir -p ~/.gemini/antigravity/global_workflows
   cp ~/.antigravity/superpowers/.antigravity/skills/superpowers-bootstrap/SKILL.md ~/.gemini/antigravity/global_workflows/superpowers.md
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\global_workflows"
   Copy-Item "$env:USERPROFILE\.antigravity\superpowers\.antigravity\skills\superpowers-bootstrap\SKILL.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
   ```

5. **Restart Antigravity** to discover the skills.

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

Skills update instantly through the symlink. To update the adapted skills and global workflow bootstrap after pulling:

```bash
cp -r ~/.antigravity/superpowers/.antigravity/skills/* ~/.agents/skills/
cp ~/.antigravity/superpowers/.antigravity/skills/superpowers-bootstrap/SKILL.md ~/.gemini/antigravity/global_workflows/superpowers.md
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse -Force "$env:USERPROFILE\.antigravity\superpowers\.antigravity\skills\*" "$env:USERPROFILE\.agents\skills\"
Copy-Item "$env:USERPROFILE\.antigravity\superpowers\.antigravity\skills\superpowers-bootstrap\SKILL.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
```

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
