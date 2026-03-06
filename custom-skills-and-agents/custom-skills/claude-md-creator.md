---
name: claude-md-creator
description: >
  Use this skill whenever creating, writing, or improving a CLAUDE.md, AGENTS.md, or any
  repository-level context file for coding agents. Triggers on any request involving
  "create CLAUDE.md", "write AGENTS.md", "context file for my repo", "help me set up
  Claude Code for this project", "initialize agent context", or any similar phrasing.
  This skill encodes research-backed best practices from empirical evaluation of context
  files across real-world repositories — following these guidelines measurably improves
  agent task success rates.
---

# AGENTS.md / CLAUDE.md Best Practices

This skill guides the creation of repository-level context files (CLAUDE.md, AGENTS.md, etc.)
based on empirical research findings from Gloaguen et al. (2025), "Evaluating AGENTS.md:
Are Repository-Level Context Files Helpful for Coding Agents?"

---

## Core Research Finding (Read This First)

The paper's central result is counterintuitive: **more content ≠ better performance**.

- LLM-generated context files (verbose, auto-generated) **reduce** agent success rates by ~3%
  and **increase inference cost by 20%+**
- Human-written context files with minimal, targeted content **improve** success by ~4%
- The root cause: unnecessary requirements create extra cognitive overhead that derails agents

**Practical takeaway:** A CLAUDE.md that says "Run tests with `pytest -x tests/`" is worth
more than five paragraphs of project overview.

---

## The Minimal Requirements Principle

The single most important rule: **only include what the agent cannot easily discover itself**.

### INCLUDE (high signal, low discoverability):
- Exact commands for build, test, lint, typecheck (especially non-obvious flags or ordering)
- Non-standard test runners or frameworks (e.g., "We use `tox` not `pytest` directly")
- Environment setup steps the agent would struggle to infer (e.g., required env vars, secrets)
- Critical constraints that override defaults (e.g., "Never modify files in `generated/`")
- Project-specific conventions that differ from language defaults
- Which test subset to run for fast iteration vs. full suite

### DO NOT INCLUDE (low signal, high discoverability or redundancy):
- Repository overview / purpose (agent can read README.md)
- File structure descriptions (agent can run `ls` or `find`)
- General style guides already enforced by linters (agent respects linter output)
- Technology stack descriptions (agent can read package.json, pyproject.toml, etc.)
- Generic best practices ("write clean code", "add tests for new features")
- Content that duplicates existing documentation in the repo
- Broad architectural overviews (agents explore and discover these effectively)

---

## Required Sections (Keep Each Concise)

### 1. Essential Commands (Always Include)
Provide the exact commands the agent needs. No prose, just commands with brief labels.

```markdown
## Commands
- **Install:** `pip install -e ".[dev]"`
- **Test:** `pytest -x --tb=short tests/`
- **Lint:** `ruff check . && mypy src/`
- **Build:** `make build`
```

### 2. Critical Constraints (Only If They Exist)
Non-obvious rules that override what the agent would do by default.

```markdown
## Constraints
- Do not modify files under `src/generated/` — these are auto-generated
- Tests must pass without network access (mock all external calls)
- Keep public API backward compatible (no breaking changes to `src/api/`)
```

### 3. Non-Standard Workflows (Only If They Differ From Defaults)
Only include if significantly different from what the agent would assume.

```markdown
## Workflow Notes
- Always run `make codegen` before tests if you modify `schema.graphql`
- Integration tests require a running local server: `docker-compose up -d` first
```

---

## Anti-Patterns to Avoid

Based on the paper's trace analysis, these patterns correlate with reduced agent performance:

| Anti-Pattern | Why It Hurts | Better Approach |
|---|---|---|
| Long project overview | Adds tokens, no decision value | Skip it entirely |
| "Always write unit tests" | Vague requirement, increases exploration without focus | Be specific: "Add tests in `tests/unit/` using pytest fixtures" |
| Copying README content | Redundant, wastes context | Link to README or omit |
| Style guide prose | Agent can read linter config | Just list the linter command |
| Broad architecture description | Agent discovers this via code exploration | Omit unless critical constraint |
| Exhaustive file-by-file descriptions | Overwhelms, rarely helps | Mention only the 1-2 non-obvious files |

---

## Template

Use this as your starting point. Fill in what you know, delete sections that don't apply:

```markdown
# [Project Name] — Agent Context

## Commands
- **Install:** ``
- **Test:** ``
- **Lint:** ``
- **Type check:** `` (if applicable)
- **Build:** `` (if applicable)

## Constraints

- 
- 

## Non-Standard Workflows

- 
```

If you have nothing meaningful to add to Constraints or Non-Standard Workflows, **delete those
sections entirely**. An empty section is worse than no section.

---

## Gathering Information From the User

Before writing the file, ask the user for:

1. **Language/ecosystem** — so you can identify the right default commands
2. **Test command** — exact command, including any important flags
3. **Lint/format/typecheck commands** — exact commands
4. **Any gotchas** — things that tripped them up or surprised them about this repo
5. **Any generated files or protected directories** — things the agent should not touch

Do **not** ask for: project description, architecture overview, tech stack breakdown.
These belong in README, not CLAUDE.md.

---

## Length Target

A well-crafted CLAUDE.md should be **under 50 lines** for most projects. If you're
approaching 100 lines, critically review each item: is it truly non-discoverable?
Does it directly affect task success? If not, cut it.

The paper's evidence shows that lean, targeted files outperform comprehensive ones.
When in doubt, leave it out.

---

## References
- Gloaguen et al. (2025). "Evaluating AGENTS.md: Are Repository-Level Context Files
  Helpful for Coding Agents?" https://arxiv.org/abs/2602.11988