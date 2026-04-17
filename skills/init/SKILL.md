---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Copilot CLI Requirement

In Copilot CLI, after /spectral:init is activated, the agent must produce a fully drafted constitution via script output. It must not leave .spectral/memory/constitution.md as template placeholders.

## Steps

1. **Send an Immediate User Prompt**:
   - First response after activation must be a clear status message so the user knows init is running.
   - Use this exact message:
     - `Spectral init started. I am creating your .spectral workspace and preparing your project constitution. Please enter your project rules (bullet points are fine).`

2. **Build a Compact Rules Summary**:
   - Convert the user request into 3-8 short bullets.
   - Keep this summary concise to reduce token usage.
   - Save it to .spectral/memory/rules-input.md.

3. **Run the Initialization Script**:
   - Locate the `scripts/init.js` file in the Spectral repository.
   - Run it using Node.js: `node scripts/init.js`
   - The script reads rules from .spectral/memory/rules-input.md automatically.
   - This script will automatically create the `.spectral` folders and copy the templates for you, bypassing any shell compatibility issues.

4. **Manual Fallback (only if Node.js is missing)**:
   - If node is not available, create .spectral/templates and .spectral/memory manually.
   - Then generate constitution content directly from the user rules and folder structure.
   - Never leave placeholders in .spectral/memory/constitution.md.

5. **Confirm**:
   - Verify that the `.spectral` structure is complete and report success.
   - Confirm that `.spectral/memory/constitution.md` contains concrete sections with no unresolved placeholder tokens.

6. **User Confirmation Loop**:
   - Show a concise summary of what was written.
   - Ask: `I drafted your constitution in .spectral/memory/constitution.md. What would you like to change?`
   - If user provides edits, update the constitution immediately.