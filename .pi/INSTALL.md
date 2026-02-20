# Installing Superpowers for Pi

## Prerequisites

- [Pi](https://github.com/mariozechner/pi-coding-agent) installed
- Git

## Installation

```bash
pi install https://github.com/obra/superpowers
```

Pi clones the repo and discovers all skills from the `skills/` directory automatically.

### Alternative: Local Clone

If you already have a local clone:

```bash
pi install /path/to/superpowers
```

## Verify

Check that the package appears:

```bash
pi list
```

Then start pi and use `/skill:brainstorming` to confirm skills load.

## Updating

Update superpowers:

```bash
pi update https://github.com/obra/superpowers
```

Or pull manually if using a local path:

```bash
cd /path/to/superpowers && git pull
```

## Uninstalling

```bash
pi remove https://github.com/obra/superpowers
```
