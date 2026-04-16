---
name: init
description: "Use when initializing a new Spectral workspace. Creates .spectral (templates, memory) and .agent folders."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Directory Structure

Create the following directory structure relative to the current working directory:

```text
.spectral/
  templates/
  memory/
.agent/
```

## Steps

1. **Create Infrastructure**:
   - Use your **native filesystem tools** (like `write_to_file` or `mkdir`) to create the folders.
   - **Do NOT rely on `pwsh`** as it may not be installed. If you must use a shell on Windows, use `powershell.exe -Command` or `cmd /C`.

2. **Install Templates**:
   - Locate the source templates in `skills/init/templates/` relative to this skill file.
   - Read each file and write it to the project's `.spectral/templates/` directory.
   - Files: `spec-template.md`, `plan-template.md`, `tasks-template.md`, `constitution-template.md`.

3. **Initialize Memory**:
   - Write a copy of `constitution-template.md` to `.spectral/memory/constitution.md`.

4. **Confirm & Report**:
   - Verify all files exist in the project and report success to the user.