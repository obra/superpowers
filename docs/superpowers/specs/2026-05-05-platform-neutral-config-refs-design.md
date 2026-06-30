# Platform-neutral config-file references — Phase B design

## Background

Phase A (see `2026-05-05-platform-neutral-prose-design.md`) replaced generic third-person "Claude" prose with agent-neutral forms. This phase tackles the next category: references to the per-platform instruction file (CLAUDE.md, AGENTS.md, GEMINI.md) inside skills.

The plugin runs on multiple harnesses, and each one reads its own instruction file. Where a skill names CLAUDE.md as if it were the only file, that's a Claude-Code-centric assumption that doesn't hold on Codex / Gemini CLI / OpenCode.

## In scope

Two specific lines in active skills:

1. **`skills/writing-skills/SKILL.md:58`** — `Project-specific conventions (put in CLAUDE.md)`
2. **`skills/receiving-code-review/SKILL.md:30`** — `"You're absolutely right!" (explicit CLAUDE.md violation)`

## Out of scope

- **`skills/using-superpowers/SKILL.md:22, 26`** — instruction-priority list. The list already names all three (CLAUDE.md, GEMINI.md, AGENTS.md) inclusively, which is correct: the section is making a real claim about *what counts as user instruction* on a multi-platform plugin. No change needed.
- **Historical / example artifacts**:
  - `skills/systematic-debugging/CREATION-LOG.md` — attribution path (`~/.claude/CLAUDE.md`) is a historical fact.
  - `skills/writing-skills/examples/CLAUDE_MD_TESTING.md` — the entire file is a worked example testing CLAUDE.md content variants. The filename, body, and the reference from `testing-skills-with-subagents.md` all stay; normalizing them defeats the example.
- **Platform-tooling references** — Phase D candidates:
  - `skills/using-superpowers/SKILL.md:40` (Gemini CLI tool mapping note about GEMINI.md)
  - `skills/using-superpowers/references/gemini-tools.md` (`save_memory` persists to GEMINI.md)

## Substitution rules

Two distinct calls, one per in-scope line.

### Rule 1: "where to put project-specific conventions"

`writing-skills/SKILL.md:58`:

- **Before:** `Project-specific conventions (put in CLAUDE.md)`
- **After:** `Project-specific conventions (put in your instructions file)`

Use a generic phrase rather than picking one filename. Different harnesses read different files (CLAUDE.md, AGENTS.md, GEMINI.md, etc.) and the skill should not assume one. The platform-tools reference docs (`references/{codex,copilot,gemini}-tools.md`) are the right place to name each platform's preferred file.

### Rule 2: the "(explicit CLAUDE.md violation)" parenthetical

`receiving-code-review/SKILL.md:30`:

- **Before:** `"You're absolutely right!" (explicit CLAUDE.md violation)`
- **After:** `"You're absolutely right!" (explicit instruction-file violation)`

The parenthetical is doing real work — it signals this phrase isn't just stylistically bad, it actively violates rules many users put in their instruction files. "Instruction file" is the natural cross-platform term covering AGENTS.md / CLAUDE.md / GEMINI.md collectively, and keeps the original signal without picking one filename or softening to "common".

## Commit plan

Atomic commits, in order:

1. **`writing-skills/SKILL.md`** — CLAUDE.md → "your instructions file" in the "where to put project conventions" line
2. **`receiving-code-review/SKILL.md`** — CLAUDE.md → instruction-file in the violation parenthetical
3. **Platform-tools reference docs** — add the preferred per-platform instructions filename (CLAUDE.md, AGENTS.md, GEMINI.md, etc.) to each `references/{codex,copilot,gemini}-tools.md` so readers can resolve "your instructions file" to a real filename.

Each commit message names "Phase B" and the slice.

## Verification

After each commit:

- Read the surrounding paragraph to confirm grammar and meaning still parse.
- `grep -n "CLAUDE\.md" <touched-file>` — no remaining hits in active prose (carve-outs already documented).

After both commits:

- `grep -rn "CLAUDE\.md" skills/` should return only the documented carve-outs (CREATION-LOG, CLAUDE_MD_TESTING and its inbound reference, the priority list in using-superpowers).

## Non-goals

- Do not touch the priority list ordering in `using-superpowers/SKILL.md`. Reordering CLAUDE.md / GEMINI.md / AGENTS.md is an aesthetic change, not a substitution, and out of scope here.
- Do not rename `examples/CLAUDE_MD_TESTING.md` or change its content.
- Do not modify Gemini-CLI-specific tooling references (Phase D candidates).

## Implementation note

Phase B as written here covered three commits and the three non-Claude-Code platform-tools refs. Implementation went one step further: a fourth ref, `references/claude-code-tools.md`, was added in commit `8505703` for symmetry, so Claude Code's instructions-file conventions and tool-name list live alongside the others rather than implicitly in the surrounding skill prose. That addition wasn't anticipated in this spec but is consistent with its intent.
