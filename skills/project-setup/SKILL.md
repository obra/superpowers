---
name: project-setup
description: "Use when setting up a new project, initializing CLAUDE.md, or when a project has no CLAUDE.md and the user asks for help configuring it"
---

# Project Setup

Generate a tailored CLAUDE.md for the current project by scanning the codebase and asking targeted questions.

## Process

1. **Scan the project** — auto-detect stack from manifest files:
   - `package.json` → Node.js ecosystem (check for Next.js, React, Vue, Angular, Express, etc.)
   - `requirements.txt` / `pyproject.toml` / `setup.py` → Python (check for Django, Flask, FastAPI, etc.)
   - `Cargo.toml` → Rust
   - `go.mod` → Go
   - `Gemfile` → Ruby (check for Rails)
   - `composer.json` → PHP (check for Laravel)
   - `pom.xml` / `build.gradle` → Java/Kotlin (check for Spring Boot)
   - `Package.swift` → Swift
   - `mix.exs` → Elixir
   - `Makefile`, `Dockerfile` → note these for available commands
   - Check for test frameworks: jest, vitest, pytest, cargo test, go test, rspec, phpunit
   - Check for formatters/linters: biome, prettier, eslint, ruff, clippy, golangci-lint

2. **Present findings** — show what was detected and ask for confirmation:
   > "I detected [stack details]. Is this accurate? Anything I'm missing?"

3. **Ask targeted questions** — one at a time, only for things that can't be auto-detected:
   - "What testing approach do you follow? (e.g., unit + integration, TDD, specific frameworks)"
   - "Any key conventions I should know? (e.g., naming patterns, file organization rules, architectural boundaries)"
   - "What should the AI never do in this codebase? (e.g., never modify migrations directly, never use ORM raw queries)"

4. **Generate CLAUDE.md** — write to project root with these sections:

   ```
   # [Project Name]

   [One-line description]

   ## Tech Stack
   [Detected stack with versions]

   ## Critical Rules
   [From user's "never do" answers + sensible defaults like "no emojis in code"]

   ## File Structure
   [Auto-generated from actual directory tree, top 2-3 levels]

   ## Key Patterns
   [Code examples pulled from actual codebase — e.g., how API routes are structured,
   how components are organized, error handling patterns in use]

   ## Testing
   [Testing framework, conventions, how to run tests]

   ## Available Commands
   [Detected from package.json scripts, Makefile targets, etc.]
   ```

5. **Ask user to review** — "CLAUDE.md written. Please review and adjust as needed."

## Preferences Mode

When invoked as "project-setup preferences", "change my workflow preferences", or `change prefs`:

1. Read current `.claude/ultrapowers-preferences.json` if it exists.
2. Show current values in the prompt itself:

   > "Current workflow prefs: auto-commit {on|off}, auto-push {on|off}, commit design docs {on|off}, suggest `ultrapowers-dev` {on|off}, suggest `ultrapowers-business` {on|off}. Reply `ok` to keep, or tell me what to change (e.g., `no auto-push`, `stop suggesting dev`)."

3. Parse reply using the same rules documented in `skills/brainstorming/SKILL.md` Workflow Preferences section, extended with:

   | User reply | Resulting change |
   |---|---|
   | `stop suggesting dev` / `no dev suggestions` | `suggestSiblingPacks.dev: false` |
   | `stop suggesting business` / `no business suggestions` | `suggestSiblingPacks.business: false` |
   | `resume suggesting dev` / `suggest dev again` | `suggestSiblingPacks.dev: true` |
   | `resume suggesting business` / `suggest business again` | `suggestSiblingPacks.business: true` |
   | `reset sibling suggestions` | both `suggestSiblingPacks` flags to `true` |

4. Write updated values to `.claude/ultrapowers-preferences.json`. Preserve keys the user didn't change.
5. Suggest adding to `.gitignore` if not already ignored.

## Principles

- **Derive, don't template** — every section comes from the actual project, not boilerplate
- **One question at a time** — don't overwhelm
- **Keep it lean** — CLAUDE.md is always in context, so shorter is better
- **No framework advice** — ultrapowers-dev skills handle best practices
