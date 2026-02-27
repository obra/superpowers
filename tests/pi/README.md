# Pi smoke tests

Run from repository root:

```bash
./tests/pi/run-tests.sh
```

Run only the smoke test directly:

```bash
./tests/pi/test-smoke.sh
```

What this smoke test verifies:

1. `pi install` works with an isolated `PI_CODING_AGENT_DIR` (temp directory)
2. The install writes package settings into that isolated directory
3. Pi package resolution can discover
   `skills/brainstorming/SKILL.md` from this repo
4. `pi list` shows the installed local package
5. `~/.pi/agent/settings.json` is unchanged
   (guard against accidental global writes)

Requirements:

- `pi` in `PATH`
- `node` in `PATH`
