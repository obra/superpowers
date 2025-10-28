# Installing Superpowers for Codex

This guide will help you install and set up the Superpowers skill system for Codex.

## Quick Installation

1. **Clone Superpowers to ~/.codex/superpowers/**:
   ```bash
   mkdir -p ~/.codex/superpowers
   cd ~/.codex/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

3. **Add script paths to your environment** (optional but recommended):
   ```bash
   echo 'export PATH="$HOME/.codex/superpowers/scripts:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

## Directory Structure

After installation, you'll have:

```
~/.codex/
├── superpowers/           # Core superpowers repository
│   ├── skills/           # Core skills (brainstorming, TDD, etc.)
│   ├── scripts/          # find-skills and skill-run tools
│   └── .codex/           # Codex-specific configuration
└── skills/               # Your personal skills (override core)
    └── category/
        └── skill-name/
            └── SKILL.md
```

## Tool Usage

### Finding Skills
```bash
find-skills                    # List all available skills
find-skills brainstorm        # Filter skills by pattern
```

### Running Skills
```bash
skill-run brainstorming              # Load a skill
skill-run skills/brainstorming       # Same thing
```

## Skill Override System

Personal skills in `~/.codex/skills/` take precedence over core skills:

- **Core skill**: `~/.codex/superpowers/skills/brainstorming/SKILL.md`
- **Personal override**: `~/.codex/skills/brainstorming/SKILL.md` ← This wins

## Bootstrap Setup

The bootstrap system ensures Codex automatically:

1. Reads the superpowers-bootstrap.md on startup
2. Runs find-skills to show available skills
3. Knows how to use the skill tools

See `~/.codex/AGENTS.md` for the bootstrap configuration.

## Troubleshooting

### Scripts not found
```bash
# Add to PATH or use full paths:
~/.codex/superpowers/scripts/find-skills
~/.codex/superpowers/scripts/skill-run
```

### No skills showing
```bash
# Check directory structure:
ls ~/.codex/superpowers/skills/
ls ~/.codex/skills/
```

### Permission errors
```bash
# Make scripts executable:
chmod +x ~/.codex/superpowers/scripts/*
```

## Creating Personal Skills

1. Create directory structure:
   ```bash
   mkdir -p ~/.codex/skills/my-category/my-skill
   ```

2. Create SKILL.md with frontmatter:
   ```markdown
   ---
   name: My Skill Name
   description: What this skill does
   when_to_use: When to apply this skill
   ---

   # My Skill

   Skill content here...
   ```

3. Test it:
   ```bash
   find-skills my-skill
   skill-run my-skill
   ```

## Integration with Codex

Once installed, Codex will automatically have access to:

- **find-skills**: Discover available skills
- **skill-run**: Load and apply skills
- **Mandatory workflows**: Brainstorming before coding, systematic debugging, etc.
- **TodoWrite integration**: Checklist tracking from skills

The bootstrap ensures these tools are available from the first Codex session.

## Compatibility Notes

- Scripts are compatible with bash 3.2+ (works on macOS and Linux)
- No external dependencies required
- Works with existing Codex configuration