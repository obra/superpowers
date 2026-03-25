# Factory Droid Plugin Tests

Automated tests for the Factory Droid CLI plugin integration.

## Running Tests

### Run all fast tests (no droid CLI needed):
```bash
./run-droid-tests.sh
```

### Run with integration tests (requires droid CLI, 2-5 minutes):
```bash
./run-droid-tests.sh --integration
```

### Run with verbose output:
```bash
./run-droid-tests.sh --verbose
```

### Run specific test:
```bash
./run-droid-tests.sh --test test-session-start-hook.sh
```

### Set custom timeout:
```bash
./run-droid-tests.sh --timeout 600  # 10 minutes for integration tests
```

## Test Files

### Fast Tests (run by default)

| Test | What it verifies |
|------|-----------------|
| `test-plugin-manifests.sh` | `.factory-plugin/plugin.json` and `marketplace.json` validity, required fields, version consistency |
| `test-session-start-hook.sh` | `hooks/session-start` skips injection when `DROID_PLUGIN_ROOT` is set, produces valid JSON for Claude Code |
| `test-skill-discovery.sh` | All skills have `SKILL.md`, no duplicates, key skills present, no duplicate skills in `.factory/` |
| `test-legacy-cleanup.sh` | Old `.factory/hooks/`, `.factory/scripts/`, `.factory/skills/` files are removed |

### Integration Tests (use --integration flag)

| Test | What it verifies |
|------|-----------------|
| `test-plugin-installation.sh` | Plugin is installed, Skill tool available, droid recognizes skills, no hook injection |
| `test-skill-invocation.sh` | Droid suggests correct skills for different scenarios (brainstorming, TDD, debugging, etc.) |
