# Installing Superpowers for Windsurf

Enable superpowers skills in Windsurf via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codeium/windsurf/superpowers
   ```

2. **Copy skills to global skills directory:**
   ```bash
   mkdir -p ~/.codeium/windsurf/skills
   
   for skill in ~/.codeium/windsurf/superpowers/skills/*; do
     skill_name=$(basename "$skill")
     rm -rf ~/.codeium/windsurf/skills/"$skill_name"
     cp -r "$skill" ~/.codeium/windsurf/skills/"$skill_name"
   done
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codeium\windsurf\skills"
   
   Get-ChildItem "$env:USERPROFILE\.codeium\windsurf\superpowers\skills" -Directory | ForEach-Object {
     $source = $_.FullName
     $dest = Join-Path "$env:USERPROFILE\.codeium\windsurf\skills" $_.Name
     if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
     Copy-Item $source $dest -Recurse
   }
   ```

3. **Restart Windsurf** to discover the skills.

## Verify

```bash
ls ~/.codeium/windsurf/skills/
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.codeium\windsurf\skills"
```

You should see multiple skill directories (brainstorming, test-driven-development, etc.).

## Updating

```bash
cd ~/.codeium/windsurf/superpowers && git pull

# Re-copy skills to pick up updates and new skills
for skill in ~/.codeium/windsurf/superpowers/skills/*; do
  skill_name=$(basename "$skill")
  rm -rf ~/.codeium/windsurf/skills/"$skill_name"
  cp -r "$skill" ~/.codeium/windsurf/skills/"$skill_name"
done
```

**Windows (PowerShell):**
```powershell
cd "$env:USERPROFILE\.codeium\windsurf\superpowers"
git pull

# Re-copy skills to pick up updates and new skills
Get-ChildItem "$env:USERPROFILE\.codeium\windsurf\superpowers\skills" -Directory | ForEach-Object {
  $source = $_.FullName
  $dest = Join-Path "$env:USERPROFILE\.codeium\windsurf\skills" $_.Name
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  Copy-Item $source $dest -Recurse
}
```

Skills will be updated after running the copy commands above.

## Uninstalling

```bash
# Remove all Superpowers skill directories
cd ~/.codeium/windsurf/superpowers/skills
for skill in *; do
  rm -rf ~/.codeium/windsurf/skills/"$skill"
done
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.codeium\windsurf\superpowers\skills" -Directory | ForEach-Object {
  $skillPath = Join-Path "$env:USERPROFILE\.codeium\windsurf\skills" $_.Name
  if (Test-Path $skillPath) { Remove-Item $skillPath -Recurse -Force }
}
```

Optionally delete the clone: `rm -rf ~/.codeium/windsurf/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codeium\windsurf\superpowers"`).
