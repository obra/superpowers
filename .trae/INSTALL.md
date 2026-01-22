# Installing Superpowers for Trae

Quick setup to enable superpowers skills in Trae.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.trae/superpowers
   cd ~/.trae/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.trae/skills
   ```

3. **Update ~/.trae/AGENTS.md** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `~/.trae/superpowers/.trae/superpowers-trae bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.trae/superpowers/.trae/superpowers-trae bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.
