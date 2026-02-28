# Installing Superpowers for Gemini CLI

Enable superpowers skills in [Gemini CLI](https://geminicli.com) via native skill discovery.

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

## Prerequisites

- Git
- Gemini CLI v0.24.0+ (v0.28.0+ recommended for native extensions)
- Node.js (required for deterministic skill routing hooks)
- Python 3 (used by installer for safe JSON manipulation)

## Quick Install (Recommended)

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

This will:
1. Clone the repository to `~/.gemini/superpowers`
2. Run the enhanced installer script
3. Create skill symlinks using the hub pattern
4. Register deterministic routing hooks (enabled by default, use --no-hooks to skip)
5. Inject Superpowers context into `~/.gemini/GEMINI.md`

## Installation Methods

### Method 1: Enhanced Installer (Hub Pattern)

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
- Supports deterministic routing hooks (enabled by default)

**Options**:
- `--antigravity`: Install for Antigravity skill marketplace
- `--native`: Show native extension installation instructions  
- `--no-hooks`: Skip hook registration (use YOLO mode or explicit invocation)
- `--help`: Show help message

### Method 2: Native Extension Installation

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

### Method 3: Antigravity Support

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

## Verification

Ask Gemini:

> "Do you have superpowers?"

It should respond affirmatively and list available skills.

Check skill discovery:

```bash
ls -l ~/.gemini/skills/
```

You should see symlinks pointing to skill directories in `~/.gemini/superpowers/skills/`.

## Usage

### Finding Skills

Use Gemini's native skill discovery:

```text
/skills list
```

### Loading a Skill

**You must explicitly invoke skills**:

```text
use the brainstorming skill
```

Or reference directly:

```text
help me plan this feature using the writing-plans skill
```

### Deterministic Routing (Optional)

If you have Node.js installed, the installer registers hooks for deterministic skill routing by default (use --no-hooks flag to disable):

- **`beforeAgent` hook**: `superpowers-router` - analyzes user prompts and suggests relevant skills
- **`beforeTool` hook**: `superpowers-guard` - intercepts commit/merge operations and suggests verification skills

The `superpowers-router` provides two layers of activation:
1. **Deterministic Triggers**: Specific phrases (e.g., "let's build", "debug this", "write tests") guarantee activation of matching skills
2. **Gateway Reminder**: For all other prompts, injects a reminder to check available skills before responding

The `superpowers-guard` intercepts specific agent behaviors:
- **Before commit/push**: Suggests the "verification-before-completion" skill
- **Before merge/PR**: Suggests the "finishing-a-development-branch" skill

Check hooks in `~/.gemini/settings.json`:

```json
"hooks": {
  "beforeAgent": [
    {
      "name": "superpowers-router",
      "command": "node",
      "args": ["/path/to/superpowers/agents/superpowers-router.js"],
      "matcher": ".*"
    }
  ],
  "beforeTool": [
    {
      "name": "superpowers-guard",
      "command": "node",
      "args": ["/path/to/superpowers/agents/superpowers-guard.js"],
      "matcher": ".*"
    }
  ]
}
```

## Updating

### Hub Pattern Installation

```bash
cd ~/.gemini/superpowers && git pull
```

Skills update instantly through the symlinks.

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
[ -d ~/.gemini/skills ] && find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete

# Remove agent symlinks  
[ -d ~/.gemini/agents ] && find ~/.gemini/agents -type l -lname '*/superpowers/agents/*' -delete

# Remove hooks from settings.json
python3 -c "
import json
with open('$HOME/.gemini/settings.json') as f: d = json.load(f)
for k in ('beforeAgent','beforeTool'):
    d.get('hooks',{}).get(k,[])[:] = [h for h in d.get('hooks',{}).get(k,[]) if 'superpowers' not in h.get('name','')]
with open('$HOME/.gemini/settings.json','w') as f: json.dump(d,f,indent=2); f.write('\n')
"

# Clean up GEMINI.md
sed -i.bak '/<\!-- SUPERPOWERS-CONTEXT-START -->/, /<\!-- SUPERPOWERS-CONTEXT-END -->/d' ~/.gemini/GEMINI.md && rm -f ~/.gemini/GEMINI.md.bak

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
- Ensure symlinks were created in `~/.gemini/skills/`
- Restart Gemini CLI
- Check `~/.gemini/settings.json` for any errors

### Hooks Not Working
- Verify Node.js is installed and in PATH
- Check hook registration in `~/.gemini/settings.json`
- Look for error messages in Gemini CLI logs

### Auto-Activation Not Working
**This is expected behavior**. Gemini CLI does not automatically activate skills based on context. You must explicitly invoke skills by name.

## Support

- Issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers/tree/main/docs
- Gemini CLI Discord: https://discord.gg/geminicli