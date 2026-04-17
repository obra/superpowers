---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Steps

1. **Run the Initialization Script**:
   - Locate the `skills/init/scripts/init.js` file in the Spectral repository.
   - Run it using Node.js: `node skills/init/scripts/init.js`
   - This script will automatically create the `.spectral` folders and copy the templates for you, bypassing any shell compatibility issues.

2. **Manual Fallback (only if Node.js is missing)**:
   - If `node` is not available, you must manually create `.spectral/templates` and `.spectral/memory` and copy the files from `skills/init/templates/`.

3. **Confirm**:
   - Verify that the `.spectral` structure is complete and report success.