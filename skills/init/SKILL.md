---
name: init
description: "Use when initializing a new Spectral workspace. Creates the .spectral directory (templates, memory, and code index)."
---

# Spectral Init

Use this skill when the user wants to initialize a new Spectral workspace in the current working directory.

## Index-First Retrieval Requirement

After init, `.spectral/code_index.json` is the default source of truth for code discovery.

- For file/function/code lookup, query `.spectral/code_index.json` first.
- Only if the requested file is not found in the index, manually inspect/search folders.
- Do not run full-repository search as the default path for every request.

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

1. **Run the Initialization Script**:
   - Locate the `scripts/init.js` file in the Spectral repository.
   - Run it using Node.js: `node scripts/init.js`
   - This script will automatically create the `.spectral` folders and copy the templates for you, bypassing any shell compatibility issues.

2. **Manual Fallback (only if Node.js is missing)**:
   - If `node` is not available, you must manually create `.spectral/templates` and `.spectral/memory` and copy the files from `skills/init/templates/`.

3. **Confirm**:
   - Verify that the `.spectral` structure is complete and report success.
   - Confirm that `.spectral/memory/constitution.md` contains concrete sections with no unresolved placeholder tokens.
   - Confirm that `.spectral/code_index.json` exists and was generated as metadata-only output.

7. **User Confirmation Loop**:
   - Show a concise summary of what was written.
   - Ask: `I drafted your constitution in .spectral/memory/constitution.md. What would you like to change?`
   - If user provides edits, update the constitution immediately.