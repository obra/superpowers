---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Directory Structure

Create the following folder structure:

```text
.spectral/
  templates/
  memory/
```

## Steps

1. **Create Folders (Step-by-Step)**:
   - On Windows, do **NOT** use `pwsh`. Use `cmd.exe /C` with **individual** `mkdir` commands.
   - Run these exact commands one-by-one:
     1. `cmd.exe /C "mkdir .spectral\templates"`
     2. `cmd.exe /C "mkdir .spectral\memory"`
   - Use backslashes (`\`) for all paths.

2. **Install Templates**:
   - Locate source templates in `skills/init/templates/` (relative to this skill).
   - Write/Copy `spec-template.md`, `plan-template.md`, `tasks-template.md`, and `constitution-template.md` to the project's `.spectral\templates\` folder.

3. **Initialize Memory**:
   - Write a copy of `constitution-template.md` to `.spectral\memory\constitution.md`.

4. **Confirm**:
   - Verify all files and folders exist and report success.