---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates and memory)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Copilot CLI Requirement

In Copilot CLI, after `/spectral:init` is activated, the agent must draft the constitution automatically. It must not leave `.spectral/memory/constitution.md` as raw template placeholders.

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

5. **Analyze Context for Constitution Drafting**:
   - Extract rules and constraints from the user's prompt and any rules they provide after init starts.
   - Inspect the current project structure (top-level folders/files and key signals like language/framework/testing setup).
   - Infer practical defaults when user rules are incomplete.

6. **Auto-Draft Constitution (Required)**:
   - Write a fully drafted constitution to `.spectral/memory/constitution.md`.
   - Replace placeholders with concrete content based on user intent + project structure.
   - Never leave unresolved placeholders like `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`, or `[SECTION_2_CONTENT]` in the final file.
   - Include at minimum:
     - Project name
     - 5 concrete core principles
     - Additional constraints section
     - Development workflow section
     - Governance rules
     - Version and current date fields

7. **User Confirmation Loop**:
   - Show a concise summary of what was written.
   - Ask: `I drafted your constitution in .spectral/memory/constitution.md. What would you like to change?`
   - If user provides edits, update the constitution immediately.