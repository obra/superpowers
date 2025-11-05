# Installing Superpowers for GitHub Copilot

Quick setup to enable superpowers skills in GitHub Copilot.

## Prerequisites

- GitHub Copilot subscription (Individual, Business, or Enterprise)
- VS Code with GitHub Copilot extension (or other supported IDE)
- Node.js installed (for superpowers-copilot command)

## Installation

### 1. Clone superpowers repository

```bash
mkdir -p ~/.copilot/superpowers
cd ~/.copilot/superpowers
git clone https://github.com/obra/superpowers.git .
```

### 2. Create personal skills directory

```bash
mkdir -p ~/.copilot/skills
```

### 3. Make CLI executable

```bash
chmod +x ~/.copilot/superpowers/.copilot/superpowers-copilot
```

### 4. Choose Bootstrap Method

You have two options for bootstrapping superpowers:

#### Option A: Using .github/copilot-instructions.md (Recommended)

Create `.github/copilot-instructions.md` in your project root:

```bash
mkdir -p <your-project>/.github
cp ~/.copilot/superpowers/.copilot/templates/copilot-instructions.md.template \
   <your-project>/.github/copilot-instructions.md
```

#### Option B: Using AGENTS.md

Create `AGENTS.md` in your project root:

```bash
cp ~/.copilot/superpowers/.copilot/templates/AGENTS.md.template \
   <your-project>/AGENTS.md
```

## Verification

### Test in VS Code

1. Open your project in VS Code
2. Open GitHub Copilot Chat (Ctrl+Alt+I or Cmd+Alt+I on Mac)
3. Type: `run the bootstrap command`
4. Copilot should execute: `~/.copilot/superpowers/.copilot/superpowers-copilot bootstrap`
5. You should see skill listings and instructions

### Test skill loading

In Copilot Chat:
```
Load the superpowers:brainstorming skill and help me design a feature
```

Copilot should run:
```bash
~/.copilot/superpowers/.copilot/superpowers-copilot use-skill superpowers:brainstorming
```

## IDE-Specific Notes

### VS Code
- Works with Agent Mode and standard Chat
- Use @workspace for full project context
- Slash commands: /tests, /fix, /refactor integrate well with skills

### IntelliJ IDEA
- Copilot instructions support confirmed
- May require plugin update for full agent features

### Visual Studio
- Basic instructions support available
- Test with your specific version

### Other IDEs
- GitHub Copilot is available in Xcode, Vim, Neovim, and JetBrains IDEs
- Custom instructions support may vary by IDE

## Troubleshooting

**Skills not loading?**
- Verify .github/copilot-instructions.md or AGENTS.md exists in your project root
- Check "References" section in Copilot chat response to see if instructions file was loaded
- Try reloading VS Code window (Cmd/Ctrl+Shift+P → "Developer: Reload Window")

**Command not found?**
- Verify Node.js is installed: `node --version`
- Check file is executable: `ls -la ~/.copilot/superpowers/.copilot/superpowers-copilot`
- Try full path in instructions file

**Skills seem outdated?**
- Update repository: `cd ~/.copilot/superpowers && git pull`

**Copilot not using skills?**
- Explicitly ask Copilot to use a skill: "Use the superpowers:test-driven-development skill"
- Check that bootstrap instructions include `<EXTREMELY_IMPORTANT>` tags
- Verify the instructions file is in the correct location
