# Superpowers for Factory Droid

Complete guide for using Superpowers with [Factory Droid](https://factory.ai).

## Quick Install (Plugin Marketplace)

In Droid, register the marketplace first:

```bash
/plugin marketplace add obra/superpowers
```

Then install the plugin from this marketplace:

```bash
/plugin install superpowers@superpowers
```

### Verify Installation

Check that commands appear:

```bash
/help
```

```
# Should see:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

## Alternative: Agent-Guided Install

Tell Droid:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.factory/INSTALL.md
```

## Manual Installation (Development)

For local development or modification of Superpowers:

### Prerequisites

- [Factory Droid](https://factory.ai) installed
- Git installed

### Clone and Load

```bash
# Clone Superpowers
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers

# Load as local plugin
droid --plugin-dir ~/.factory/superpowers
```

### Verify

After starting Droid with the plugin, check commands are available:

```bash
/help
```

You should see the `/superpowers:*` commands listed.

## Usage

### How It Works

Once installed, Superpowers provides:

**Skills** (auto-invoked based on task context):
- **brainstorming** activates when you describe a feature to build
- **writing-plans** activates when you have an approved design
- **test-driven-development** activates during implementation
- **systematic-debugging** activates when troubleshooting

**Commands** (user-invoked):
- `/superpowers:brainstorm` - Start interactive design session
- `/superpowers:write-plan` - Create implementation plan
- `/superpowers:execute-plan` - Execute plan with checkpoints

**Agents**:
- Specialized subagents for code review and task execution

You don't need to explicitly invoke skills - Droid uses them automatically based on your task.

## Updating

Update via the plugin system:

```bash
/plugin update superpowers
```

Or if using manual installation:

```bash
cd ~/.factory/superpowers
git pull
```

Then restart Droid.

## Troubleshooting

### Commands not appearing

1. Verify plugin is installed: `/plugin` and check the Installed tab
2. Restart Droid after installation
3. Check for errors: `/plugin` and check the Errors tab

### Skills not activating

1. Skills activate based on task context - describe your task clearly
2. Use `/superpowers:brainstorm` to explicitly start a workflow

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Factory docs: https://docs.factory.ai
