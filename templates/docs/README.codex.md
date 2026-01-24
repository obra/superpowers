<!-- GENERATED: do not edit directly. Source: templates/docs/README.codex.md -->
# Superpowers for {{AGENT_NAME}}

Complete guide for using Superpowers with {{AGENT_NAME}}.

## Quick Install

Tell {{AGENT_NAME}}:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.{{AGENT_ID}}/INSTALL.md
```

## Manual Installation

### Prerequisites

- Access to {{AGENT_NAME}}
- Shell access to install files

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p {{SUPERPOWERS_DIR}}
git clone https://github.com/obra/superpowers.git {{SUPERPOWERS_DIR}}
```

#### 2. Install Bootstrap

The bootstrap file is included in the repository at `.{{AGENT_ID}}/superpowers-bootstrap.md`. {{AGENT_NAME}} will automatically use it from the cloned location.

#### 3. Verify Installation

Tell Codex:

```
Run {{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run {{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} find-skills
```

### Loading a Skill

```
Run {{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} use-skill superpowers:brainstorming
```

### Bootstrap All Skills

```
Run {{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `{{SKILLS_DIR}}/`:

```bash
mkdir -p {{SKILLS_DIR}}/my-skill
```

Create `{{SKILLS_DIR}}/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Architecture

### {{AGENT_NAME}} CLI Tool

**Location:** `{{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}}`

A Node.js CLI script that provides three commands:
- `bootstrap` - Load complete bootstrap with all skills
- `use-skill <name>` - Load a specific skill
- `find-skills` - List all available skills

### Shared Core Module

**Location:** `~/.codex/superpowers/lib/skills-core.js`

The {{AGENT_NAME}} implementation uses the shared `skills-core` module (ES module format) for skill discovery and parsing. This is the same module used by the OpenCode plugin, ensuring consistent behavior across platforms.

### Tool Mapping

Skills written for Claude Code are adapted for {{AGENT_NAME}} with these mappings:

- `TodoWrite` → `update_plan`
- `Task` with subagents → Tell user subagents aren't available, do work directly
- `Skill` tool → `{{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} use-skill`
- File operations → Native {{AGENT_NAME}} tools

## Templates & Rendering

Source files live in `templates/`. Regenerate agent-specific outputs with:

```bash
node scripts/render-agent.js --agent codex --write
```

Validate all templates:

```bash
bash tests/render-templates.sh
```

## Updating

```bash
cd {{SUPERPOWERS_DIR}}
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls {{SUPERPOWERS_DIR}}/skills`
2. Check CLI works: `{{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} find-skills`
3. Verify skills have SKILL.md files

### CLI script not executable

```bash
chmod +x {{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}}
```

### Node.js errors

The CLI script requires Node.js. Verify:

```bash
node --version
```

Should show v14 or higher (v18+ recommended for ES module support).

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Blog post: https://blog.fsck.com/2025/10/27/skills-for-openai-codex/

## Note

{{AGENT_NAME}} support is experimental and may require refinement based on user feedback. If you encounter issues, please report them on GitHub.
