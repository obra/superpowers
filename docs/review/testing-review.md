# Testing Strategy & Coverage Review

**Reviewer:** test-reviewer agent
**Date:** 2026-03-02
**Scope:** Full test suite across all test directories

---

## Executive Summary

The Hartye-superpowers project has a thoughtfully designed multi-layered test suite that covers skill triggering, content verification, integration, and platform compatibility. The test infrastructure shows real engineering maturity — particularly in the `test-helpers.sh` design, the two-tier fast/integration split, and the `analyze-token-usage.py` tool. However, critical gaps exist: 9 out of 15 skills have no behavioral tests at all, no CI pipeline is wired, and the three test ecosystems (claude-code, skill-triggering, explicit-skill-requests) are not unified under a single entrypoint.

---

## 1. Test Coverage — Which Skills Are Tested?

### Tested Skills

| Skill | Test Type | Where Tested |
|-------|-----------|--------------|
| `subagent-driven-development` | Content/behavior (unit + integration) | `claude-code/test-subagent-driven-development.sh`, `test-subagent-driven-development-integration.sh`, `subagent-driven-dev/` scenario tests, `explicit-skill-requests/`, `skill-triggering/` |
| `team-driven-development` | Content/behavior (unit + integration) | `claude-code/test-team-driven-development.sh`, `test-team-driven-development-integration.sh` |
| `systematic-debugging` | Triggering only | `skill-triggering/prompts/systematic-debugging.txt`, `explicit-skill-requests/` |
| `executing-plans` | Triggering only | `skill-triggering/prompts/executing-plans.txt` |
| `requesting-code-review` | Triggering only | `skill-triggering/prompts/requesting-code-review.txt` |
| `dispatching-parallel-agents` | Triggering only | `skill-triggering/prompts/dispatching-parallel-agents.txt` |
| `writing-plans` | Triggering only | `skill-triggering/prompts/writing-plans.txt` |
| `test-driven-development` | Triggering only | `skill-triggering/prompts/test-driven-development.txt` |
| `brainstorming` | Triggering only | `explicit-skill-requests/prompts/please-use-brainstorming.txt` |

### Untested Skills (No Behavioral Tests)

| Skill | Description | Risk Level |
|-------|-------------|------------|
| `using-superpowers` | Bootstrap skill — loads at start of every conversation | **Critical** |
| `using-git-worktrees` | Prerequisite for SDD and TDD skills | High |
| `verification-before-completion` | Core quality gate | High |
| `finishing-a-development-branch` | Final step in SDD/TDD workflows | High |
| `receiving-code-review` | Counterpart to `requesting-code-review` | Medium |
| `writing-skills` | Used for internal skill documentation | Low |

**Coverage summary:** 9/15 skills have some test coverage; only 2 skills (subagent-driven-development and team-driven-development) have substantive behavioral tests. 6 skills are completely untested.

### Coverage Tiers

- **Tier 1 (fully tested):** `subagent-driven-development`, `team-driven-development`
- **Tier 2 (trigger-only):** `systematic-debugging`, `executing-plans`, `requesting-code-review`, `dispatching-parallel-agents`, `writing-plans`, `test-driven-development`, `brainstorming`
- **Tier 3 (no tests):** `using-superpowers`, `using-git-worktrees`, `verification-before-completion`, `finishing-a-development-branch`, `receiving-code-review`, `writing-skills`

---

## 2. Test Organization

### Directory Structure

```
tests/
├── claude-code/                     # Behavioral tests via Claude Code CLI
│   ├── run-skill-tests.sh           # Runner for fast + integration tests
│   ├── test-helpers.sh              # Shared library
│   ├── test-subagent-driven-development.sh          # Unit-style (fast)
│   ├── test-subagent-driven-development-integration.sh  # Full workflow
│   ├── test-team-driven-development.sh               # Unit-style (fast)
│   ├── test-team-driven-development-integration.sh   # Full workflow
│   └── analyze-token-usage.py       # Cost/token analysis
├── opencode/                        # OpenCode platform tests
│   ├── run-tests.sh
│   ├── setup.sh                     # Isolated environment setup
│   ├── test-plugin-loading.sh       # File/install validation
│   ├── test-skills-core.sh          # Library unit tests
│   ├── test-tools.sh                # Integration (requires opencode CLI)
│   └── test-priority.sh             # Priority resolution integration
├── skill-triggering/                # Does Claude trigger the right skill?
│   ├── run-all.sh
│   ├── run-test.sh
│   └── prompts/                     # Natural-language trigger prompts
├── explicit-skill-requests/         # Does Claude invoke when named?
│   ├── run-all.sh
│   ├── run-test.sh
│   ├── run-multiturn-test.sh
│   ├── run-extended-multiturn-test.sh
│   ├── run-haiku-test.sh
│   ├── run-claude-describes-sdd.sh
│   └── prompts/                     # Explicit request prompts
└── subagent-driven-dev/             # Real-world scenario fixtures
    ├── run-test.sh
    ├── go-fractals/                 # Go CLI test scenario
    └── svelte-todo/                 # Svelte frontend test scenario
```

