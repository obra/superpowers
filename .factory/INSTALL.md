# Superpowers Installation for Factory Droid

Follow these steps to install Superpowers for Factory Droid using the plugin system.

## Quick Install (Plugin Marketplace)

In Droid, register the marketplace first:

```bash
/plugin marketplace add obra/superpowers
```

Then install the plugin:

```bash
/plugin install superpowers@superpowers
```

## Manual Installation (Development)

If you want to develop or modify Superpowers locally:

1. Clone Superpowers:

```bash
git clone https://github.com/obra/superpowers.git ~/.factory/superpowers
```

2. Load as a local plugin:

```bash
droid --plugin-dir ~/.factory/superpowers
```

## Verification

After installation, check that commands appear:

```bash
/help
```

You should see:
- `/superpowers:brainstorm` - Interactive design refinement
- `/superpowers:write-plan` - Create implementation plan
- `/superpowers:execute-plan` - Execute plan in batches

## What Gets Installed

The plugin provides:

**Skills** (auto-invoked based on task):
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **test-driven-development** - RED-GREEN-REFACTOR cycle
- **systematic-debugging** - 4-phase root cause process
- **subagent-driven-development** - Fast iteration with two-stage review
- And more...

**Commands** (user-invoked):
- `/superpowers:brainstorm` - Start interactive design session
- `/superpowers:write-plan` - Create implementation plan
- `/superpowers:execute-plan` - Execute plan with checkpoints

**Agents**:
- Specialized subagents for code review and task execution

## Updating

Update via the plugin system:

```bash
/plugin update superpowers
```

Or if installed manually:

```bash
cd ~/.factory/superpowers
git pull
```

Then restart Droid.

## More Information

- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.droid.md
- Factory Droid: https://factory.ai
