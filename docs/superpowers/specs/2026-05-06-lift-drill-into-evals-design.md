# Lift drill into superpowers as `evals/` — design

## Background

Drill is a Python skill-compliance benchmark that lives in its own repo at `obra/drill`. It drives real tmux sessions, runs an LLM actor as a simulated user, runs an LLM verifier on the resulting transcript, and reports pass/fail per scenario. It supports Claude Code, Codex, Gemini CLI, and (per recent commits) OpenCode and Copilot CLI.

Drill is already the *de facto* eval harness for superpowers. The PRI-1397 commit series in the drill repo lifted ~22 superpowers bash tests into drill scenarios, and the most recent superpowers commit (`a2292c5`) explicitly removed a redundant bash test with the message *"replaced by drill behavioral coverage"*. Migration momentum exists; this spec completes it.

This work moves drill into superpowers under `evals/`, deletes the redundant bash tests after per-file verification of drill scenario coverage, and updates docs so contributors land on the new structure.

## Goals

1. `evals/` is the canonical eval harness in superpowers — full drill source, scenarios, fixtures, prompts, backend configs, and tests.
2. Bash tests in `superpowers/tests/` that have been individually verified as 100% covered by drill scenarios are deleted; the rest are preserved.
3. The split between `tests/` (plugin infrastructure: bash + node + python integration tests) and `evals/` (LLM behavior with actor + verifier) is meaningful and documented.
4. Top-level docs (`README.md`, `CLAUDE.md`, `docs/testing.md`) point contributors at the right place.
5. The standalone `obra/drill` repo continues to exist (this PR does not touch it) and gets archived as a separate manual step after this PR merges.

## Non-goals

- **CI integration.** Manual-only here. The natural follow-up is "tiered": fast subset on every PR, full sweep nightly + on-demand. That requires API budget decisions, GitHub Actions secrets, and a runner image with `tmux` + `node` + `python` + `claude` / `codex` / `gemini` CLIs installed. Out of scope.
- **Scenario co-location with skills.** Scenarios stay centralized at `evals/scenarios/`. If we later decide each skill should own its scenarios, that's a path-find-and-rename operation; the YAML format does not change.
- **Renaming the internal Python package** (`drill` → `evals`). The directory is `evals/` (user-facing); the Python package keeps its `drill` name to keep the diff small. A short note in `evals/README.md` explains.
- **Drill repo archival.** This PR does not touch `obra/drill`. After merge, the drill repo is archived manually (read-only on GitHub, README pointer to `obra/superpowers/evals/`).
- **Lifting `tests/claude-code/analyze-token-usage.py` into `evals/bin/`.** Useful utility, not test code. Can move later; not required by this PR.

## Branching

Branch off `dev` as `f/evals-lift`. This work is independent of the open `f/cross-platform` PR — no shared file changes besides possibly `README.md`, which is small enough to resolve at merge time if it conflicts.

## Architecture after the move

```
superpowers/
  evals/                              ← NEW (full drill copy)
    pyproject.toml                    (Python 3.11, uv-managed)
    uv.lock
    .gitignore                        (drill's own; results/, .venv/, .env)
    README.md                         (was drill's README; install instructions updated)
    CLAUDE.md                         (was drill's CLAUDE.md; paths updated)
    docs/
      design.md                       (drill's design — preserved verbatim, cross-linked from this spec)
      manual-testing.md
      pressure-and-red-testing.md
    drill/                            (Python package; name kept; cli, engine, actor, verifier, etc.)
    backends/                         (claude-*.yaml, codex.yaml, gemini.yaml)
    scenarios/                        (32+ YAML scenarios)
    setup_helpers/                    (15 Python helpers; create_base_repo, sdd_*, spec_*, worktree, etc.)
    fixtures/                         (template-repo, sdd-go-fractals, sdd-svelte-todo)
    prompts/                          (actor.md, verifier.md)
    bin/                              (assertion helper scripts: tool-called, tool-count, etc.)
    tests/                            (drill's own pytest suite)

  tests/                              ← bash tests preserved by default
    brainstorm-server/                ← KEEP (node tests for brainstorm-server JS code)
    opencode/                         ← KEEP (plugin loading tests)
    codex-plugin-sync/                ← KEEP (sync verification)
    claude-code/                      ← MOSTLY KEEP — see deletion gate
    explicit-skill-requests/          ← KEEP unless verified replaced
    skill-triggering/                 ← KEEP unless verified replaced
    subagent-driven-dev/              ← KEEP unless verified replaced

  docs/
    testing.md                        ← UPDATED (split into "Plugin tests" + "Skill behavior evals")
    superpowers/
      specs/
        2026-05-06-lift-drill-into-evals-design.md   ← THIS SPEC

  README.md                           ← small Contributing-section pointer to evals/
  CLAUDE.md                           ← one-line "Eval harness lives at evals/" pointer
```

