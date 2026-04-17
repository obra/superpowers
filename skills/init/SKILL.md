---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Steps

1. **Send an Immediate User Prompt**:
   - First response after activation must be a clear status message so the user knows init is running.
   - Use this exact message:
     - `Spectral init started. I am creating your .spectral workspace and preparing your project constitution. Please enter your project rules (bullet points are fine).`

2. **Run the Initialization Script**:
   - Locate the `scripts/init.js` file in the Spectral repository.
   - Run it using Node.js: `node scripts/init.js`
   - This script will automatically create the `.spectral` folders and copy the templates for you, bypassing any shell compatibility issues.

3. **Manual Fallback (only if Node.js is missing)**:
   - If `node` is not available, you must manually create `.spectral/templates` and `.spectral/memory` and copy the files from `skills/init/templates/`.

4. **Confirm**:
   - Verify that the `.spectral` structure is complete and report success.

5. **Collect Constitution Input**:
   - After initialization, if the user has provided rules, acknowledge them and say they will be used to build the constitution in `.spectral/memory/constitution.md`.
   - If the user has not provided rules yet, ask once more: `Please share your project rules so I can draft your constitution.`