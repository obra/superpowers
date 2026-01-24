<!-- GENERATED: do not edit directly. Source: templates/.codex/INSTALL.md -->
# Installing Superpowers for {{AGENT_NAME}}

Quick setup to enable superpowers skills in {{AGENT_NAME}}.

## Installation

1. **Clone superpowers repository**:
   ```bash
   mkdir -p {{SUPERPOWERS_DIR}}
   cd {{SUPERPOWERS_DIR}}
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```bash
   mkdir -p {{SKILLS_DIR}}
   ```

3. **Update {{AGENT_HOME}}/{{AGENTS_MD}}** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `{{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
{{SUPERPOWERS_DIR}}/.codex/superpowers-{{AGENT_ID}} bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.
