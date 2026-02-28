# Superpowers for Gemini CLI

Guide for using Superpowers with Google's Gemini CLI.

## Quick Start

### Method 1: Enhanced Installer (Recommended)

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

### Method 2: Native Extension (Gemini CLI v0.28.0+)

```bash
gemini extension install https://github.com/obra/superpowers
```

### Method 3: Antigravity Support

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/skills/superpowers && ~/.gemini/antigravity/skills/superpowers/.gemini/install.sh --antigravity
```

**Restart Gemini CLI after installation.**

## Important: Realistic Expectations

**Gemini CLI treats `GEMINI.md` as advisory context**, not mandatory hooks. Unlike Claude Code, Gemini does not automatically activate skills based solely on this file.

### Recent Improvements (v0.30.0+)
- **Enhanced Skill Matching**: Better heuristics for matching user requests to skill descriptions
- **Improved Hook System**: More reliable BeforeAgent/BeforeTool hook execution
- **YOLO Mode**: Use `--yolo` flag or Ctrl+Y to auto-approve skill activations and tool calls
- **Deterministic Routing**: Better support for deterministic skill routing via hooks

### What Works Well
- Skills are discoverable via `/skills list`
- Manual skill invocation works reliably
- Deterministic routing via hooks (requires Node.js)
- Symlink-based updates (hub pattern)
- YOLO mode for auto-approval of skill activations

### What's Less Reliable
- Auto-activation based on context alone (without YOLO mode)
- Skill suggestion without explicit user request
- Automatic skill detection for relevant tasks

**Plan for explicit skill invocation** and you'll have a great experience. **Use YOLO mode (`--yolo`)** for more automatic behavior.

## Installation Methods

### Enhanced Installer (Hub Pattern)

The default installer creates individual symlinks for each skill and agent:

```bash
# Clone the repository
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers

# Run the installer
~/.gemini/superpowers/.gemini/install.sh
```

**Benefits**:
- Skills update instantly via git pull
- Individual symlinks prevent conflicts
- Compatible with all Gemini CLI versions
- Supports deterministic routing hooks

### Native Extension Installation

For Gemini CLI v0.28.0+ with native extension support:

```bash
# Clone to any location
git clone https://github.com/obra/superpowers.git

# Install as native extension
gemini extension install ./superpowers/.gemini
```

**Benefits**:
- Clean integration with Gemini's extension system
- Automatic updates via `gemini extension update`
- Better future compatibility

### Antigravity Support

For users of [Antigravity](https://github.com/antigravity-fm/antigravity) (Gemini's skill marketplace):

```bash
# Clone to Antigravity skills directory
git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/skills/superpowers

# Run the installer with antigravity flag
~/.gemini/antigravity/skills/superpowers/.gemini/install.sh --antigravity
```

**Benefits**:
- Works alongside other Antigravity skills
- Centralized skill management
- Automatic discovery by Antigravity

## How It Works

### Skill Discovery
Gemini CLI (v0.24.0+) natively supports Agent Skills. At startup it scans `~/.gemini/skills/` for directories containing a `SKILL.md` file and injects their name and description into the system prompt.

### Skill Activation
When a task matches a skill's description, Gemini *may* call the `activate_skill` tool to load the full instructions. However, **auto-activation is not reliable** due to Gemini's architectural design (see [Issue #128](https://github.com/obra/superpowers/issues/128)).

### Deterministic Routing (Optional)
If you have Node.js installed, the installer registers hooks for deterministic skill routing:
- `beforeAgent` hook: `superpowers-router` - analyzes prompts and suggests skills
- `beforeTool` hook: `superpowers-guard` - intercepts commit/merge operations

These hooks attempt to bridge the auto-activation gap by analyzing user prompts and explicitly suggesting relevant skills.

The `superpowers-router` hook provides two layers of activation:
1. **Deterministic Triggers**: Specific phrases (e.g., "let's build", "debug this", "write tests") guarantee activation of matching skills
2. **Gateway Reminder**: For all other prompts, injects a reminder to check available skills before responding

The `superpowers-guard` hook intercepts specific agent behaviors:
- **Before commit/push**: Suggests the "verification-before-completion" skill
- **Before merge/PR**: Suggests the "finishing-a-development-branch" skill

## Usage

### Finding Skills

Use Gemini's native skill discovery:

```text
/skills list
```

### Loading a Skill

**You must explicitly invoke skills for reliable activation**:

```text
use the brainstorming skill
```

Or reference directly:

```text
help me plan this feature using the writing-plans skill
```

### Available Superpowers Skills

| Skill | Description |
|-------|-------------|
| **Brainstorming** | Generate ideas, explore possibilities, consider alternatives |
| **Writing Plans** | Create structured development plans with clear goals and steps |
| **Test-Driven Development** | Write tests first, implement incrementally |
| **Systematic Debugging** | Methodical approach to finding and fixing bugs |
| **Subagent-Driven Development** | Coordinate specialized sub-agents for complex tasks |
| **Executing Plans** | Follow through on development plans step by step |
| **Receiving Code Review** | Incorporate feedback and improve code quality |
| **Requesting Code Review** | Prepare code for review and address feedback |
| **Dispatching Parallel Agents** | Manage multiple concurrent tasks |
| **Using Git Worktrees** | Work with multiple Git branches simultaneously |
| **Finishing a Development Branch** | Complete and clean up feature branches |
| **Verification Before Completion** | Ensure quality before marking tasks done |
| **Writing Skills** | Create new Superpowers skills for specific tasks |
| **Using Superpowers** | General guidance on leveraging the Superpowers ecosystem |

### Agent Definitions

Agent definitions are available in `~/.gemini/agents/`:
- `implementer.md` - Implementation specialist
- `code-reviewer.md` - Code review specialist  
- `spec-reviewer.md` - Specification review specialist

## Updating

### Hub Pattern Installation

```bash
cd ~/.gemini/superpowers && git pull && .gemini/install.sh
```

> **Note:** Re-running the installer ensures any new skills, agents, or hooks added upstream are linked correctly.

### Native Extension Installation

```bash
gemini extension update superpowers
```

### Antigravity Installation

```bash
cd ~/.gemini/antigravity/skills/superpowers && git pull
```

## Uninstalling

### Remove All Components

```bash
# Remove skill symlinks
[ -d ~/.gemini/skills ] && find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete 2>/dev/null

