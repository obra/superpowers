# Installing Superpowers for Trae IDE

## Prerequisites

- [Trae IDE](https://www.trae.ai) installed
- Git installed

## Installation Steps

### 1. Clone Superpowers

```bash
git clone https://github.com/obra/superpowers.git ~/.trae/superpowers
```

### 2. Symlink Skills

Create a symlink so Trae's native skill discovery finds superpowers skills:

```bash
mkdir -p ~/.trae/skills
rm -rf ~/.trae/skills/superpowers
ln -s ~/.trae/superpowers/skills ~/.trae/skills/superpowers
```

### 3. Restart Trae IDE

Restart Trae IDE. Skills will be auto-discovered from `~/.trae/skills/superpowers/`.

Verify by asking: "do you have superpowers?"

## Usage

### Finding Skills

Trae automatically discovers and suggests skills based on context. You can also explicitly request them:

```
use the brainstorming skill
```

### Personal Skills

Create your own skills in `~/.trae/skills/`:

```bash
mkdir -p ~/.trae/skills/my-skill
```

Create `~/.trae/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.trae/skills/` within your project:

```bash
mkdir -p .trae/skills/my-project-skill
```

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

```bash
cd ~/.trae/superpowers
git pull
```

## Troubleshooting

### Skills not found

1. Check symlink: `ls -l ~/.trae/skills/superpowers`
2. Verify it points to: `~/.trae/superpowers/skills`
3. Restart Trae IDE — skills are discovered at startup

### Skills not triggering automatically

Add a User Rule in Trae IDE via **Settings > Rules & Skills > User Rules** with the following content:

```
You have access to superpowers skills located at ~/.trae/skills/superpowers/.
Before responding to any task, check if a superpowers skill applies.
To load a skill, read the SKILL.md file from ~/.trae/skills/superpowers/{skill-name}/SKILL.md
Key skills available: brainstorming, writing-plans, subagent-driven-development,
test-driven-development, systematic-debugging, requesting-code-review.
Always use the using-superpowers skill guidelines when deciding whether to invoke a skill.
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.trae.md
