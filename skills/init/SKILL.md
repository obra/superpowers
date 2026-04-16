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

> **NOTE**: Do NOT create a `.agent` folder at this time.

## Steps

1. **Install Templates**:
   - Locate the source templates in `skills/init/templates/` (relative to this skill).
   - Use your **file writing tool** to create each file in the project's `.spectral/templates/` folder. 
   - **Crucial**: Do not use a shell/terminal to `mkdir` if it triggers a `pwsh` error. Simply write the files directly; your tools should create the parent directories automatically.
   - Files: `spec-template.md`, `plan-template.md`, `tasks-template.md`, `constitution-template.md`.

2. **Initialize Memory**:
   - Write a copy of `constitution-template.md` to `.spectral/memory/constitution.md`.

3. **Confirm & Report**:
   - Verify that the `.spectral` structure is complete and report success.