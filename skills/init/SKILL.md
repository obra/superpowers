---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates, memory, and code index)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Index-First Retrieval Requirement

After init, `.spectral/code_index.json` is the default source of truth for code discovery.

- Mandatory pre-step before any coding reasoning: load `.spectral/code_index.json`.
- Select top 3-5 relevant files using `featureTags`, `summary`, and `kind`.
- Explicitly state which files were selected and why, then continue with implementation.
- Do not run full-repository search as a default path.
- If a required file is missing from the index, state `Index is insufficient` and run minimal targeted folder search as fallback.

## Hard Rule

- The agent must not blindly scan the whole repository before consulting `.spectral/code_index.json`.
- The agent must not open random files before selecting relevant candidates from the index.

## Incremental Indexing Requirement

- Init must run code index generation in `incremental` mode.
- Incremental mode must reprocess only files with changed metadata (`mtime`/size) and remove deleted paths from the index.
- Unchanged files must be reused directly from the previous `.spectral/code_index.json` entry.

## Multi-Language Support Requirement

- Use Tree-sitter when a language grammar is available.
- For unsupported languages, fall back to a lightweight structural parser (imports, declarations) instead of failing.
- Unknown text-like files should still be indexed with minimal metadata so discovery remains language-agnostic.

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
    - Keep it in memory as `<compact rules summary>` for script input.

3. **Execute Initialization Script Immediately**:
    - Do NOT create any files manually before running the script.
    - Do NOT use shell commands for directory or file creation.
    - Directly run:
       - `node "~/.copilot/installed-plugins/spectral-marketplace/spectral/scripts/init.js"`
    - Pass user rules via environment variable:
       - `SPECTRAL_INIT_RULES="<compact rules summary>"`

4. **If Script Fails -> Fallback**:
    - Only if the Node script execution fails, create files manually using file tools (NOT shell).

5. **No-Shell Fallback (File Tools Only)**:
    - Create these paths with file tools (NOT shell):
       - .spectral/memory/constitution.md
       - .spectral/templates/spec-template.md
       - .spectral/templates/plan-template.md
       - .spectral/templates/tasks-template.md
       - .spectral/templates/constitution-template.md
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
   - Confirm that `.spectral/code_index.json` exists and was generated as metadata-only output.
   - Confirm that `.spectral/code_index.json` is pretty-printed (multi-line JSON with 2-space indentation).

7. **User Confirmation Loop**:
   - Show a concise summary of what was written.
   - Ask: `I drafted your constitution in .spectral/memory/constitution.md. What would you like to change?`
   - If user provides edits, update the constitution immediately.