### Assessment

The organization is logical with good separation of concerns. The four test categories address distinct failure modes:
- `claude-code/` — "Does the skill content say the right things?"
- `skill-triggering/` — "Does Claude invoke the skill when it should?"
- `explicit-skill-requests/` — "Does Claude invoke the skill when named?"
- `subagent-driven-dev/` — "Does the full workflow actually work in real projects?"

**Problem:** There is no single top-level `run-all-tests.sh` that orchestrates all four ecosystems. Users must know to run four different entrypoints. The `opencode/` and `claude-code/` suites are completely independent with no shared runner.

---

## 3. Test Helper Quality

### `tests/claude-code/test-helpers.sh`

**Strengths:**
- Handles a subtle and real problem: `claude -p` hangs when stdout is captured in a `$()` subshell (no TTY). The solution — writing to a temp file and reading it back — is correct and well-commented.
- Retry logic on empty responses (2 attempts) handles transient API/rate-limit failures gracefully without masking real failures.
- `CLAUDECODE` env var is unset before invoking claude, correctly handling the case where tests are run from within Claude Code itself (otherwise nested invocations fail).
- `--max-turns 10` guard prevents infinite skill-loading loops.
- Global `CLAUDE_OUTPUT` variable pattern is documented with the important warning "do not capture via `$()`".
- Assertion functions produce clear, scannable `[PASS]`/`[FAIL]` output with full context on failure.
- `assert_order` implementation uses `grep -n` line numbers for ordering checks — correct approach.
- `create_test_project`/`cleanup_test_project` and `create_test_plan` properly encapsulate setup/teardown.

**Issues:**
- `assert_not_contains` does not guard against empty output. If Claude returns nothing, a `not_contains` assertion silently passes (a false positive). Compare to `assert_contains`, which correctly checks `[ -z "$output" ]`.
- No `assert_exit_code` helper — tests rely entirely on content matching, which cannot verify that skills cause Claude to exit with appropriate codes.
- No timeout override per individual assertion — all calls share the same timeout passed to `run_claude`. Long-running tests cannot granularly control per-query timeouts.
- The `sleep 2` on retry is reasonable but hardcoded. In CI environments with aggressive rate limits, 2 seconds may be too short.

### `tests/opencode/setup.sh`

Good isolation: creates a temporary `$HOME`, redirects `XDG_CONFIG_HOME` and `OPENCODE_CONFIG_DIR`, and exports a `cleanup_test_env` function. The use of `export -f cleanup_test_env` correctly makes it available in sourced tests.

---

## 4. Integration vs. Unit Test Balance

### Claude-Code Suite

The two-tier design is excellent:
- **Unit tests** (`test-*.sh` without `-integration`) run in ~2 minutes each by asking Claude content questions in headless mode. They verify the skill *describes* the right behaviors.
- **Integration tests** (`test-*-integration.sh`) run in 10-30 minutes and execute actual plans, verifying that behaviors are *followed* in practice.

The runner (`run-skill-tests.sh`) defaults to unit tests only, with an explicit `--integration` flag to enable the slower tests. This is the right default for developer workflow.

**Imbalance:** The integration tests are heavily weighted toward `subagent-driven-development` and `team-driven-development`. Every other skill relies entirely on either trigger-detection tests or no tests at all. Skills like `verification-before-completion` and `finishing-a-development-branch` have complex, stateful workflows with real failure modes that are completely unvalidated end-to-end.

### OpenCode Suite

- `test-plugin-loading.sh` and `test-skills-core.sh` are pure unit tests with no external dependencies — fast and reliable.
- `test-tools.sh` and `test-priority.sh` require OpenCode CLI to be installed. If not present, they skip gracefully.
- The `test-skills-core.sh` test inlines library functions rather than importing from `lib/skills-core.js` — a deliberate workaround for ESM path resolution issues, but it means the tests may diverge from the actual library implementation over time.

