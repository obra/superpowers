# Installing Superpowers for Kiro

## Prerequisites

- [Kiro IDE](https://kiro.dev) installed

## Installation via Powers Panel (Recommended)

1. Open Kiro IDE
2. Open the Powers panel
3. Click "Import power from GitHub"
4. Enter: `https://github.com/obra/superpowers/tree/main/.kiro-power`
5. Install the power
6. Click "Try the power" — the agent will install a global steering file to `~/.kiro/steering/superpowers.md`

After onboarding, the Superpowers workflow loads automatically in every conversation. Skills are read directly from the repo on disk — no file copying needed.

## Manual Installation

If you prefer not to use the Powers Panel, clone the repo and set up the steering file manually.

### macOS / Linux

```bash
git clone https://github.com/obra/superpowers.git ~/superpowers
mkdir -p ~/.kiro/steering
cp ~/superpowers/.kiro-power/steering/superpowers.md ~/.kiro/steering/superpowers.md
```

### Windows (PowerShell)

```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\superpowers"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.kiro\steering"
Copy-Item "$env:USERPROFILE\superpowers\.kiro-power\steering\superpowers.md" "$env:USERPROFILE\.kiro\steering\superpowers.md"
```

## How It Works

The global steering file (`~/.kiro/steering/superpowers.md`) loads in every conversation and tells the agent to:

1. Locate the superpowers repo on disk
2. Read `skills/using-superpowers/SKILL.md` from the repo
3. Follow the workflow and load other skills on demand

Skills are read directly from the filesystem — no `~/.kiro/skills/` installation, no symlinks, no `/` slash commands.

**Trade-off:** Skills are not available as `/` slash commands. Instead, the steering file bootstraps the workflow automatically, and you can ask the agent directly: "use the brainstorming skill".

## Updating

### Powers Panel Install

Update from the Powers panel in Kiro, or pull manually (check `~/.kiro/powers/repos/` for the actual directory name):

```bash
cd ~/.kiro/powers/repos/<power-directory> && git pull
```

### Manual Install

```bash
cd ~/superpowers && git pull
```

Skills load from the repo directly, so updates take effect immediately.

If the steering file format has changed, re-copy it:

```bash
cp ~/superpowers/.kiro-power/steering/superpowers.md ~/.kiro/steering/superpowers.md
```

## Uninstalling

Remove the power from the Powers panel, then delete the steering file:

**macOS / Linux:**
```bash
rm ~/.kiro/steering/superpowers.md
rm -rf ~/superpowers  # if manually cloned
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.kiro\steering\superpowers.md" -Force
Remove-Item "$env:USERPROFILE\superpowers" -Recurse -Force  # if manually cloned
```

## Troubleshooting

### Workflow not loading in new conversations

1. Verify the steering file exists: `cat ~/.kiro/steering/superpowers.md`
2. If missing, re-run the onboarding: activate the power and let the agent install it
3. Or copy manually: `cp <repo>/.kiro-power/steering/superpowers.md ~/.kiro/steering/superpowers.md`

### Agent can't find skills

1. Check the repo exists: `ls ~/.kiro/powers/repos/*/skills/` or `ls ~/superpowers/skills/`
2. Verify the repo has a `skills/using-superpowers/SKILL.md` file
3. Try telling the agent the repo path explicitly

### Tool mapping issues

If the agent uses Claude Code tool names instead of Kiro equivalents, remind it:
```text
Read skills with: executeBash cat <path>/SKILL.md or readFile. Do NOT use discloseContext for superpowers skills.
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
