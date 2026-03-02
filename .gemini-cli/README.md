# Superpowers Extension for Gemini CLI

This directory contains the Gemini CLI extension for Superpowers.

## What's Inside

- **gemini-extension.json** - Extension manifest
- **GEMINI.md** - Persistent context loaded in every session
- **hooks.json** - Hook configuration
- **hooks/session-start.js** - Initialization script
- **../skills/** - All 14+ Superpowers skills

## Installation

```bash
gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
```

## Verification

```bash
gemini skills list  # Should show all Superpowers skills
```

## Documentation

- **Installation:** [INSTALL.md](INSTALL.md)
- **Examples:** [EXAMPLES.md](EXAMPLES.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Full Guide:** [../docs/README.gemini-cli.md](../docs/README.gemini-cli.md)

## Quick Start

```bash
# Start Gemini CLI
gemini chat

# Ask for something that needs a skill
# Examples:
# "Help me debug this"
# "Let me plan a feature"
# "Write tests first"

# Skills activate automatically
```

## Development

For local development:

```bash
cd .gemini-cli
gemini extensions link .
```

Changes update immediately.

## Support

- Issues: https://github.com/obra/superpowers/issues
- Docs: https://github.com/obra/superpowers

---

**Version:** 4.3.1
**Maintained by:** Jesse Vincent (@obra)
