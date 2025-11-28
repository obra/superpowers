# Installing Superpowers for Droid CLI

Quick setup to enable superpowers skills in Factory Droid CLI.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.factory/superpowers
   cd ~/.factory/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory** (if not exists):
   ```bash
   mkdir -p ~/.factory/skills
   ```

3. **Update ~/.factory/AGENTS.md** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities.

   **To load a skill, run:**
   ```bash
   ~/.factory/superpowers/.droid/superpowers-droid use-skill superpowers:<skill-name>
   ```

   **To see all available skills:**
   ```bash
   ~/.factory/superpowers/.droid/superpowers-droid find-skills
   ```

   **Critical Rules:**
   - Before ANY coding task, check if a relevant skill exists
   - If a skill applies to your task, you MUST load and follow it
   - Announce: "I'm using the [Skill Name] skill to [purpose]"
   - Skills with checklists require TodoWrite todos for each item

   **Key Skills:**
   - `superpowers:brainstorming` - Before writing code, refine ideas into designs
   - `superpowers:test-driven-development` - RED-GREEN-REFACTOR cycle
   - `superpowers:systematic-debugging` - 4-phase debugging framework
   - `superpowers:writing-plans` - Create detailed implementation plans

   IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.factory/superpowers/.droid/superpowers-droid bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.

## Optional: Create Symlink for Easy Access

```bash
ln -sf ~/.factory/superpowers/.droid/superpowers-droid ~/.factory/bin/superpowers-droid
```

Then you can use:
```bash
~/.factory/bin/superpowers-droid find-skills
```
