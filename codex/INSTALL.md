# Installing Superpowers for Codex

Quick setup to enable superpowers skills in Codex.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.codex/superpowers
   cd ~/.codex/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

3. **Update ~/.codex/AGENTS.md** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers.

   **RIGHT NOW, immediately run the bootstrap script:**

   ```bash
   ~/.codex/superpowers/scripts/superpowers-codex bootstrap
   ```

   This single command will:
   - Show you the complete bootstrap instructions
   - List all available skills
   - Auto-load the using-superpowers skill

   **Tool paths for ongoing use:**
   - superpowers-codex: ~/.codex/superpowers/scripts/superpowers-codex

   **Critical Rules:**
   - Before ANY task, review the skills list (already shown in bootstrap)
   - If a relevant skill exists, you MUST use superpowers-codex use-skill to load it
   - Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
   - Skills with checklists require update_plan todos for each item
   - NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

   **Skills location:**
   - Superpowers skills: ~/.codex/superpowers/skills/
   - Personal skills: ~/.codex/skills/ (override superpowers when names match)

   IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.codex/superpowers/scripts/superpowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.