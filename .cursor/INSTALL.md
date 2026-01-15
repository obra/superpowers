# Installing Superpowers for Cursor

Complete installation guide for Cursor Agent Skills integration.

## Prerequisites

### 1. Cursor IDE with Nightly Channel

Agent Skills are currently only available in Cursor's Nightly update channel.

**Enable Nightly:**
1. Open Cursor Settings:
   - macOS: `Cmd + Shift + J`
   - Windows/Linux: `Ctrl + Shift + J`
2. Navigate to **Beta** tab
3. Set **Update Channel** to **Nightly**
4. Restart Cursor after the update completes

### 2. Node.js

Required for running the installation CLI.

**Check if installed:**
```bash
node --version
```

Should show v18.0.0 or higher.

**Install if needed:**
- macOS: `brew install node`
- Windows: Download from [nodejs.org](https://nodejs.org)
- Linux: Use your package manager (e.g., `apt install nodejs`)

## Installation Methods

### Method 1: NPX (Recommended)

The easiest method - runs directly from GitHub without cloning.

**Global installation** (available in all Cursor projects):
```bash
npx github:obra/superpowers/.cursor install --global
```

**Local installation** (current project only):
```bash
cd your-project
npx github:obra/superpowers/.cursor install --local
```

The CLI will:
1. ✓ Check for Cursor installation
2. ✓ Confirm Nightly channel is enabled
3. ✓ Copy superpowers to appropriate location
4. ✓ Create symlinks for all skills (including safely overwriting existing directories)
5. ✓ Show next steps

### Method 2: Clone and Install

If you want to keep the repo for development or updates.

```bash
# Clone the repository
git clone https://github.com/obra/superpowers.git
cd superpowers/.cursor

# Install dependencies
npm install

# Run installation
node cli.js install --global
# or
node cli.js install --local
```

### Method 3: Manual Installation

For those who prefer manual control.

#### Global Installation

```bash
# 1. Clone to global location
git clone https://github.com/obra/superpowers.git ~/.cursor/superpowers

# 2. Create skills directory
mkdir -p ~/.cursor/skills

# 3. Symlink skills
cd ~/.cursor/superpowers/skills
for skill_dir in */; do
  skill_name="${skill_dir%/}"
  ln -sf "$(pwd)/$skill_name" ~/.cursor/skills/"$skill_name"
done
```

#### Local Installation

```bash
# 1. In your project root
cd your-project

# 2. Clone to project
git clone https://github.com/obra/superpowers.git .cursor-superpowers

# 3. Create skills directory
mkdir -p .cursor/skills

# 4. Symlink skills
cd .cursor-superpowers/skills
for skill_dir in */; do
  skill_name="${skill_dir%/}"
  ln -sf "$(pwd)/$skill_name" ../../.cursor/skills/"$skill_name"
done

# 5. Add to .gitignore
echo ".cursor-superpowers/" >> .gitignore
```

#### Windows PowerShell

```powershell
# Global installation
git clone https://github.com/obra/superpowers.git $env:USERPROFILE\.cursor\superpowers
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.cursor\skills

# Create symlinks (requires admin or developer mode)
Get-ChildItem $env:USERPROFILE\.cursor\superpowers\skills -Directory | ForEach-Object {
    $target = $_.FullName
    $link = Join-Path $env:USERPROFILE\.cursor\skills $_.Name
    New-Item -ItemType SymbolicLink -Path $link -Target $target
}

# Or use junctions (works without admin)
Get-ChildItem $env:USERPROFILE\.cursor\superpowers\skills -Directory | ForEach-Object {
    $target = $_.FullName
    $link = Join-Path $env:USERPROFILE\.cursor\skills $_.Name
    cmd /c mklink /J "$link" "$target"
}
```

## Verification

### 1. Check Files

**Global:**
```bash
ls -la ~/.cursor/skills/
```

**Local:**
```bash
ls -la .cursor/skills/
```

You should see symlinks to skill directories:
```text
brainstorming -> /Users/you/.cursor/superpowers/skills/brainstorming
systematic-debugging -> /Users/you/.cursor/superpowers/skills/systematic-debugging
...
```

### 2. Check in Cursor

1. Restart Cursor
2. Open Settings (`Cmd+Shift+J` / `Ctrl+Shift+J`)
3. Navigate to **Rules** → **Agent Decides**
4. You should see all Superpowers skills listed

### 3. Test Usage

In a Cursor chat:
1. Type `/` to open skill menu
2. Search for "brainstorming" or "systematic"
3. You should see Superpowers skills appear

Or just describe a task:
```text
"Let's brainstorm ideas for improving our CI/CD pipeline"
```

The agent should automatically invoke the brainstorming skill.

## Updating

### NPX Installation

```bash
# Reinstall to get latest
npx github:obra/superpowers/.cursor install --global
```

### Manual Installation

```bash
# Update global
cd ~/.cursor/superpowers
git pull

# Or update local
cd .cursor-superpowers
git pull

# Then restart Cursor
```

## Uninstalling

### Using NPX

```bash
# Uninstall global
npx github:obra/superpowers/.cursor uninstall --global

# Uninstall local
npx github:obra/superpowers/.cursor uninstall --local
```

The uninstall command removes symlinks/junctions under `.cursor/skills/` that point at the superpowers repo, so you won't leave dangling entries behind even on Windows.

### Manual Uninstall

**Global:**
```bash
# Remove skills
rm -rf ~/.cursor/skills/*

# Remove installation
rm -rf ~/.cursor/superpowers
```

**Local:**
```bash
# Remove skills
rm -rf .cursor/skills/*

# Remove installation
rm -rf .cursor-superpowers
```

## Troubleshooting

### "Cursor not found"

The CLI checks common installation locations. If Cursor is installed in a custom location:
- Verify Cursor is installed
- Make sure you're on the latest version
- Try the manual installation method

### "Skills not appearing in Cursor"

1. **Nightly channel**: Verify you're on Nightly (Settings → Beta → Update Channel)
2. **Restart required**: Completely quit and restart Cursor
3. **Check symlinks**: Run `ls -la ~/.cursor/skills/` to verify symlinks exist
4. **Check SKILL.md**: Each skill directory must have a `SKILL.md` file

### "Permission denied" creating symlinks (Windows)

**Option 1 - Enable Developer Mode** (recommended):
1. Settings → Update & Security → For Developers
2. Enable "Developer Mode"
3. Rerun installation

**Option 2 - Run as Administrator**:
```powershell
# Run PowerShell as Administrator
npx github:obra/superpowers/.cursor install -g
```

**Option 3 - Use junctions** (automatic fallback):
The CLI automatically tries junctions if symlinks fail. Junctions work without special permissions.

### Skills not triggering automatically

1. **Check descriptions**: The agent uses skill `description` fields to decide when to invoke
2. **Be explicit**: Mention keywords from the skill description in your message
3. **Manual test**: Use `/` to manually invoke and verify the skill loads
4. **Check context**: Some skills only apply in specific contexts

### "npm ERR!" or dependency issues

```bash
# Clear npm cache
npm cache clean --force

# Retry installation
npx github:obra/superpowers/.cursor install -g
```

### Multiple Cursor installations

If you have both stable and nightly:
- The CLI checks standard locations
- Symlinks go to `~/.cursor/` which both versions can use
- Make sure you're running the Nightly version

## Advanced Configuration

### Selective Skill Installation

To install only specific skills:

```bash
# Manual selective linking
cd ~/.cursor/skills
ln -sf ~/.cursor/superpowers/skills/brainstorming brainstorming
ln -sf ~/.cursor/superpowers/skills/systematic-debugging systematic-debugging
# ... only link skills you want
```

### Custom Skill Priority

Skills in `.cursor/skills/` (project) override `~/.cursor/skills/` (global).

To override a global skill with project-specific version:
```bash
cd your-project/.cursor/skills
mkdir -p my-skill
cp ~/.cursor/superpowers/skills/some-skill/SKILL.md my-skill/
# Edit my-skill/SKILL.md for project-specific customizations
```

### Keeping Skills Updated

**Option 1 - Auto-update script:**
```bash
# Add to crontab or Windows Task Scheduler
#!/bin/bash
cd ~/.cursor/superpowers && git pull
```

**Option 2 - Manual periodic updates:**
```bash
# Weekly/monthly
cd ~/.cursor/superpowers
git pull
```

No need to restart Cursor unless skill metadata (name/description) changes.

## Getting Help

- **Documentation**: [Cursor Skills](https://cursor.com/cn/docs/context/skills) | [Superpowers](https://github.com/obra/superpowers)
- **Issues**: [GitHub Issues](https://github.com/obra/superpowers/issues)
- **Discussions**: [GitHub Discussions](https://github.com/obra/superpowers/discussions)

When reporting issues, please include:
- Operating system and version
- Node.js version (`node --version`)
- Cursor version and update channel
- Full error messages
- Output of `npx github:obra/superpowers/.cursor list`
