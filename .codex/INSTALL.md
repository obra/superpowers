<!-- AGENT INSTRUCTIONS:
When a user asks to install Superpowers, detect their operating system and show ONLY the commands for their platform:
- Windows: Show PowerShell commands with Windows paths ($env:USERPROFILE)
- macOS/Linux: Show bash commands with Unix paths (~/)
Do not show both sets of commands - translate and present only what's relevant for their OS.
-->

# Installing Superpowers for Codex

Quick setup to enable superpowers skills in Codex.

## Installation

### For Unix (macOS/Linux)

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
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `~/.codex/superpowers/.codex/superpowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

### For Windows

1. **Clone superpowers repository**:
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\superpowers"
   Set-Location "$env:USERPROFILE\.codex\superpowers"
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create personal skills directory**:
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\skills"
   ```

3. **Update `$env:USERPROFILE\.codex\AGENTS.md`** to include this superpowers section:
   ```markdown
   ## Superpowers System

   <EXTREMELY_IMPORTANT>
   You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `$env:USERPROFILE\.codex\superpowers\.codex\superpowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

### For Unix (macOS/Linux)

Test the installation:
```bash
~/.codex/superpowers/.codex/superpowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.

### For Windows

Test the installation:
```powershell
& "$env:USERPROFILE\.codex\superpowers\.codex\superpowers-codex" bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.
