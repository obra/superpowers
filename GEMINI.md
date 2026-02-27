> **Note for Gemini CLI users:** This file is the manually maintained companion
> to the auto-generated extension on the `gemini-cli` branch.
> For the full compiled extension (TOML commands + complete skill library),
> install it directly:
> `gemini extensions install https://github.com/obra/superpowers --ref=gemini-cli`

# Superpowers for Gemini CLI

Superpowers is a structured software development workflow for AI coding agents.
It provides composable skills that guide your agent through brainstorming,
planning, implementation, testing, debugging, and code review — automatically.

## Core Principle

Skills trigger automatically based on context. You don't invoke them manually.
When you say "let's build X", the agent checks for relevant skills before
responding. When you ask for a bug fix, it reaches for the debugging skill first.

## Key Skills

### Before Any Implementation

**brainstorming** — Activates before writing code. Refuses to implement until
you've walked through intent, design alternatives, and approval. Saves a design
document. **This is a hard gate; the agent cannot skip it.**

**writing-plans** — Breaks an approved design into bite-sized, 2–5 minute tasks
with exact file paths and verification steps. Produces an implementation plan
before a single line of code is written.

### During Implementation

**test-driven-development** — Enforces RED → GREEN → REFACTOR. Writes the
failing test first, watches it fail, then writes minimal code to pass.
Deletes any code written before a test exists.

**subagent-driven-development** — Dispatches a fresh subagent per task with
two-stage review (spec compliance, then code quality) before proceeding.

**executing-plans** — Executes plans in batches with human checkpoints between
each batch.

### Debugging

**systematic-debugging** — Four-phase root-cause process: observe, hypothesize,
verify, fix. Prevents symptom-chasing and guess-based fixes.

**verification-before-completion** — Requires evidence that the fix actually
works before marking anything done.

### Collaboration

**dispatching-parallel-agents** — Runs independent investigations concurrently
when multiple unrelated failures exist.

**requesting-code-review** / **receiving-code-review** — Structured review
workflow with severity levels. External feedback is evaluated technically,
not followed blindly.

**finishing-a-development-branch** — Verifies tests, then presents options:
merge locally, open a PR, keep the branch, or discard.

## How the Agent Uses Skills

1. User sends a message
2. Agent checks if any skill applies (even a 1% chance triggers a check)
3. Agent announces the skill it's using
4. Agent follows the skill exactly — no adaptation, no shortcuts
5. Agent responds

Skills are not suggestions. They are mandatory workflows.
