# Cross-Harness Lint

`tests/lint-cross-harness.sh` checks `skills/**/*.md` for runtime-specific language that would weaken the cross-harness purity invariant introduced by PR #1486. It is a static Markdown lint only: it does not change skill content, rewrite files, or validate runtime behavior.

## Banned Patterns

- Bare harness names in generic prose: `Claude Code`, `Cursor`, `OpenCode`, `Codex CLI`, `Codex App`, `Gemini CLI`, `GitHub Copilot CLI`, and `Factory Droid` are violations outside runtime-specific sections. Example violation: `Use Claude Code for this step.` Allowed section example: `## In Claude Code`.
- Model identifiers: concrete model names such as `claude-opus-4-7`, `gpt-5.5`, `gemini-2.5-pro`, and `o4-mini` are always violations unless covered by a local allowlist.
- Runtime-specific tool names: names such as `ExitPlanMode`, `TodoWrite`, `WebFetch`, `Task tool`, `Skill tool`, and `mcp__server__tool` are violations outside runtime-specific sections or `references/<runtime>-tools.md`. Allowed section example: `### For Cursor`.
- Hardcoded user paths: macOS personal home paths such as `/Users/jesse/` are always violations unless covered by a local allowlist.

Lines are allowed under any of these rules. The lint stops at the first rule that applies; tokens are not re-checked after a line passes one rule.

- **Two-or-more agents on the same line.** Any line that names two or more distinct harness families (Claude, Codex, Cursor, OpenCode, Gemini, Copilot, Factory Droid, Aider, Cline, Windsurf, Hermes, Hyperagent, Antigravity, Kiro, Qwen, Kimi) is intentional cross-runtime prose. Example that passes: `~/.claude/skills for Claude Code, ~/.agents/skills/ for Codex`.
- **A per-runtime section header.** A Markdown heading whose text matches `In <harness>`, `For <harness>`, or `<harness>:` opens a section that continues until the next heading of equal or lesser depth. Tokens inside the section do not flag.
- **An inline bold-prose runtime marker** at the start of a line: `**In <harness>:** ...`, `**For <harness>:** ...`, or `**<harness>:** ...`. The marker covers that line only. This is the pattern used in `skills/using-superpowers/SKILL.md`.
- **A `skills/*/references/<runtime>-tools.md` file.** Bare-harness and runtime-tool checks are suppressed for these files. Model identifiers and hardcoded `/Users/<name>/` paths are still flagged regardless of file or section context.
- **The internal exception list** at `tests/lint-cross-harness.exceptions`. One `path:line[:reason]` per line, `#` for comment lines. Use this when a single-agent reference is intentional but the two-agents rule does not naturally apply (graphviz nodes, dispatch prompt headers, source-attributed excerpts).

## Internal Exception List

`tests/lint-cross-harness.exceptions` carries the lint's own list of allowed single-agent references so skill content stays free of inline annotations. Format:

```
# Comments start with hash
skills/path/to/file.md:LINE:reason

skills/another/file.md:42:reason describing why this single-agent reference is intentional
```

The reason field is free-form text after the second colon and is for humans reading the file. The lint does not validate or enforce it.

## Running Locally

Run the lint from the repository root:

```sh
bash tests/lint-cross-harness.sh
```

Exit code `0` means the lint passed, `1` means violations or invalid allowlist comments were found, and `2` means the lint could not run because of an internal or usage error.

## Updating the Lint

Bare harness names and runtime tool names are intentionally enumerated in the script. Adding a new harness or tool means adding it to those lists so future regressions are detected. Cross-runtime documentation is handled by the two-agents-on-a-line rule and the per-runtime section markers; the internal exception list at `tests/lint-cross-harness.exceptions` covers single-agent references that are intentional.

## CI Integration

`.github/workflows/lint.yml` runs the lint on every PR and push to `main`/`dev`. The lint exits non-zero on any violation; CI blocks merge. Skill content is not annotated; cross-runtime intent is recognised by the rules above and by the sidecar exception list.
