# Installing Hyperpowers for Codex

Quick setup to enable hyperpowers skills in Codex.

## Installation

1. **Clone hyperpowers repository**:
   ```bash
   mkdir -p ~/.codex/hyperpowers
   cd ~/.codex/hyperpowers
   git clone https://github.com/bradwindy/hyperpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

3. **Update ~/.codex/AGENTS.md** to include this hyperpowers section:
   ```markdown
   ## Hyperpowers System

   <EXTREMELY_IMPORTANT>
   You have hyperpowers. Hyperpowers teach you new skills and capabilities. RIGHT NOW run: `~/.codex/hyperpowers/.codex/hyperpowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.codex/hyperpowers/.codex/hyperpowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.