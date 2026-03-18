# Installing Superpowers for Trae IDE

## Prerequisites

- [Trae IDE](https://www.trae.ai/) installed
- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.trae/superpowers
   ```

2. **Install skills as Trae rules:**
   ```bash
   ~/.trae/superpowers/.trae/install.sh
   ```

   This creates a `superpowers-bootstrap.md` rule in your project's `.trae/rules/` that loads the superpowers system on every conversation.

3. **Restart Trae** and start a new conversation to activate superpowers.

## How It Works

Trae uses rules (`.trae/rules/*.md`) to inject context into conversations. The install script creates a single bootstrap rule that:

1. Loads the `using-superpowers` skill content
2. Registers all available skills
3. Activates automatically via `alwaysApply: true`

Skills are read from the cloned repository at `~/.trae/superpowers/skills/`. No files are copied — the bootstrap rule references skills by path, so `git pull` updates everything.

## Verify

After installation, start a new conversation and ask:

```
Tell me about your superpowers
```

The agent should respond with information about its available skills.

## Updating

```bash
cd ~/.trae/superpowers && git pull
```

Skills update instantly since the bootstrap rule reads from the cloned directory.

## Uninstalling

Remove the bootstrap rule from your project:

```bash
rm .trae/rules/superpowers-bootstrap.md
```

Optionally delete the clone:

```bash
rm -rf ~/.trae/superpowers
```

## Troubleshooting

### Skills not activating

1. Check that the bootstrap rule exists: `cat .trae/rules/superpowers-bootstrap.md`
2. Verify the clone exists: `ls ~/.trae/superpowers/skills/`
3. Make sure you started a **new** conversation after installing

### Trae doesn't pick up the rule

Trae discovers rules in `.trae/rules/` at conversation start. If the directory doesn't exist, the install script creates it. Restart Trae if rules aren't being picked up.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