---

## 5. Skill Triggering — Prompt Quality

### `tests/skill-triggering/prompts/`

The natural-language prompts test realistic triggering scenarios:

| Prompt File | Scenario Quality |
|-------------|-----------------|
| `systematic-debugging.txt` | Good — real test failure with stack trace |
| `executing-plans.txt` | Good — references an existing plan file |
| `requesting-code-review.txt` | Good — references real commit range |
| `writing-plans.txt` | Good — multi-step feature with explicit scope |
| `dispatching-parallel-agents.txt` | Good — 4 independent failures across modules |
| `test-driven-development.txt` | Marginal — very simple feature, may not reliably trigger TDD vs. direct implementation |

**Gap:** No prompts test ambiguous triggering cases where the wrong skill might fire. For example, a debugging prompt that also involves planning could wrongly trigger `writing-plans` instead of `systematic-debugging`.

**Gap:** The trigger test runner has no retry mechanism. A single LLM call that fails to trigger the skill counts as a test failure even if the skill would trigger correctly 9/10 times. LLM behavior is stochastic — a pass/fail determination from a single sample is unreliable.

### `tests/explicit-skill-requests/prompts/`

The explicit request prompts cover realistic user phrasings:
- Bare shorthand: `"subagent-driven-development, please"`
- Verbose explicit: `"please use the brainstorming skill..."`
- Action-oriented: `"Do subagent-driven development on this..."`
- Mid-conversation with preceding context
- After-planning-flow (Claude has just offered options)

The dedicated scripts (`run-multiturn-test.sh`, `run-extended-multiturn-test.sh`, `run-haiku-test.sh`, `run-claude-describes-sdd.sh`) show deliberate investigation of specific failure modes — particularly the case where Claude has already described a skill in conversation and then fails to invoke it when asked. This is sophisticated and directly addresses real user pain points.

**Problem:** These scripts are not wired into `run-all.sh`. The `run-all.sh` only runs 4 of the 9+ prompts in the `prompts/` directory, and the specialized multiturn/haiku scripts are entirely manual. Orphaned test scripts that aren't run automatically provide no ongoing regression protection.

---

## 6. Test Reliability — Race Conditions and Flaky Patterns

### Flakiness Sources

1. **LLM non-determinism:** All Claude-invoked tests are inherently stochastic. The unit tests mitigate this by asking direct content questions ("What does the skill say about X?") rather than relying on behavioral triggers, but triggering tests are single-shot with no retry.

2. **Session file discovery in integration tests:** Both `test-subagent-driven-development-integration.sh` and `test-team-driven-development-integration.sh` find the session file with `find ... -mmin -60 | sort -r | head -1`. This is fragile:
   - If another Claude session happens to run within the same 60-minute window in the same directory, the wrong transcript may be picked up.
   - If the test takes longer than 60 minutes, no transcript is found.
   - The `WORKING_DIR_ESCAPED` path encoding (`sed 's/\//-/g' | sed 's/^-//'`) must exactly match Claude's internal path encoding scheme. If Claude changes this scheme, all integration tests silently fail to find any session file.

3. **`tail -f` process cleanup:** In both integration tests, a background `tail -f` is started to stream live output. The cleanup sequence is `kill $TAIL_PID; wait $TAIL_PID` — correct. However, if the `cd "$TEST_PROJECT"` before `claude ...` changes the shell's working directory and then the test function fails mid-execution, cleanup happens in a different directory than expected. The `trap "cleanup_test_project $TEST_PROJECT" EXIT` mitigates this for the temp directory itself.

4. **Timeout handling in `run-skill-tests.sh`:** The runner uses `timeout "$test_timeout" bash "$test_path"`. If Claude API rate-limiting causes a test to time out, it's reported as a failure with the same weight as a real test failure. There's no distinction between "timeout" and "assertion failure" in the exit summary.

5. **`--max-turns 20` / `--max-turns 30` in integration tests:** These limits are generous but finite. Complex plans could exceed them, causing the test to "pass" setup phases but fail execution silently (claude exits 0 after hitting max-turns but implementation is incomplete).

### Race Condition Risk

