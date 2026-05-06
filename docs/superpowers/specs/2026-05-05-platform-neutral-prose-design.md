# Platform-neutral prose — Phase A design

## Background

Superpowers ships to multiple agent runtimes (Claude Code, Codex, Cursor, OpenCode, Copilot CLI, Gemini CLI). Skill content and supporting docs were written first for Claude Code and use "Claude" in places where any runtime's agent applies. OpenAI's vendored fork (openai/plugins#217) attempted a wholesale rewrite that was actively wrong in places — rewriting historical attribution paths, model names, and platform-specific install instructions — and we want to avoid that mistake while still removing platform-centric prose where it is genuinely incidental.

The full effort is broken into phases by reference category. **This spec covers Phase A only:** generic third-person prose mentioning "Claude" in non-platform-specific contexts. Later phases (config-file references, marketing copy, tool-name references) are out of scope here and will get their own specs.

## In scope

Generic prose mentions of "Claude" in:

- `skills/*/SKILL.md` and supporting `.md` files in active skill directories
- `skills/writing-skills/anthropic-best-practices.md`
- `README.md` (only where the mention is generic prose, not platform marketing)

Plus one coined-term rename: **Claude Search Optimization (CSO) → Skill Discovery Optimization (SDO)** in `skills/writing-skills/SKILL.md`.

## Out of scope

- **Platform/runtime statements** — "In Claude Code:", install instructions, tool-mapping references. (Phase D candidate.)
- **Config-file references** — CLAUDE.md, AGENTS.md, GEMINI.md priority lists and "where to put project conventions" callouts. (Phase B.)
- **Tool-name references** — `Skill`, `Bash`, `Read`, `Task`, `TodoWrite`. Skills are written in Claude Code's tool vocabulary; the existing `references/{codex,copilot,gemini}-tools.md` files map them. (At the time this spec was written, the plan was to defer or skip these. Phase E ended up doing them — replacing tool names with action language across active skills and unifying the platform-tools refs around the same vocabulary.)
- **Marketing copy** in README — "Superpowers for Claude Code", platform-named install sections. (Phase C.)
- **Historical artifacts** — `docs/plans/*.md`, `docs/superpowers/specs/*.md`, `CREATION-LOG.md`. These are dated, point-in-time documents; rewriting them rewrites history.
- **Model identifiers** — Claude Haiku / Sonnet / Opus. These are real product names.
- **Filename / URL references** — `CLAUDE.md`, `claude.com`, `claude-plugin/`, paths under `~/.claude/`.
- **`anthropic-best-practices.md` filename** — the file remains named after its source even though we rewrite the prose inside it.

## Replacement style

Use a mix that reads naturally in English:

- **Second person — "your agent"** when addressing the skill author about *their* runtime
  - "your agent reads the description"
- **Third person — "the agent" / "agents" / "an agent"** when describing system behavior generically
  - "Future agents find your skills"
  - "Use words an agent would search for"
  - "Agents read SKILL.md only when the skill becomes relevant"

Pick whichever fits the surrounding sentence; do not force consistency at the cost of awkward phrasing. Pluralize when natural ("future agents", "agents read") rather than always saying "the agent".

### Carve-outs that stay as "Claude"

- Model names: Claude Haiku, Claude Sonnet, Claude Opus
- Filenames and URLs: `CLAUDE.md`, `claude.com`, `~/.claude/`
- Branded platform name "Claude Code" wherever it refers to the runtime as such (handled in later phases)

### Coined-term rename

- **Claude Search Optimization (CSO) → Skill Discovery Optimization (SDO)**
  - Appears in `skills/writing-skills/SKILL.md` as a section heading and in nearby prose. Rename the heading, the acronym, and any in-file cross-references.

## Files affected

Approximate counts based on a `grep` filtered to exclude carve-outs:

| File | Generic-prose mentions |
|------|------------------------|
| `skills/writing-skills/SKILL.md` | ~12 (includes CSO heading + body) |
| `skills/writing-skills/anthropic-best-practices.md` | ~30 |
| `skills/writing-skills/examples/CLAUDE_MD_TESTING.md` | ~1 — filename stays (it's a CLAUDE.md test artifact); the "Variant C: Claude.AI Emphatic Style" heading also stays (it's a label naming a specific style) |
| `README.md` | ~1 |

Final list confirmed during implementation by re-running the filtered grep.

## Commit plan

Four atomic commits, in order:

1. **Rename CSO → SDO** in `skills/writing-skills/SKILL.md`. Mechanical, isolated, easy to revert if we change our minds about the term.
2. **Active skills prose** — generic "Claude" → "agent" forms across `skills/*/SKILL.md` and supporting `.md`, excluding `anthropic-best-practices.md`.
3. **`anthropic-best-practices.md` prose** — same substitution rules. Separate commit because this file is a vendored adaptation of an external doc; isolating the change makes future reconciliation with upstream easier to read.
4. **README.md prose** *(only if any generic-prose mentions remain after filtering)*. Skipped if empty.

Each commit message names the phase ("Phase A") and the slice ("rename CSO to SDO", "agent prose in active skills", etc.) so the series is self-documenting.

## Verification

After each commit:

- `grep -rn "Claude" <touched-paths>` — every remaining hit must fall into a documented carve-out (model name, filename, URL, "Claude Code" platform name, historical artifact).
- Read the touched file end-to-end — substitutions should not have broken sentence flow, pronoun agreement, or list parallelism.
- No tests to run; this is prose-only.

After the final commit:

- Skim each modified skill in a live session to confirm nothing reads awkwardly.

## Non-goals

- Do not change behavior, structure, headings (other than CSO→SDO), examples, code blocks, or YAML frontmatter.
- Do not introduce new sections, callouts, or compatibility notes.
- Do not "improve" prose beyond the substitution while editing.
