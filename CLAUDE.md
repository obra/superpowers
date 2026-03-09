# Superpowers-Optimized

## Key Commands

```bash
# Run skill trigger tests
bash tests/skill-triggering/run-all.sh

# Run explicit skill request tests
bash tests/explicit-skill-requests/run-all.sh

# Run subagent-driven-dev E2E tests
bash tests/subagent-driven-dev/run-test.sh
```

## Critical Constraints

- Never reference `TaskCreate`/`TaskUpdate`/`TaskList` — these are not real Claude Code tools
- `using-superpowers` is the mandatory entry point for all technical work (except micro tasks) — do not invoke other workflow skills directly
- All three plugin manifests (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`) must be updated together — they are strictly validated and unrecognized keys cause installation failure
- `context-management` is for cross-session persistence only — Claude Code handles in-session compression automatically
- Discipline-critical skills (`systematic-debugging`, `test-driven-development`, `verification-before-completion`) must include rationalization tables and red flags to prevent LLM shortcuts

## Conventions

- Skill names use `lowercase-hyphen-case`
- Skill `description` frontmatter uses assertive trigger language ("MUST USE", "BLOCKING", "Invoke BEFORE") — polite phrasing reads as optional to LLMs
- All cross-skill references must match the `name:` in the target's YAML frontmatter exactly
- Plans go in `docs/plans/YYYY-MM-DD-<topic>.md`
- Support both Unix and Windows in process management commands
- Keep SKILL.md files concise; move detailed references to subdirectory files
