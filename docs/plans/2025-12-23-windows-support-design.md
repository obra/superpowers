# Windows Support for Superpowers - Design Document

**Date:** 2025-12-23
**Scope:** Codex and OpenCode installation on Windows
**Target Platform:** Windows 10+ with PowerShell

## Overview

This design adds Windows support to Superpowers through agent-driven OS detection. The AI agent (Codex/OpenCode) detects the user's operating system and presents only the relevant commands.

## Design Decisions

### 1. Scope
- **In Scope:** Codex and OpenCode installation on Windows
- **Out of Scope:** Claude Code (already cross-platform via plugin marketplace)

### 2. OS Detection Approach
**Agent-driven detection** - The AI agent detects the user's OS from the environment and shows only relevant commands. No detection scripts required.

### 3. Windows Shell Environment
**PowerShell only** - Modern Windows standard, pre-installed on Windows 10+, supports most Unix-like operations.

### 4. Documentation Strategy
**Structured markdown with agent instructions** - Installation docs contain OS-specific sections. Agents interpret and filter based on the user's platform.

## Technical Design

### Path Mappings

| Unix Path | Windows PowerShell Equivalent |
|-----------|-------------------------------|
| `~/.codex/` | `$env:USERPROFILE\.codex\` |
| `~/.config/opencode/` | `$env:USERPROFILE\.config\opencode\` |
| `/` path separator | `\` path separator |

### Command Translations

| Unix (bash) | Windows (PowerShell) |
|-------------|---------------------|
| `mkdir -p path/to/dir` | `New-Item -ItemType Directory -Force -Path path\to\dir` |
| `ln -sf source target` | `New-Item -ItemType SymbolicLink -Path target -Target source` |
| `git clone url .` | `git clone url .` (same) |
| `cd ~/.codex` | `cd $env:USERPROFILE\.codex` |

### Important Considerations

1. **Symbolic Links on Windows**: Creating symlinks requires admin privileges or Windows 10+ Developer Mode. OpenCode installation will note this requirement.

2. **Git Compatibility**: Git commands work identically on Windows.

3. **Path Separators**: PowerShell accepts both `/` and `\`. We use `\` for Windows commands.

## Documentation Structure

Each INSTALL.md file will have three parts:

### 1. Agent Instruction Preamble
```markdown
<!-- AGENT INSTRUCTIONS:
When a user asks to install Superpowers, detect their operating system and show ONLY the commands for their platform:
- Windows: Show PowerShell commands with Windows paths ($env:USERPROFILE)
- macOS/Linux: Show bash commands with Unix paths (~/)
Do not show both sets of commands - translate and present only what's relevant for their OS.
-->
```

### 2. Platform-Agnostic Overview
- Prerequisites
- What the installation does
- General structure

### 3. OS-Specific Command Blocks
- Clearly marked sections for each OS
- Complete installation steps for that platform
- Platform-specific notes

### Example Structure
```markdown
# Installing Superpowers for Codex

## Prerequisites
- Git installed
- [Platform-agnostic requirements]

## Installation

### For Unix (macOS/Linux):
[bash commands with ~/.codex/ paths]

### For Windows:
[PowerShell commands with $env:USERPROFILE\.codex\ paths]
```

## Files to Modify

1. **`.codex/INSTALL.md`**
   - Add agent instruction preamble
   - Add Windows-specific installation section with PowerShell commands
   - Keep existing Unix section

2. **`.opencode/INSTALL.md`**
   - Add agent instruction preamble
   - Add Windows-specific installation section with PowerShell commands
   - Add note about Developer Mode requirement for symlinks
   - Keep existing Unix section

3. **`README.md`**
   - Add "Supported Platforms" section listing Windows 10+, macOS, Linux
   - Update Codex and OpenCode installation sections to mention cross-platform support
   - Keep Claude Code section as-is (already cross-platform)

## Testing Strategy

Agent-driven detection requires:

1. **Manual Testing**: Users on each platform (Windows, macOS, Linux) follow installation instructions through Codex/OpenCode
2. **Documentation Review**: Verify all commands are syntactically correct
3. **Path Validation**: Verify translated paths work on Windows (especially `$env:USERPROFILE`)
4. **Symlink Note**: Verify OpenCode users know the Developer Mode requirement

## Implementation Checklist

- [ ] Update `.codex/INSTALL.md` with agent instructions and Windows commands
- [ ] Update `.opencode/INSTALL.md` with agent instructions, Windows commands, and symlink note
- [ ] Update `README.md` with platform support information
- [ ] Test installation on Windows with PowerShell
- [ ] Test installation on macOS/Linux to ensure no regression
- [ ] Update any other documentation that references installation paths

## Benefits

1. **Seamless User Experience**: Users see only what's relevant to their platform
2. **No Maintenance Overhead**: No detection scripts to maintain
3. **Leverages AI Capabilities**: Uses the agent's natural ability to understand context
4. **Simple Implementation**: Structured documentation with clear instructions
5. **Future-Proof**: Easy to add support for additional platforms if needed
