# Clarification Explorer Prompt Template

Use this template when dispatching the clarification exploration subagent in Phase 0.

## Purpose

Quick 30-second exploration of project structure to inform clarification questions. This runs BEFORE asking the user any questions.

## Task for Subagent

```
You are exploring a codebase to help inform clarification questions.

## Your Task
Perform a quick (30-second max) exploration of the project structure.

## What to Find
1. **Project Type**: Check root config files (package.json, tsconfig.json, pyproject.toml, Cargo.toml, go.mod, etc.)
2. **Key Directories**: List main directories (src/, lib/, tests/, app/, etc.)
3. **Files Related to Request**: Search for files matching keywords from the user's request
4. **Technology Stack**: Note frameworks/libraries from config files

## Search Strategy
1. Glob for root config files: `*.json`, `*.toml`, `*.yaml` in root
2. List top-level directories
3. Grep for request-related keywords in file names and content

## Output Format (return this structured text)

PROJECT EXPLORATION RESULTS
===========================

Project Type: [e.g., "Node.js TypeScript project", "Python FastAPI", "Rust CLI"]

Key Directories:
- src/ - [brief description if discernible]
- tests/ - [test framework if detectable]
- [other directories]

Related Files (matching request keywords):
- [file path] - [relevance to request]
- [file path] - [relevance to request]

Technology Stack:
- [framework/library]: [version if found]
- [framework/library]: [version if found]

Notable Patterns:
- [anything useful for question design]
- [existing patterns that might inform implementation]

===========================
```

## Usage

Dispatch this subagent BEFORE asking clarifying questions. Use the returned findings to:
1. Make questions context-aware (reference actual project structure)
2. Detect potential ambiguities based on existing patterns
3. Inform the "proceed or ask" decision
