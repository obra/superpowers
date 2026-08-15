# Explicit Skill Request Tests

Integration tests that verify Claude invokes the correct Superpowers skill when a user explicitly requests it by name (without the plugin namespace prefix).

## Requirements

- Claude Code CLI installed and authenticated (`claude --version`)
- `jq` for parsing stream-json output
- Local superpowers checkout (this repository)

## Running

### Single prompt test

```bash
./run-test.sh <skill-name> <prompt-file> [max-turns]
```

Example:

```bash
./run-test.sh subagent-driven-development ./prompts/subagent-driven-development-please.txt
```

### Full suite

```bash
./run-all.sh
```

### Multi-turn scenarios

```bash
./run-multiturn-test.sh
./run-extended-multiturn-test.sh
./run-haiku-test.sh
```

## Shared test library

Common helpers live in `tests/lib/`:

| File | Purpose |
|------|---------|
| `common.sh` | Paths, output dirs, auth-system plan fixtures |
| `assertions.sh` | Skill trigger and premature-action checks |
| `run-claude.sh` | `claude -p` stream-json runners |
| `test-prompt.sh` | Single-prompt test implementation |

`run-test.sh` is a thin wrapper around `tests/lib/test-prompt.sh`.

## Prompts

Prompt files in `prompts/` cover:

- Direct skill name requests (`subagent-driven-development, please`)
- Polite phrasing (`please use brainstorming`)
- Mid-conversation requests after planning context exists
- `/handoff` instructions that name a skill explicitly
- Technique descriptions that should map to a skill without naming it

## Optional skill fixtures

`tests/shared/optional-skills/` contains minimal `SKILL.md` stubs for isolated runs where only lightweight skill metadata is needed.

## Docker

`docker-compose.yml` mounts the repository and runs the fast suite. Claude CLI auth must be available inside the container (for example via a mounted `~/.claude` directory).

```bash
docker compose run --rm explicit-skill-requests
```

## Output

Logs are written under `/tmp/superpowers-tests/<timestamp>/explicit-skill-requests/`.
