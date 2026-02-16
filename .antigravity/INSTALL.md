# Installing Superpowers for Antigravity IDE

Antigravity IDE has native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**

   **Linux/macOS:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\antigravity\superpowers"
   ```

2. **Create the skills symlink:**

   **Linux/macOS:**
   ```bash
   mkdir -p ~/.gemini/antigravity/skills
   ln -s ~/.gemini/antigravity/superpowers/skills ~/.gemini/antigravity/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\skills"
   cmd /c mklink /J "$env:USERPROFILE\.gemini\antigravity\skills\superpowers" "$env:USERPROFILE\.gemini\antigravity\superpowers\skills"
   ```

3. **Configure bootstrap** (ensures skills activate automatically):

   Create or edit `~/.gemini/GEMINI.md` (Linux/macOS) or `%USERPROFILE%\.gemini\GEMINI.md` (Windows), then add:

   ```markdown
   ## Superpowers

   You have superpowers. Use the **using-superpowers** skill before any task.
   ```

4. **Restart Antigravity** to discover the skills.

## Verify

**Linux/macOS:**
```bash
ls -la ~/.gemini/antigravity/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.gemini\antigravity\skills\superpowers"
```

You should see skill folders like `brainstorming`, `writing-plans`, `test-driven-development`, etc.

## Updating

**Linux/macOS:**
```bash
cd ~/.gemini/antigravity/superpowers && git pull
```

**Windows (PowerShell):**
```powershell
cd "$env:USERPROFILE\.gemini\antigravity\superpowers"; git pull
```

Skills update instantly through the symlink.

## Uninstalling

**Linux/macOS:**
```bash
rm ~/.gemini/antigravity/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.gemini\antigravity\skills\superpowers"
```

Optionally delete the clone:
- **Linux/macOS:** `rm -rf ~/.gemini/antigravity/superpowers`
- **Windows:** `Remove-Item -Recurse -Force "$env:USERPROFILE\.gemini\antigravity\superpowers"`