# Remove agent symlinks  
[ -d ~/.gemini/agents ] && find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete 2>/dev/null

# Remove hooks from settings.json
python3 -c "
import json
with open('$HOME/.gemini/settings.json') as f: d = json.load(f)
for k in ('beforeAgent','beforeTool'):
    d.get('hooks',{}).get(k,[])[:] = [h for h in d.get('hooks',{}).get(k,[]) if 'superpowers' not in h.get('name','')]
with open('$HOME/.gemini/settings.json','w') as f: json.dump(d,f,indent=2); f.write('\n')
"

# Remove the injected Superpowers context block from GEMINI.md
sed -i.bak '/<!-- SUPERPOWERS-CONTEXT-START -->/,/<!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak

# Remove the repo
rm -rf ~/.gemini/superpowers
```

### Native Extension Uninstall

```bash
gemini extension uninstall superpowers
```

### Antigravity Uninstall

```bash
rm -rf ~/.gemini/antigravity/skills/superpowers
```

## Troubleshooting

### Skills Not Appearing in `/skills list`
1. **Check skills are enabled**: Run `/settings` in Gemini CLI → search "Skills" → ensure `skills.enabled` is `true` (it is on by default in v0.24.0+).
2. **Check symlinks**: `ls -l ~/.gemini/skills/` — should show symlinks into your superpowers clone
3. **Check Gemini version**: Skills require v0.24.0+ (v0.30.0+ recommended for improved auto-activation). Run `gemini --version`
4. **Reload Skills**: Run `/skills reload` or restart Gemini CLI.

### Hooks Not Working
1. Verify Node.js is installed and in PATH
2. Check hook registration in `~/.gemini/settings.json`
3. Look for error messages in Gemini CLI logs

### Auto-Activation Not Working
**This is expected behavior**. Gemini CLI does not automatically activate skills based on context. You must explicitly invoke skills by name.

## Support

- Issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers/tree/main/docs
- Gemini CLI Discord: https://discord.gg/geminicli

## Architectural Notes

### Symlink Strategy
The "hub pattern" (individual symlinks per skill) **is used for Gemini CLI** but **not exclusively recommended** by Obra Superpowers. Other platforms use different approaches:

- **Codex**: Single directory symlink (`~/.agents/skills/superpowers`)
- **OpenCode**: Two symlinks (plugin + skills directory)
- **Claude/Cursor**: Plugin marketplace, no symlinks

The hub pattern works well with Gemini CLI's skill discovery but differs from other platform integrations.

### Skill Auto-Activation Research
Gemini CLI's architectural differences from Claude Code affect skill auto-activation. See [Issue #128](https://github.com/obra/superpowers/issues/128) for detailed research. Recent Gemini CLI releases (v0.30.0+) have improved auto-activation heuristics, and v0.31.0 introduced YOLO mode (`--yolo` or Ctrl+Y) for auto-approving skill activations. However, the fundamental advisory nature of `GEMINI.md` remains—skills are suggestions, not mandatory instructions.

## License

Superpowers is open source software licensed under the MIT License.