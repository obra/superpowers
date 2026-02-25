# Installing Superpowers for OpenClaw

Enable superpowers skills in OpenClaw via native skill discovery. Clone, symlink, restart.

## Prerequisites

- Git
- OpenClaw installed and configured (`~/.openclaw/` exists)

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.openclaw/superpowers
   ```

2. **Create skill symlinks:**
   ```bash
   for skill in ~/.openclaw/superpowers/skills/*/; do
     name=$(basename "$skill")
     [ ! -e ~/.openclaw/skills/"$name" ] && ln -s "$skill" ~/.openclaw/skills/"$name"
   done
   ```

   This links each skill individually into OpenClaw's managed skills directory. Existing skills with the same name are preserved.

3. **Restart the OpenClaw gateway** to discover the new skills:
   ```bash
   openclaw gateway restart
   ```

## Verify

```bash
openclaw skills list
```

You should see superpowers skills (brainstorming, test-driven-development, systematic-debugging, etc.) listed as `openclaw-managed`.

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

Skills update instantly through symlinks. New skills from upstream require re-running the symlink step.

## Uninstalling

```bash
for link in ~/.openclaw/skills/*; do
  [ -L "$link" ] && readlink "$link" | grep -q "superpowers" && rm "$link"
done
```

Optionally delete the clone: `rm -rf ~/.openclaw/superpowers`
