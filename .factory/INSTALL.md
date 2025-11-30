# Installing Superpowers for Droid CLI (Factory)

Quick setup to enable superpowers skills in Factory's Droid CLI.

## Prerequisites

- [Droid CLI](https://docs.factory.ai/) installed
- Git installed
- Shell access (bash/zsh)

## One-Line Install

Run this in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/main/.factory/install.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/obra/superpowers/main/.factory/install.sh | bash
```

## Quick Install via Droid

Tell Droid:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/main/.factory/INSTALL.md
```

## Manual Installation

If you prefer manual setup:

```bash
# Clone repository
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers

# Run installer
~/.factory/superpowers/.factory/install.sh
```

Or step by step:

```bash
# 1. Clone
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers

# 2. Install skills
mkdir -p ~/.factory/skills
cp -r ~/.factory/superpowers/.factory/skills/* ~/.factory/skills/

# 3. Install droids
mkdir -p ~/.factory/droids
cp ~/.factory/superpowers/.factory/droids/* ~/.factory/droids/

# 4. Install commands
mkdir -p ~/.factory/commands
cp ~/.factory/superpowers/.factory/commands/* ~/.factory/commands/

# 5. Install protocol (choose one)
# New installation:
cp ~/.factory/superpowers/.factory/AGENTS.md ~/.factory/AGENTS.md

# Or append to existing:
cat ~/.factory/superpowers/.factory/AGENTS.md >> ~/.factory/AGENTS.md
```

## Verification

Start a **new Droid CLI session** and run these tests:

### Test 1: Commands

Type `/brainstorm` and verify:
- [ ] AI announces: "I'm using the brainstorming skill..."
- [ ] AI calls `Skill("brainstorming")` tool
- [ ] AI asks questions one at a time

### Test 2: Automatic Skill Detection

Say: `I want to build a simple todo app`

Verify:
- [ ] AI checks for existing docs first
- [ ] AI uses brainstorming skill automatically
- [ ] AI follows the protocol (doesn't jump to coding)

### Test 3: Droids Available

Say: `What droids are available for dispatching?`

Verify AI mentions:
- [ ] `general-purpose`
- [ ] `code-reviewer`
- [ ] `explore`
- [ ] `plan`

### Test 4: Skills List

Say: `List all available skills`

Verify AI shows skills including:
- [ ] `brainstorming`
- [ ] `test-driven-development`
- [ ] `systematic-debugging`
- [ ] `writing-plans`

### Test 5: Protocol Active

Say: `Help me debug this error: undefined is not a function`

Verify:
- [ ] AI announces using `systematic-debugging` skill
- [ ] AI follows 4-phase debugging framework
- [ ] AI doesn't just guess the solution

### Quick Checklist

```
✅ /brainstorm triggers Skill tool
✅ New features trigger brainstorming automatically
✅ Droids are available for Task tool
✅ Skills list is complete
✅ Protocol prevents jumping to code
```

If any test fails, see [Troubleshooting](#troubleshooting) section.

## Updating

```bash
cd ~/.factory/superpowers
git pull
~/.factory/superpowers/.factory/install.sh
```

Or manually:

```bash
cd ~/.factory/superpowers && git pull
cp -r .factory/skills/* ~/.factory/skills/
cp .factory/droids/* ~/.factory/droids/
cp .factory/commands/* ~/.factory/commands/
```

## Uninstall

```bash
# Remove superpowers repository
rm -rf ~/.factory/superpowers

# Remove skills (caution: removes ALL skills including personal ones)
# rm -rf ~/.factory/skills

# Remove droids
# rm -rf ~/.factory/droids

# Remove commands
# rm -rf ~/.factory/commands

# Edit ~/.factory/AGENTS.md to remove superpowers protocol section
```

## Troubleshooting

### Skills not loading

1. Verify installation: `ls ~/.factory/skills/`
2. Restart Droid CLI session
3. Check AGENTS.md: `grep "SUPERPOWERS" ~/.factory/AGENTS.md`

### AI skipping protocol

- Remind: "Please follow the superpowers protocol"
- Restart session to reload AGENTS.md

### Commands not working

1. Verify commands exist: `ls ~/.factory/commands/`
2. Restart Droid CLI session

## More Information

- Full documentation: [docs/README.factory.md](../docs/README.factory.md)
- Report issues: https://github.com/obra/superpowers/issues
