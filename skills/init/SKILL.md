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

1. **Create Directories**:
   - Create `.spectral/templates`
   - Create `.spectral/memory`
   - Create `.agent`

2. **Install Templates**:
   - Copy all Markdown templates from the Spectral source `templates/` directory to `.spectral/templates/`.
   - Files to copy:
     - `spec-template.md`
     - `plan-template.md`
     - `tasks-template.md`
     - `constitution-template.md`

3. **Initialize Memory**:
   - Copy `.spectral/templates/constitution-template.md` to `.spectral/memory/constitution.md`.
   - This serves as the starting project constitution.

4. **Confirm**:
   - Verify that all folders and files were created and copied successfully.
   - Do not overwrite existing files if they already exist, unless the user explicitly asks for a reset.

5. **Report**:
   - Report the successful initialization to the user, highlighting the `.spectral` and `.agent` folders.