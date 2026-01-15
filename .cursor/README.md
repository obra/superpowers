# Cursor Support for Superpowers

Native [Agent Skills](https://cursor.com/cn/docs/context/skills) integration for Cursor IDE.

## Quick Install

```bash
# Install globally (available in all projects)
npx github:obra/superpowers/.cursor install --global

# Or install locally (current project only)
npx github:obra/superpowers/.cursor install --local
```

That's it! Restart Cursor and your skills will be ready.

## What is Cursor's Agent Skills?

Cursor supports [Agent Skills](https://cursor.com/cn/docs/context/skills), an open standard for packaging reusable AI agent knowledge and workflows. Skills are:

- **Auto-discovered**: From `.cursor/skills/` directories
- **Context-aware**: Agent decides when to use them
- **Manually invokable**: Type `/` in chat to select

## Features

✨ **One-command install** via npx - no manual setup  
🔗 **Symlink-based** - skills stay synced with repo  
🌍 **Global or local** - choose per-project or system-wide  
🎨 **Beautiful CLI** - with spinners, colors, and clear feedback  
📦 **Cross-platform** - works on macOS, Linux, and Windows  
🔄 **Full cleanup** - removes symlinks/junctions referencing superpowers  

## Usage

### Installation

**Global installation** (recommended - works in all projects):
```bash
npx github:obra/superpowers/.cursor install -g
```

**Local installation** (project-specific):
```bash
cd your-project
npx github:obra/superpowers/.cursor install -l
```

### List Skills

```bash
# List all skills
npx github:obra/superpowers/.cursor list

# List only global skills
npx github:obra/superpowers/.cursor list -g

# List only local skills
npx github:obra/superpowers/.cursor list -l
```

The command now shows both superpowers skills (✓) and any custom skills you added directly under `.cursor/skills/`.

### Uninstall

```bash
# Uninstall global
npx github:obra/superpowers/.cursor uninstall -g

# Uninstall local
npx github:obra/superpowers/.cursor uninstall -l
```

## How It Works

### Architecture

```
~/.cursor/
├── superpowers/              # Full superpowers repo
│   └── skills/
│       ├── brainstorming/
│       │   └── SKILL.md
│       ├── systematic-debugging/
│       │   └── SKILL.md
│       └── ...
└── skills/                   # Symlinked skills (Cursor discovers these)
    ├── brainstorming -> ../superpowers/skills/brainstorming
    ├── systematic-debugging -> ../superpowers/skills/systematic-debugging
    └── ...
```

**Why symlinks?**
- Skills stay in sync with superpowers repo
- Easy updates with `git pull` in `~/.cursor/superpowers`
- Can selectively enable/disable skills
- Works for both global and project-local installs

### Skill Discovery

Cursor automatically discovers skills from:

| Location | Scope | Priority |
|----------|-------|----------|
| `.cursor/skills/` | Project | Highest |
| `~/.cursor/skills/` | Global | Medium |
| `.claude/skills/` | Compat | Low |

Project skills override global skills with the same name.

### Using Skills

**Automatic invocation** (recommended):
Just describe your task - the agent automatically uses appropriate skills based on their `description` field.

**Manual invocation**:
Type `/` in chat, then search for the skill name.

## Requirements

- **Cursor IDE** with **Nightly channel** enabled
- **Node.js** 14.0.0 or higher
- **Git** (for updates)

### Enable Nightly Channel

Agent Skills are currently Nightly-only:

1. Open Cursor Settings (`Cmd+Shift+J` on Mac, `Ctrl+Shift+J` on Windows/Linux)
2. Navigate to **Beta** tab
3. Set **Update Channel** to **Nightly**
4. Restart Cursor after update completes

## Troubleshooting

### Skills not appearing

1. **Check Nightly channel**: Settings → Beta → Update Channel → Nightly
2. **Restart Cursor** after installation
3. **Verify installation**:
   ```bash
   # Check skills directory exists
   ls -la ~/.cursor/skills/
   
   # List installed skills
   npx github:obra/superpowers/.cursor list
   ```
4. **View in settings**: Settings → Rules → Agent Decides

### Symlinks not working (Windows)

Windows may require admin privileges for symlinks. The CLI automatically falls back to junctions, which work without admin.

If you still have issues:
```powershell
# Run PowerShell as Administrator, then:
npx github:obra/superpowers/.cursor install -g
```

### Skills not triggering

1. **Check descriptions**: Skills trigger based on their `description` field
2. **Be explicit**: Mention keywords from skill descriptions
3. **Manual test**: Type `/` and manually invoke the skill to verify it loads

## Comparison with Other Platforms

| Feature | Cursor | Claude Code | OpenCode | Codex |
|---------|--------|-------------|----------|-------|
| **Installation** | `npx` CLI | File symlinks | Plugin + npm | CLI script |
| **Discovery** | Automatic | Automatic | Plugin tools | Bootstrap |
| **Invocation** | Auto + `/` | Auto + `Skill` | `use_skill` | CLI command |
| **Updates** | `git pull` | `git pull` | `git pull` | `git pull` |

All platforms use the same `SKILL.md` format for cross-compatibility.

## Architecture

### Shared Core Module

Cursor implementation uses the **shared `lib/skills-core.js` module**, maintaining consistency with Codex and OpenCode:

```
lib/skills-core.js          # Shared skill logic
├── extractFrontmatter()    # Parse YAML metadata
├── findSkillsInDir()       # Discover skills recursively
├── stripFrontmatter()      # Remove YAML from content
├── resolveSkillPath()      # Handle skill shadowing
└── checkForUpdates()       # Git update detection
```

**Platform wrappers:**
- **Cursor**: `.cursor/cli.js` (NPX CLI)
- **Codex**: `.codex/superpowers-codex` (CLI script)
- **OpenCode**: `.opencode/plugin/superpowers.js` (Plugin)

All platforms use the same skill discovery and parsing logic, ensuring consistent behavior.

The CLI uses the same shared `lib/skills-core.js` that Codex and OpenCode rely on, so fixes here propagate everywhere.

## Development

### Local Development

```bash
# Clone repo
git clone https://github.com/obra/superpowers.git
cd superpowers/.cursor

# Install dependencies
npm install

# Test locally
node cli.js install --global

# Verify skills-core integration
node cli.js list
```

### Testing Consistency

Verify Cursor and Codex discover identical skills:

```bash
# Codex
~/.codex/superpowers/.codex/superpowers-codex find-skills

# Cursor
node .cursor/cli.js list --global

# Should show same skills with same metadata
```

### Publishing

The package is designed to be used directly from GitHub via npx:

```bash
npx github:obra/superpowers/.cursor [command]
```

To publish to npm (optional):
```bash
npm publish --access public
```

Then users can use:
```bash
npx @superpowers/cursor [command]
```

## Links

- [Cursor Agent Skills Documentation](https://cursor.com/cn/docs/context/skills)
- [Agent Skills Open Standard](https://agentskills.io)
- [Superpowers Repository](https://github.com/obra/superpowers)
- [Report Issues](https://github.com/obra/superpowers/issues)

## License

MIT License - see [LICENSE](../LICENSE) for details.
