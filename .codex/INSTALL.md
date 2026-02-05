# Installing Superpowers for Codex

Quick setup to enable superpowers skills in Codex.

## Installation

1. **Run installer**
   This will clone/update the central repo at `~/.superpowers` and link it into Codex at `~/.codex/superpowers`.

   If this is your first install (and `~/.superpowers` does not exist yet), run from a temporary clone:
   ```bash
   git clone https://github.com/obra/superpowers.git /tmp/superpowers
   node /tmp/superpowers/.codex/superpowers-codex install
   ```

   If you already have `~/.superpowers` installed, you can run:
   ```bash
   node ~/.superpowers/.codex/superpowers-codex upgrade
   ```

2. **Update ~/.codex/AGENTS.md** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `node $HOME/.codex/superpowers/.codex/superpowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
node $HOME/.codex/superpowers/.codex/superpowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.