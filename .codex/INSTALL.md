# Installing Horspowers for Codex

> **Forked from [obra/superpowers](https://github.com/obra/superpowers)** - Horspowers is a Chinese-enhanced version with additional workflows and localization support.

Quick setup to enable horspowers skills in Codex.

## Installation

1. **Clone horspowers repository**:
   ```bash
   mkdir -p ~/.codex/horspowers
   cd ~/.codex/horspowers
   git clone https://github.com/LouisHors/horspowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

3. **Update ~/.codex/AGENTS.md** to include this horspowers section:
   ```markdown
   ## Horspowers System

   <EXTREMELY_IMPORTANT>
   You have horspowers. Horspowers teaches you new skills and capabilities. RIGHT NOW run: `~/.codex/horspowers/.codex/horspowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.codex/horspowers/.codex/horspowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.

## Upstream Project

This is a fork of the original [obra/superpowers](https://github.com/obra/superpowers) project. Please report issues specific to this fork at: https://github.com/LouisHors/horspowers/issues
