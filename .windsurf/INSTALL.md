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

3. **Set up the global rule:**
   ```bash
   mkdir -p ~/.codeium/windsurf/memories
   
   GLOBAL_RULES="$HOME/.codeium/windsurf/memories/global_rules.md"
   INSTRUCTION_FILE="$HOME/.codeium/windsurf/superpowers/.windsurf/rules/superpowers-global-instruction.md"
   MARKER="superpowers/.windsurf/rules/superpowers.md"
   
   # Only append if not already present
   if [ -f "$GLOBAL_RULES" ] && grep -q "$MARKER" "$GLOBAL_RULES"; then
     echo "Superpowers rule reference already exists in global rules, skipping"
   else
     if [ -f "$GLOBAL_RULES" ]; then
       echo "" >> "$GLOBAL_RULES"
       echo "---" >> "$GLOBAL_RULES"
       echo "" >> "$GLOBAL_RULES"
     fi
     cat "$INSTRUCTION_FILE" >> "$GLOBAL_RULES"
     echo "Superpowers rule reference added to global rules"
   fi
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codeium\windsurf\memories"
   
   $globalRulesPath = "$env:USERPROFILE\.codeium\windsurf\memories\global_rules.md"
   $instructionFile = "$env:USERPROFILE\.codeium\windsurf\superpowers\.windsurf\rules\superpowers-global-instruction.md"
   $marker = "superpowers/.windsurf/rules/superpowers.md"
   
   # Only append if not already present
   if ((Test-Path $globalRulesPath) -and (Select-String -Path $globalRulesPath -Pattern $marker -Quiet)) {
     Write-Host "Superpowers rule reference already exists in global rules, skipping" -ForegroundColor Yellow
   } else {
     if (Test-Path $globalRulesPath) {
       Add-Content -Path $globalRulesPath -Value "`n---`n"
     }
     Get-Content $instructionFile | Add-Content -Path $globalRulesPath
     Write-Host "Superpowers rule reference added to global rules" -ForegroundColor Green
   }
   ```

4. **Restart Windsurf** to discover the skills and load the rule.

## Verify

```bash
ls ~/.codeium/windsurf/skills/
grep -l "superpowers/.windsurf/rules/superpowers.md" ~/.codeium/windsurf/memories/global_rules.md
```

**Windows (PowerShell):**
```powershell
Get-ChildItem "$env:USERPROFILE\.codeium\windsurf\skills"
Select-String -Path "$env:USERPROFILE\.codeium\windsurf\memories\global_rules.md" -Pattern "superpowers/.windsurf/rules/superpowers.md"
```

You should see multiple skill directories (brainstorming, test-driven-development, etc.) and a match confirming the Superpowers instruction is in your global rules.

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

**Note:** The Superpowers instruction was appended to your global rules file (`~/.codeium/windsurf/memories/global_rules.md`). To remove it, manually edit that file and delete the section that starts with "# Superpowers Skill Discipline".

Optionally delete the clone: `rm -rf ~/.codeium/windsurf/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codeium\windsurf\superpowers"`).