The team-driven-development integration test explicitly cleans up team artifacts in `~/.claude/teams/test-team-integration`. If two integration tests run simultaneously (unlikely but possible in a CI matrix), these cleanup operations could interfere. The `trap cleanup EXIT` is the right pattern, but there is no inter-test locking.

---

## 7. `analyze-token-usage.py` — Utility Assessment

### What It Does

Parses Claude Code session JSONL transcripts and produces a formatted table showing:
- Per-agent token usage (input, output, cache creation, cache reads)
- Per-agent estimated cost at fixed rates ($3/$15 per million input/output tokens)
- Totals across all agents

### Quality Assessment

**Strengths:**
- Correctly separates main session usage from subagent usage using `agentId` fields.
- Cache read tokens are tracked separately from input tokens, enabling accurate cost estimation (cache reads are cheaper than cold inputs in practice, though the current implementation charges them at the same rate).
- The description extraction (`prompt.split('\n')[0]`) gives meaningful agent labels for identification.
- Integrated into the integration test runners — every integration test run automatically produces token analysis, giving cost visibility at the point of execution.
- The `defaultdict` pattern handles new agent IDs cleanly.

**Issues:**
- The pricing in `calculate_cost()` uses hardcoded values (`$3.0/$15.0` per million) and conflates cache creation/read tokens with full input tokens. Cache read tokens cost significantly less than input tokens in the actual Claude API. This means cost estimates are systematically overstated for cache-heavy runs.
- The bare `except: pass` in the parsing loop silently discards malformed JSONL lines with no diagnostic output.
- No command-line options: no way to specify different model pricing, filter by date range, or output as CSV/JSON for further processing.
- The tool is only invoked manually or from integration tests — no CI artifact is saved. Token costs from integration test runs are not tracked over time.

---

## 8. Critical Gaps

### Gap 1: `using-superpowers` Has No Tests

`using-superpowers` is the foundational bootstrap skill — it governs when Claude invokes any other skill. It is loaded at the start of every conversation. If this skill degrades (e.g., its trigger conditions weaken), all other skill tests would likely fail intermittently, but the root cause would be invisible. There are no tests specifically checking that `using-superpowers` is loaded and that its rules are followed.

### Gap 2: No Tests for Supporting Workflow Skills

