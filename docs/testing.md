# Testing Superpowers

Superpowers has two distinct kinds of tests, each in its own directory:

- **`tests/`** — does the plugin's non-LLM code work? Bash + node + python integration tests for brainstorm-server JS, OpenCode plugin loading, codex-plugin sync, and analysis utilities.
- **`evals/`** — do agents behave correctly on real LLM sessions? Python harness driving real tmux sessions of Claude Code / Codex / Gemini CLI, with an LLM actor and verifier judging skill compliance.

## Plugin tests

Live in `tests/`. Currently:

- `tests/brainstorm-server/` — node test suite for the brainstorm server JS code.
- `tests/opencode/` — bash tests for OpenCode plugin loading, bootstrap caching, and tool registration.
- `tests/codex-plugin-sync/` — bash sync verification.
- `tests/kimi/` — bash/Python checks for Kimi plugin manifest wiring.
- `tests/claude-code/test-helpers.sh`, `analyze-token-usage.py` — utilities used by remaining bash tests.
- `tests/claude-code/test-subagent-driven-development.sh` — agent-can-describe-SDD test (no quorum counterpart; tests description-recall, not behavior).
- `tests/claude-code/test-subagent-driven-development-integration.sh` — extended SDD integration with token analysis (quorum covers the YAGNI subset; bash adds commit-count, Claude Code task-tracking, and token telemetry assertions).
- `tests/claude-code/test-worktree-native-preference.sh` — RED-GREEN-REFACTOR validation for worktree skill (quorum covers the PRESSURE phase; bash also covers RED/GREEN baselines).
- `tests/explicit-skill-requests/` — Haiku-specific, multi-turn, and skill-name-prompted tests not covered by quorum.
- `tests/diagnosing-superpowers/test-skill-structure.sh` — structural checks for the diagnosing-superpowers skill (frontmatter, referenced files, leak scan, word budget); behavior-scenario eval records are kept by the maintainer outside the repo.

Run plugin tests by invoking the test file directly (`bash tests/<dir>/<test>.sh`), or a
directory's `run-*.sh` to run a whole group. There is no `npm test` script: `package.json`
declares no scripts and the repository installs no npm dependencies, so every test runs
from the checkout with only `bash`, `node`, `python3` and `git`.

## Skill behavior evals

Live in `evals/` (the [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/) eval lab, since renamed from Drill). Quorum is the harness CLI — one part of the system: it drives real coding-agent CLIs through a Gauntlet QA agent and grades them against each scenario's acceptance criteria plus deterministic post-checks. Scenarios live at `evals/scenarios/<name>/`. See `evals/README.md` for setup, the container runtime, and the safety model. Quick start (local break-glass run):

```bash
cd evals
bun install
export SUPERPOWERS_ROOT=/path/to/superpowers
bun run quorum run scenarios/triggering-test-driven-development --coding-agent claude
bun run quorum show <run-dir>
```

Quorum scenarios are slow (3-30+ minutes each) and run real LLM sessions in permissive modes — read `evals/README.md`'s Live Eval Risk section first. Only the static gates (`bun run check`, `bun run quorum check`) are safe for public CI; the natural follow-up remains a tiered model (static gates on PR, live sweep nightly + on-demand).

Note: `evals/` is the separate [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/) repository and is not present in this checkout, so `bun run check` cannot be run here.

## Continuous integration

`.github/workflows/ci.yml` implements tier 1 of that model: deterministic, credential-free
checks on every pull request targeting `main` (and every push to `main`, plus manual
`workflow_dispatch`). It uses only the runner's stock `bash`, `node`, `python3` and `git`,
installs no npm dependencies, and never receives a secret, so it is safe to run on pull
requests from forks.

It runs two jobs:

- **Shell syntax** — `bash -n` over every tracked shell script (files ending in `.sh`, plus
  extensionless files whose shebang names `bash`/`sh`). 60 scripts at the time of writing.
