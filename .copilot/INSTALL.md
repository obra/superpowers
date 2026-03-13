# Installing Superpowers for GitHub Copilot CLI

Enable superpowers skills in GitHub Copilot CLI. The recommended method uses the built-in plugin system; a manual alternative is also available.

## Prerequisites

- GitHub Copilot CLI (`copilot` command)
- Git

## Recommended: Plugin Install

```
/plugin install obra/superpowers
```

All skills become `/skill-name` slash commands immediately. No further setup needed.

## Alternative: Manual Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.copilot/skills
   ln -s ~/.copilot/superpowers/skills ~/.copilot/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\skills"
   cmd /c mklink /J "$env:USERPROFILE\.copilot\skills\superpowers" "$env:USERPROFILE\.copilot\superpowers\skills"
   ```

3. **Restart Copilot CLI** to discover the skills.

## Verify

```
/skills list
```

You should see all superpowers skills listed as available slash commands.

## Updating

**Plugin install:**
```
/plugin update superpowers
```

**Manual install:**
```bash
cd ~/.copilot/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

**Plugin install:**
```
/plugin uninstall superpowers
```

**Manual install:**
```bash
rm ~/.copilot/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.copilot\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.copilot/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.copilot\superpowers"`).
