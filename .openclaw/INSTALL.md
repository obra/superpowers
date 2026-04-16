# Superpowers for OpenClaw

This guide covers how to install and use Superpowers with OpenClaw.

## Prerequisites

- **OpenClaw** is installed and configured
- A workspace with an `AGENTS.md` exists (or you know where to create it)
- `git` is available in your shell

## Installation

### Automated Setup (Recommended)

Run the included setup script:

```bash
cd /path/to/superpowers/.openclaw
./setup.sh
```

By default, it uses:

- Repo: `https://github.com/obra/superpowers.git`
- Ref: `main`
- Clone dir: `~/.superpowers`
- Skills dir: `~/.openclaw/skills`
- Workspace AGENTS path: `~/.openclaw/workspace/AGENTS.md`

### Optional Overrides

You can override defaults with environment variables:

```bash
SUPERPOWERS_REPO_URL="https://github.com/your-fork/superpowers.git" \
SUPERPOWERS_REPO_REF="your-branch" \
OPENCLAW_WORKSPACE_AGENTS="$HOME/.openclaw/workspace/AGENTS.md" \
./setup.sh
```

### Manual Setup

```bash
# Clone superpowers to a stable location
git clone https://github.com/obra/superpowers.git ~/.superpowers

# Symlink skills into OpenClaw's local skills directory
mkdir -p ~/.openclaw/skills
for skill in ~/.superpowers/skills/*; do
  [ -d "$skill" ] || continue
  skill_name="$(basename "$skill")"
  target=~/.openclaw/skills/"$skill_name"
  [ -e "$target" ] || ln -s "$skill" "$target"
done
```

Then append `.openclaw/AGENTS-snippet.md` to your workspace `AGENTS.md`.

## Verification

If `openclaw` is available in `PATH`:

```bash
openclaw skills info using-superpowers
```

You should see the skill resolved from local storage.

## Updating Skills

Recommended: re-run `./setup.sh`, which updates the configured repo/ref.

If updating manually, pull an explicit ref:

```bash
cd ~/.superpowers && git pull origin <branch-or-ref>
```

No reinstall required.

## Subagent-Driven Development with OpenClaw

Superpowers supports subagent workflows on OpenClaw. Here's how:

### 1. Create an Active Task File

```markdown
# Active Task: [Project Name]

## Subagents
- agent-1: [Task description]
- agent-2: [Task description]

## Progress
- [ ] Task 1
- [ ] Task 2
```

### 2. Spawn Subagents

Use `sessions_spawn` with `mode="isolated"` for each task:

```json
{
  "task": "Implement feature X following plan.md",
  "mode": "isolated"
}
```

### 3. Coordinate Results

Use `sessions_send` to communicate with subagents and collect results.

## Key Differences from Claude Code

| Feature | Claude Code | OpenClaw |
|---------|------------|----------|
| Subagent dispatch | Built-in | `sessions_spawn` |
| Task tracking | TodoWrite | `ACTIVE-TASK.md` |
| Skill loading | Native | Native |
| Plan format | plan.md | `PLAN.md` |

## Troubleshooting

### Skills not loading

Check that skills are symlinked:
```bash
ls -la ~/.openclaw/skills/
```

### Subagent not responding

Ensure `sessions_spawn` is configured in your OpenClaw setup.

### AGENTS snippet not working

Verify the snippet was added to your AGENTS.md:
```bash
grep "superpowers-openclaw-wrapper" ~/.openclaw/workspace/AGENTS.md
```
