---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Copilot CLI Requirement

In Copilot CLI, after /spectral:init is activated, the agent must produce a fully drafted constitution via script output. It must not leave .spectral/memory/constitution.md as template placeholders.

If shell execution is unavailable (for example: `pwsh.exe` missing on Windows), the agent must switch to the no-shell path immediately and must not retry shell commands repeatedly.

## Steps

1. **Send an Immediate User Prompt**:
   - First response after activation must be a clear status message so the user knows init is running.
   - Use this exact message:
     - `Spectral init started. I am creating your .spectral workspace and preparing your project constitution. Please enter your project rules (bullet points are fine).`

2. **Build a Compact Rules Summary**:
   - Convert the user request into 3-8 short bullets.
   - Keep this summary concise to reduce token usage.
   - Save it to .spectral/memory/rules-input.md.

3. **Preflight Shell Capability**:
   - Try one minimal shell check before running script-driven init.
   - If shell reports `pwsh.exe` missing (or shell unavailable), skip directly to Step 4.

4. **Run the Initialization Script (Preferred Path)**:
   - Locate the `scripts/init.js` file in the Spectral repository.
   - Run it using Node.js: `node scripts/init.js`
   - The script reads rules from .spectral/memory/rules-input.md automatically.
   - This script will automatically create the `.spectral` folders and copy the templates for you, bypassing any shell compatibility issues.

5. **No-Shell Fallback (Required when shell is unavailable)**:
   - Create these paths with file tools (not shell):
     - .spectral/memory/rules-input.md
     - .spectral/memory/constitution.md
   - Infer project signals with file listing/search tools (for example: package.json, angular.json, src/, apps/, libs/).
   - Write a compact but concrete constitution directly to .spectral/memory/constitution.md using:
     - Project name from current directory
     - 5 concrete principles
     - User rules section
     - Workflow section
     - Governance section with current date
   - Never leave placeholders in .spectral/memory/constitution.md.
   - Keep output concise; avoid verbose narrative to reduce tokens.

6. **Confirm**:
   - Verify that the `.spectral` structure is complete and report success.
   - Confirm that `.spectral/memory/constitution.md` contains concrete sections with no unresolved placeholder tokens.

7. **User Confirmation Loop**:
   - Show a concise summary of what was written.
   - Ask: `I drafted your constitution in .spectral/memory/constitution.md. What would you like to change?`
   - If user provides edits, update the constitution immediately.