# Superpowers Wrapper for OpenClaw

This wrapper enables OpenClaw to discover and load skills from the [Superpowers](https://github.com/obra/superpowers) framework.
By symlinking skills into OpenClaw's local skills directory, you keep installation simple and updates easy.

## Section 1 — Prerequisites

- **OpenClaw** is installed and configured.
- A workspace with an `AGENTS.md` exists (or you know where to create it).
- `git` is available in your shell.

## Section 2 — Automated Setup (Recommended)

Run the included setup script:

```bash
./setup.sh
```

By default, it uses:

- Repo: `https://github.com/obra/superpowers.git`
- Ref: `main`
- Clone dir: `~/.superpowers`
- Skills dir: `~/.openclaw/skills`
- Workspace AGENTS path: `~/.openclaw/workspace/AGENTS.md`

### Optional overrides

You can override defaults with environment variables:

```bash
SUPERPOWERS_REPO_URL="https://github.com/caasols/superpowers.git" \
SUPERPOWERS_REPO_REF="feat/openclaw-wrapper" \
OPENCLAW_WORKSPACE_AGENTS="$HOME/.openclaw/workspace/AGENTS.md" \
./setup.sh
```

Useful variables:

- `SUPERPOWERS_REPO_URL`
- `SUPERPOWERS_REPO_REF`
- `SUPERPOWERS_DIR`
- `OPENCLAW_SKILLS_DIR`
- `OPENCLAW_WORKSPACE_AGENTS`

## Section 3 — Manual Setup

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

## Section 4 — Verify Installation

If `openclaw` is available in `PATH`:

```bash
openclaw skills info using-superpowers
```

You should see the skill resolved from local storage.

## Section 5 — Keeping Skills Updated

Recommended: re-run `./setup.sh`, which updates the configured repo/ref and handles `SUPERPOWERS_REPO_REF` correctly.

If updating manually, pull an explicit ref:

```bash
cd ~/.superpowers && git pull origin <branch-or-ref>
```

No reinstall required.
