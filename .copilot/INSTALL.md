# Installing Superpowers for GitHub Copilot CLI

Enable superpowers skills in GitHub Copilot CLI. The recommended method uses the built-in plugin system; a manual alternative is also available.

## Prerequisites

- GitHub Copilot CLI (`copilot` command)
- Git

## Recommended: Plugin Install

```bash
copilot plugin install obra/superpowers
```

All 14 skills are available immediately. No further setup needed.

## Alternative: Manual Installation

**Note:** Manual installation provides skills only. Session hooks (update checks, legacy warnings) and plugin registration require the plugin install method above.

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

**Plugin install:**

```bash
copilot plugin list
```

You should see `superpowers` listed as an installed plugin.

**Manual install:** Start a Copilot CLI session and use `/skills` to confirm superpowers skills are available.

## Updating

**Plugin install:**
```bash
copilot plugin update superpowers
```

**Manual install:**
```bash
cd ~/.copilot/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

**Plugin install:**
```bash
copilot plugin uninstall superpowers
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