The `tests/` and `evals/` directories serve clearly distinct roles after this PR:

- **`tests/`** — does the plugin's non-LLM code work? Unit and integration tests for the brainstorm-server JS code, OpenCode plugin loading, codex-plugin-sync sync verification. Bash + node + python.
- **`evals/`** — do agents behave correctly on real LLM sessions? Drill scenarios with actor + verifier. Python-only, runs real tmux sessions.

## Deletion gate (per bash test)

A bash test is deleted *only if* a drill scenario verifiably covers every assertion it makes. The implementation plan documents this verification per file: read the bash test, list its checks, find the drill scenario, confirm each check has a matching `verify.assertions` or `verify.criteria` entry. If even one check is missing, the option is to either extend the drill scenario or keep the bash test. Default keeps it.

**Tentative coverage map** (commit-message-based; needs per-file verification before any deletion):

| Bash test | Claimed drill replacement | Coverage status |
|-----------|---------------------------|-----------------|
| `tests/skill-triggering/*` (6 prompt files) | `triggering-*.yaml` (6 scenarios) | candidate — verify before deleting |
| `tests/explicit-skill-requests/*` | `explicit-skill-request-sdd.yaml`, `mid-conversation-skill-invocation.yaml` | candidate — verify before deleting |
| `tests/subagent-driven-dev/go-fractals/`, `tests/subagent-driven-dev/svelte-todo/` | `sdd-go-fractals.yaml`, `sdd-svelte-todo.yaml` | candidate — verify before deleting (these include real assertions about test suites passing) |
| `tests/claude-code/test-document-review-system.sh` | `spec-reviewer-catches-planted-flaws.yaml` | candidate — verify before deleting |
| `tests/claude-code/test-requesting-code-review.sh` | `code-review-catches-planted-bugs.yaml` | candidate — verify before deleting |
| `tests/claude-code/test-subagent-driven-development-integration.sh` | `sdd-rejects-extra-features.yaml` (YAGNI subset) | **partial** — bash test also runs token analysis; drill scenario does not. Likely keep + extend drill scenario. |
| `tests/claude-code/test-subagent-driven-development.sh` | unclear from commit log | needs investigation in implementation phase |
| `tests/claude-code/test-worktree-native-preference.sh` | `worktree-creation-under-pressure.yaml` | candidate — verify before deleting |
| `tests/claude-code/test-helpers.sh`, `run-skill-tests.sh`, `analyze-token-usage.py` | n/a (utilities, not tests) | **keep** — these are libraries/tools, not test cases |

## Verification protocol (subagent-gated)

Every change in the implementation plan gets cross-checked by an independent subagent before commit.

