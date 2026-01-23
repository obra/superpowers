# Installing Superpowers for Continue

Quick setup to enable superpowers skills and prompts in Continue.

## What this adds

- **Skills**: installed under Continue's skills directory
- **Prompts (commands)**: installed under Continue's prompts directory (invokable via `/`)
- **No hooks**: Continue hooks are not supported in this adaptation, so you manually run the Bootstrap prompt when needed

## Directory mapping

- **Continue project directory**: `.continue/`
  - **Skills**: `.continue/skills/`
  - **Prompts**: `.continue/prompts/`
- **Continue personal/global directory**: `~/.continue/`
  - **Skills**: `~/.continue/skills/`
  - **Prompts**: `~/.continue/prompts/`

## Installation (recommended: personal/global)

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.continue/superpowers
   cd ~/.continue/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create Continue global directories**:
   ```bash
   mkdir -p ~/.continue/skills ~/.continue/prompts
   ```

3. **Install superpowers skills** (symlink, no copy):
   ```bash
   rm -rf ~/.continue/skills/superpowers
   ln -s ~/.continue/superpowers/skills ~/.continue/skills/superpowers
   ```

4. **Install Continue prompts** (symlink):
   ```bash
   for f in ~/.continue/superpowers/.continue/prompts/*.prompt; do
     ln -sf "$f" ~/.continue/prompts/$(basename "$f")
   done
   ```

## Project setup (optional)

If you want a project to explicitly use the global setup:

```bash
mkdir -p .continue

rm -rf .continue/skills .continue/prompts
ln -s ~/.continue/skills .continue/skills
ln -s ~/.continue/prompts .continue/prompts
```

## Usage

In Continue, type `/` and run:

- `Superpowers: Bootstrap` (manual “session start”)
- Then use:
  - `Superpowers: Brainstorm`
  - `Superpowers: Write Plan`
  - `Superpowers: Execute Plan`

## Verification

```bash
ls ~/.continue/prompts | grep '^superpowers-'
ls ~/.continue/skills/superpowers/brainstorming/SKILL.md
```

You should see the `superpowers-*.prompt` prompts and the superpowers skills directory populated.

## Updating

```bash
cd ~/.continue/superpowers
git pull
```