- **`plugin-tests`** — a `fail-fast: false` matrix, one job per test file, so a failure names
  the single test that broke instead of one opaque aggregate step:

  | Test | Covers |
  |---|---|
  | `tests/skill-layout/test-no-dev-files-in-skills.sh` | skills ship no pressure scenarios or creation logs |
  | `tests/skill-size/test-skill-size.sh` | every `SKILL.md` stays under 20 000 bytes |
  | `tests/sdd-helper-paths/test-sdd-helper-paths.sh` | relative helper references say to run by absolute path |
  | `tests/shell-lint/test-lint-shell.sh` | `scripts/lint-shell.sh` selection and flag handling (stubbed tools) |
  | `tests/systematic-debugging/test-find-polluter.sh` | the documented polluter-detection pattern (#2008) |
  | `tests/hooks/test-session-start.sh` | `session-start` / `run-hook.cmd` exit behaviour |
  | `tests/brainstorm-server/start-server.test.sh` | `start-server.sh` platform decisions, session dirs |
  | `tests/brainstorm-server/stop-server.test.sh` | `stop-server.sh` lifecycle |
  | `tests/codex/test-marketplace-manifest.sh` | Codex marketplace manifest |
  | `tests/devin/test-devin-plugin.sh` | Devin plugin manifest |
  | `tests/kimi/test-plugin-manifest.sh` | Kimi plugin manifest |
  | `tests/antigravity/test-plugin-manifest.sh` | Antigravity plugin manifest |
  | `tests/diagnosing-superpowers/test-skill-structure.sh` | diagnosing-superpowers structure, frontmatter, word budget |

### Not run on pull requests, and why

| Test | Why it is excluded |
|---|---|
| `tests/claude-code/test-subagent-driven-development*.sh`, `test-worktree-*.sh`, `run-skill-tests.sh` | drive the real Claude Code CLI; need the CLI installed plus credentials |
| `tests/explicit-skill-requests/*` | multi-turn live sessions against Haiku; needs an API key |
| `tests/opencode/*` | need the `opencode` CLI and its runtime on the runner |
| `tests/pi/test-pi-extension.mjs` | needs the `pi` runtime |
| `tests/writing-skills/test-render-graphs.sh` | needs Graphviz `dot` |
| `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`, `tests/codex/test-package-codex-plugin.sh` | assert against a generated `.codex-plugin/` tree that a fresh checkout does not contain — run `scripts/package-codex-plugin.sh` first |
| `tests/claude-code/test-sdd-workspace.sh` | asserts git's exact "not a repository" wording; wording differs across git builds, so it is not yet portable |
| `tests/version-bump/test-bump-version.sh` | requires `jq`, which the workflow does not yet install |
| `evals/`, `bun run check`, `bun run quorum check` | not in this repository (see above) |

Tier 2 (scheduled nightly + `workflow_dispatch` live evaluations) is intentionally not
implemented here: it needs maintainer sign-off on the API budget and runner requirements.

### Reproducing CI locally

```bash
# one test
bash tests/shell-lint/test-lint-shell.sh

# the whole tier-1 test set, no GitHub needed
for t in \
  tests/skill-layout/test-no-dev-files-in-skills.sh \
  tests/skill-size/test-skill-size.sh \
  tests/sdd-helper-paths/test-sdd-helper-paths.sh \
  tests/shell-lint/test-lint-shell.sh \
  tests/systematic-debugging/test-find-polluter.sh \
  tests/hooks/test-session-start.sh \
  tests/brainstorm-server/start-server.test.sh \
  tests/brainstorm-server/stop-server.test.sh \
  tests/codex/test-marketplace-manifest.sh \
  tests/devin/test-devin-plugin.sh \
  tests/kimi/test-plugin-manifest.sh \
  tests/antigravity/test-plugin-manifest.sh \
  tests/diagnosing-superpowers/test-skill-structure.sh
do
  echo "== $t"; bash "$t" || echo "FAILED: $t"
done
```

Prerequisites: `bash`, `git`, Node.js 22, `python3`. macOS and Linux match the runner; on
Windows use Git Bash and set a POSIX `TMPDIR` (for example `TMPDIR="$PWD/.tmp"`) so the
tests' temp-dir cleanup stays inside the checkout.
