# Development Setup: Local Mode for OpenCode

Use this guide to run Superpowers from a local fork instead of the published git plugin. This lets you test skill changes in real OpenCode sessions immediately, without pushing to a remote.

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- A local clone of your Superpowers fork

## Switching to Dev Mode

### 1. Disable the git-based plugin

In your `opencode.json` (global at `~/.config/opencode/opencode.json` or project-level), remove or comment out the superpowers entry from the `plugin` array:

```jsonc
{
  // "plugin": ["superpowers@git+https://github.com/yourfork/superpowers.git"]
  "plugin": []
}
```

If you have other plugins in the array, keep those -- only remove the superpowers entry.

### 2. Clear any existing plugin file

Check whether a `superpowers.js` file already exists in the global plugins directory (from a previous install or old symlink):

```bash
ls -la ~/.config/opencode/plugins/superpowers.js
```

If a file exists (real file or stale symlink), remove it:

```bash
rm -f ~/.config/opencode/plugins/superpowers.js
```

### 3. Create the symlink

```bash
ln -s /path/to/your/fork/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/superpowers.js
```

Replace `/path/to/your/fork` with the actual path to your local clone.

### 4. Restart OpenCode

Restart OpenCode. The plugin will now load from your local fork.

### 5. Verify

Ask OpenCode: "Tell me about your superpowers"

You can also confirm the skills directory is pointing at your fork by asking the agent to list available skills using the `skill` tool.

## Switching Back to Plugin Mode

When you're done developing and want to go back to the published version:

```bash
# 1. Remove the symlink
rm ~/.config/opencode/plugins/superpowers.js

# 2. Re-enable the plugin in opencode.json
#    Uncomment the plugin line you disabled earlier
```

Then restart OpenCode.

## How It Works

The plugin entry point (`.opencode/plugins/superpowers.js`) uses `import.meta.url` to determine its own location on disk:

```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
```

When Node.js (or Bun) resolves `import.meta.url` through a symlink, it follows the symlink to the **real file path**. So `__dirname` ends up pointing into your fork's `.opencode/plugins/` directory, and `../../skills` resolves to your fork's `skills/` directory.

This means changes to any skill file in your fork are picked up on the next OpenCode restart -- no build step, no push, no reinstall.

## Troubleshooting

### Double-loading (skills appear twice)

You have both the git-based plugin AND the symlink active. Remove the `plugin` entry from `opencode.json` (see step 1 above).

### "File exists" error when creating symlink

A real file or old symlink is already at `~/.config/opencode/plugins/superpowers.js`. Remove it first (step 2 above).

### Skills not updating after edits

OpenCode loads skills at startup. Restart OpenCode after editing skill files.

### Plugin not loading at all

1. Verify the symlink target exists: `ls -la ~/.config/opencode/plugins/superpowers.js`
2. Verify the target is valid: the symlink should point to a real `.opencode/plugins/superpowers.js` file in your fork
3. Check OpenCode logs: `opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