`using-git-worktrees`, `verification-before-completion`, and `finishing-a-development-branch` are explicitly called prerequisites or integrations in the `subagent-driven-development` and `team-driven-development` SKILL.md files. If these skills regress, the SDD integration tests may still pass (because the integration test doesn't verify worktree creation, verification discipline, or branch completion mechanics), while users experience broken workflows.

### Gap 3: No CI/CD Pipeline

No CI configuration exists (no `.github/workflows/`, no `.gitlab-ci.yml`, no similar). Tests are entirely manual. The README mentions CI integration guidance but no automation is wired. The fast `claude-code` unit tests are fast enough (~2 minutes) to run on every pull request, but they don't.

### Gap 4: Orphaned Test Scripts Not in Any Runner

Several test scripts exist but are not included in any `run-all.sh`:
- `tests/explicit-skill-requests/run-multiturn-test.sh`
- `tests/explicit-skill-requests/run-extended-multiturn-test.sh`
- `tests/explicit-skill-requests/run-haiku-test.sh`
- `tests/explicit-skill-requests/run-claude-describes-sdd.sh`

These scripts test real failure modes (skill non-invocation in multi-turn contexts, model-specific behavior) but provide no regression protection because they are not automated.

### Gap 5: No Negative Tests for Skill Anti-Patterns

Skills define "never do" behaviors and red flags. For example:
- `subagent-driven-development` should refuse to start on the main branch.
- `verification-before-completion` should prevent success claims without fresh verification output.
- `brainstorming` should never invoke implementation skills before design approval.

There are no tests verifying that these anti-patterns are actively rejected. The existing tests only check that the skill *describes* the correct behaviors, not that Claude follows them under adversarial conditions.

### Gap 6: No Test for Skill Priority in Claude Code

The OpenCode test suite has a dedicated `test-priority.sh` verifying that project > personal > superpowers skill resolution works. No equivalent test exists for Claude Code's `--plugin-dir` mechanism. If a user has a personal skill with the same name as a superpowers skill, the expected resolution behavior is untested.

### Gap 7: `subagent-driven-dev/` Scenarios Lack Automated Verification

The `go-fractals` and `svelte-todo` scenarios are excellent realistic test fixtures with scaffolding scripts, plans, and designs. However, `run-test.sh` does not perform any pass/fail assertions. It runs Claude and produces output, but the operator must manually verify the results by inspecting files and running `go test ./...` or `npx playwright test` themselves. These scenarios are useful for exploratory testing but provide no automated regression protection.

---

## 9. Test Infrastructure Maturity

### Mature Aspects

- **Two-tier test design** (fast unit vs. slow integration) with explicit flag separation is well-established and developer-friendly.
- **Session transcript parsing** as the verification mechanism is sophisticated — it validates actual tool calls, not just text output, making tests less susceptible to phrasing changes.
- **Isolated test environments** in the OpenCode suite (temporary HOME directory) prevents tests from interfering with the developer's real configuration.
- **Timestamped output directories** (`/tmp/superpowers-tests/$TIMESTAMP/`) prevent test run collisions and preserve diagnostic artifacts.
- **Pre-flight check** in `test-team-driven-development-integration.sh` — verifying that `claude` can respond before launching a 30-minute test — is a good defensive practice.
- **Trap-based cleanup** throughout prevents temp directory accumulation on failure.

### Immature Aspects

- No CI/CD integration.
- No test result history or trend tracking.
- No unified cross-ecosystem test runner.
- Token cost data is not persisted — there's no baseline to detect cost regressions.
- No test for the OpenCode plugin structure in the Claude Code context (the two platforms share skills but have different plugin mechanisms, tested separately but not together).

---

## 10. OpenCode vs. Claude Code Test Differences

| Dimension | Claude Code Tests | OpenCode Tests |
|-----------|------------------|----------------|
| Invocation mechanism | `claude -p ... --plugin-dir` | `opencode run ...` (integration) or direct Node.js (unit) |
| Plugin loading | Via `--plugin-dir` flag | Via symlink in `~/.config/opencode/plugins/` |
| Isolation approach | `env -u CLAUDECODE` + temp directories | Temporary `$HOME` with full environment redirect |
| Library testing | Not directly tested (only via skill loading) | `test-skills-core.sh` directly unit-tests library functions via Node.js |
| Priority resolution | Not tested | Tested via `test-priority.sh` |
| Integration tests | Full end-to-end workflow (10-30 min) | Tool invocation via OpenCode CLI (60s timeout) |
| Default runner scope | Unit tests only (integration opt-in) | Non-integration only (integration opt-in) |
| Platform required | Claude Code CLI | Node.js (unit); OpenCode CLI (integration) |

**Key difference:** The OpenCode suite tests the plugin infrastructure (loading, priority, tools) while the Claude Code suite tests skill *content and behavior*. The OpenCode suite essentially validates that the plugin mechanical layer works; the Claude Code suite validates that the skill instructions produce correct AI behavior. Neither suite covers both layers together.

---

## Summary Findings

### Finding 1: 6 of 15 skills are completely untested, including the foundational `using-superpowers` skill

The skills with no tests include the bootstrap skill that controls when all other skills fire (`using-superpowers`), the prerequisite for all multi-agent workflows (`using-git-worktrees`), and critical quality gates (`verification-before-completion`, `finishing-a-development-branch`). A regression in `using-superpowers` would cause intermittent failures across the entire suite without a clear root cause. This is the highest-priority gap.

### Finding 2: Test infrastructure is mature in design but broken in automation — no CI, four separate test ecosystems, and several orphaned scripts

The test architecture is sound: the two-tier split is correct, the helpers are well-designed, and the session transcript parsing mechanism is sophisticated. However, there is no CI pipeline, no unified runner across the four test ecosystems (claude-code, opencode, skill-triggering, explicit-skill-requests), and several scripts that test real failure modes (`run-multiturn-test.sh`, `run-haiku-test.sh`) are not wired into any automated runner. Tests that don't run automatically provide no regression protection.

### Finding 3: Trigger tests are stochastic single-shots with no retry, and integration tests rely on a fragile session file discovery mechanism

The `skill-triggering/` tests pass or fail based on a single LLM call, with no retry logic for stochastic LLM behavior. A skill that triggers correctly 90% of the time may still produce flaky test failures. The integration tests discover session transcripts via a filesystem timestamp window (`-mmin -60`) and a path encoding scheme that must match Claude's internal format — both are brittle and could produce silent false negatives (tests report passing but actually analyzed the wrong session file, or no session file at all).
