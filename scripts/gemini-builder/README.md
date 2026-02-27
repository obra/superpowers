# scripts/gemini-builder

A build pipeline that compiles the `obra/superpowers` skills into a
[Gemini CLI](https://github.com/google-gemini/gemini-cli) extension.

## How It Works

Reads every `SKILL.md` file in `skills/` and produces a ready-to-install
Gemini CLI extension directory:

```text
dist/
├── gemini-extension.json   ← Extension manifest
├── GEMINI.md               ← Global context (loaded every session)
└── commands/
    ├── brainstorming.toml  ← /brainstorming slash command
    ├── executing-plans.toml
    └── writing-plans.toml
```

Skills that already have a corresponding file in `commands/` become slash
commands. All other skills are consolidated into `GEMINI.md` as persistent
context.

## Running Locally

From the repository root:

```bash
# Build to ./dist (CI default)
python scripts/gemini-builder/mapper.py

# Build to a local test directory
python scripts/gemini-builder/mapper.py --output-dir ./local-gemini-superpowers

# Preview without writing anything
python scripts/gemini-builder/mapper.py --dry-run

# Force additional skills to be commands
python scripts/gemini-builder/mapper.py --commands systematic-debugging
```

## Running Tests

```bash
python -m pytest scripts/gemini-builder/tests/ -v
```

## Module Structure

| File | Responsibility |
|------|---------------|
| `reader.py` | Discovers and reads `SKILL.md` files |
| `parser.py` | Parses YAML frontmatter, builds `Skill` objects, classifies commands |
| `writer.py` | Writes `GEMINI.md`, TOML commands, `gemini-extension.json` |
| `mapper.py` | Pipeline orchestrator and CLI entry point |

All modules are Python stdlib only — no dependencies to install.