| Change category | Subagent verification |
|----------------|----------------------|
| Each bash-test deletion | Dispatch a subagent with: (a) the bash test file content, (b) the candidate drill scenario YAML, (c) the prompt: *"List every assertion the bash test makes. List every verify entry in the drill scenario. For each bash assertion, find a matching drill check or report it as unmatched. Output a per-assertion table."* The subagent's output is the gate — only delete if every bash assertion has a match. |
| Initial `evals/` copy | Subagent verifies: file count matches drill repo; all backend YAMLs reference paths that exist post-move; `.env` template carries over; `pyproject.toml` is intact; `uv.lock` is intact. |
| Reference scrubbing after deletion | Subagent greps the entire superpowers tree for references to deleted bash test paths (in `docs/`, `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `README.md`, `.github/`, `scripts/`, `opencode/INSTALL.md`, `.codex/INSTALL.md`, etc.). Any hit is either updated or surfaces a missed dependency. |
| Path defaults change (`SUPERPOWERS_ROOT` default) | Subagent runs at least one cheap drill scenario after the path changes (e.g., `triggering-test-driven-development`) and confirms it still passes. Real validation, not just code review. |
| Final pre-PR adversarial review | Two subagents in parallel, "5 points to whoever finds the most legitimate issues" framing — same protocol used on the cross-platform PR. Verify both source code and behavior. |

Each subagent task gets its own bullet in the implementation plan with explicit inputs and pass criteria. The subagent's output is summarized in the relevant commit message ("Subagent verification: …") so the trail is auditable.

## Concrete path/config edits

The drill copy is mostly path-agnostic; only a small set of files reference `SUPERPOWERS_ROOT`:

| File | Current | After |
|------|---------|-------|
| `drill/engine.py`, `drill/setup.py` | `os.environ["SUPERPOWERS_ROOT"]` (KeyError if unset) | New helper `superpowers_root()` that defaults to `PROJECT_ROOT.parent` (the dir containing `evals/`); env var still respected as override |
| `backends/*.yaml` (7 files) | `${SUPERPOWERS_ROOT}` substitution in `args` and `required_env` | YAML unchanged. The new helper sets `os.environ["SUPERPOWERS_ROOT"]` at CLI startup *if not already set*, so the existing YAML substitution keeps working with no edits. `required_env` entries can be dropped since the variable is now self-supplied. |
| `evals/README.md` | "export SUPERPOWERS_ROOT=/path/to/superpowers" | Drop the export line; note that env var is auto-detected; mention the only required setup is `ANTHROPIC_API_KEY` |
| `evals/CLAUDE.md` | Same | Same |
| `evals/.gitignore` | drill's existing patterns (`results/`, `.venv/`, `__pycache__/`, `.env`) | Identical |

`.env` placement: keep `evals/.env` (gitignored). Contributors source it from there or set `ANTHROPIC_API_KEY` in their shell environment.

**Top-level superpowers files needing small additions:**

- `superpowers/.gitignore`: add `evals/results/`, `evals/.venv/`, `evals/.env` (belt-and-suspenders; evals/.gitignore already covers these locally).
- `superpowers/CLAUDE.md`: add a one-line pointer "Eval harness lives at `evals/` — see `evals/README.md`" so agents discover it.
- `superpowers/docs/testing.md`: split into "## Plugin tests" (existing tests/ content, with the deleted-test references trimmed) and "## Skill behavior evals" (one-paragraph summary + pointer to `evals/`).
- `superpowers/README.md`: add a single line in the Contributing section pointing at `evals/` for skill-behavior testing.

## Migration ordering

Each step is a separate commit (or small group of commits). Step 2 is the biggest single commit (the verbatim drill copy); subsequent steps are small and atomic.

```
1. Branch off `dev` (f/evals-lift)

2. Copy drill repo into evals/ (single commit, easy to revert)
   ├─ Subagent gate: file count matches drill repo; key files present
   │  (pyproject.toml, uv.lock, scenarios/*.yaml, backends/*.yaml, drill/*.py)
   └─ Smoke check: `cd evals && uv sync` succeeds

3. Update path defaults
   ├─ Add superpowers_root() helper to drill module
   ├─ Update engine.py + setup.py to use it
   ├─ Update evals/README.md and evals/CLAUDE.md (drop SUPERPOWERS_ROOT install step)
   └─ Drop SUPERPOWERS_ROOT from required_env in backend YAMLs

4. Validate from new location
   └─ Run triggering-test-driven-development -b claude (cheap scenario, ~3-5 min).
      Must pass. Real validation, not code review.

5. Bash test deletion phase — per-file with subagent gate
   For each file in the candidate-deletion list:
   a. Subagent compares bash test assertions vs drill scenario verify block
   b. Pass criterion: every bash assertion has a matching drill check
   c. If pass → delete the bash test file (one commit per file or per
      coherent group)
   d. If fail → either extend drill scenario (separate commit + verify) or
      keep the bash test (no commit)

6. Stale-reference scrub
   └─ Subagent greps: deleted file paths in docs/, CLAUDE.md, GEMINI.md,
      AGENTS.md, README.md, .github/, scripts/, opencode/INSTALL.md,
      .codex/INSTALL.md. Update or surface each hit.

7. Top-level docs
   ├─ docs/testing.md split
   ├─ CLAUDE.md pointer
   └─ README.md Contributing section

8. Re-run smoke scenario from new location (still passing? assertion
   that step 5 didn't silently break the harness)

9. Final adversarial review
   └─ Two parallel subagents, full diff, "5 points to whoever finds the
      most legitimate issues" framing. Address findings before push.

10. Push branch + open PR against dev
```

## Verification (post-implementation)

The implementation plan must show:

- All drill source files present at `evals/` after step 2 (subagent file-count diff vs `obra/drill`).
- `cd evals && uv sync` succeeds without `SUPERPOWERS_ROOT` set.
- `cd evals && uv run drill list` returns the same scenario count as the standalone drill repo.
- `cd evals && uv run drill run triggering-test-driven-development -b claude` passes (proves path defaults work).
- For each deleted bash test: subagent verification table showing every assertion mapped to a drill check.
- Grep for deleted file paths returns zero hits across the superpowers tree (post step 6).
- `docs/testing.md` has both "Plugin tests" and "Skill behavior evals" sections.
- The drill repo's history is untouched; `obra/drill` is unaffected by this PR.

## Open questions

None. All clarifying decisions have been made:

| Question | Decision |
|----------|----------|
| Where does drill live in superpowers? | `evals/` (rename from drill); standalone repo archived as separate step |
| Fate of redundant bash tests? | Delete per-file with subagent verification of coverage; default keep |
| Scenarios layout? | Centralized at `evals/scenarios/` |
| Python toolchain placement? | Self-contained at `evals/` |
| CI integration? | Manual-only this PR; documented future path |
| Migration mechanics? | Plain copy; drill repo's history preserved in archived repo, not in-tree |
| Internal Python package name? | Keep as `drill` (directory is `evals/`) |
| Branching strategy? | Independent off `dev` (not stacked on `f/cross-platform`) |
