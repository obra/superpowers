# Installing Superpowers for Gemini CLI

Enable Superpowers skills in your Gemini CLI environment using the extensions system.

## Quick Install (For Agents)

If you're an AI agent being asked to install superpowers, run this command:

```bash
run_shell_command ~/.gemini/superpowers/.gemini/superpowers-gemini install
```

Or if the repository path is known:

```bash
run_shell_command <repo-path>/.gemini/superpowers-gemini install
```

Then follow the instructions it provides.

## Manual Installation

### 1. Clone the repository

```bash
git clone https://github.com/obra/superpowers.git ~/superpowers
cd ~/superpowers
```

### 2. Install the extension

Choose one option:

**Option A - Link for development** (changes immediately reflected):
```bash
gemini extensions link ~/superpowers
```

**Option B - Install as regular extension**:
```bash
gemini extensions install ~/superpowers
```

### 3. Verify installation

```bash
gemini extensions list
```

You should see `superpowers` in the list with all skills shown.

### 4. (Optional) Create personal skills directory

For your own custom skills:

```bash
mkdir -p ~/.gemini/skills
```

## Testing

Start a Gemini session and ask:
```
List all available superpowers skills
```

The agent should recognize and use the skills system.

## Troubleshooting

### Function calling error

If you see:
```
Please ensure that the number of function response parts is equal to the number of function call parts
```

This happens when hooks have wrong variable names:

1. Edit `~/.gemini/skills/superpowers/hooks/hooks.json`
2. Replace `${CLAUDE_PLUGIN_ROOT}` with `${extensionPath}`
3. Restart Gemini

### Extension not loading

Verify the extension:
```bash
gemini extensions validate ~/superpowers
```

### Skills not appearing

Check extension status:
```bash
gemini extensions list
```

Look for "Enabled (User): true" and "Enabled (Workspace): true"

## Updating

```bash
cd ~/superpowers
git pull
gemini extensions update superpowers
```

## Need Help?

https://github.com/obra/superpowers/issues
