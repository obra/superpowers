# Installing Superpowers for opencode

Quick setup to enable superpowers skills in opencode.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.opencode/superpowers
   cd ~/.opencode/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.opencode/skills
   ```

3. **Update ~/.opencode/AGENTS.md** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `~/.opencode/superpowers/.opencode/superpowers-opencode bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.opencode/superpowers/.opencode/superpowers-opencode bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.