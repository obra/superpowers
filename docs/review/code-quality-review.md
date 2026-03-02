# Code Quality & Implementation Review

**Reviewer:** code-reviewer agent
**Date:** 2026-03-02
**Scope:** All code files in the Hartye-superpowers Claude Code plugin project

---

## Summary

The codebase is generally well-structured and readable. The JavaScript and shell code follow consistent patterns. The most significant concerns are: (1) a bare `except` clause in the Python script that silently swallows all errors, (2) missing `set -u` and `set -o pipefail` in several shell scripts, and (3) command injection risk from unquoted user-controlled shell variables interpolated inside Node.js heredocs. Several hardcoded paths and token pricing values also reduce maintainability.

---

## File-by-File Findings

---

### `lib/skills-core.js`

#### Quality Assessment: Good

**1. Frontmatter parser is brittle on multi-line values and YAML edge cases**

`extractFrontmatter` (line 33) uses a line-by-line regex `^(\w+):\s*(.*)$`. This works for simple scalar values but will silently mangle:
- YAML block or flow scalars (e.g., `description: "foo: bar"`)
- Multi-line descriptions (only the first line is captured)
- Keys with hyphens (regex `\w+` excludes `-`, so `some-key:` never matches)

This is acceptable for the current controlled format, but the parser is tightly coupled to the exact frontmatter schema with no validation or warning if the file is malformed.

**2. Duplicate frontmatter logic between `extractFrontmatter` and `stripFrontmatter`**

Both functions independently iterate lines looking for `---` delimiters. A small refactor would eliminate the duplication and reduce the risk of the two implementations diverging. Currently `stripFrontmatter` handles the case where content begins before the first `---` (by collecting lines when `!inFrontmatter`) whereas `extractFrontmatter` does not, but the two behave consistently in practice because files always start with `---`.

**3. `checkForUpdates` runs `git fetch` on every session start**

`checkForUpdates` (line 151) runs `git fetch origin && git status` with a 3-second timeout. Even with the short timeout this is a network call on every session start and will add latency when network is available. If the timeout fires, `execSync` throws and the catch returns `false` — correct behaviour. However, the error is swallowed completely; a log at debug level would help diagnose network slowness complaints.

**4. No export validation**

The module exports are correct (line 202), but there is no JSDoc `@module` tag and the file does not validate that skill names/descriptions are non-empty before returning. Callers must guard against empty strings themselves.

**5. `resolveSkillPath` does no path traversal protection**

`resolveSkillPath` (line 108) constructs paths by joining a user-supplied `skillName` with a directory. If `skillName` is `../../etc/passwd`, `path.join` would resolve it above the skills directory. The only callers currently pass controlled values, but this is worth noting as a hardening opportunity.

**Severity:** Low — the path traversal concern is low-risk given controlled callers; the other items are code quality notes.

---

### `hooks/session-start.sh`

#### Quality Assessment: Good, with one moderate issue

**1. `escape_for_json` does not escape Unicode control characters**

The function (lines 23–31) handles `\`, `"`, `\n`, `\r`, and `\t` but does not escape other JSON-illegal control characters (U+0000–U+001F excluding the three handled). If a SKILL.md file contained a NUL byte, form-feed (`\f`), or vertical-tab, the resulting JSON would be malformed. In practice, SKILL.md files are text files unlikely to contain these characters, but robustness would be improved by using a proper JSON tool (e.g., `jq`) for escaping.

**2. `cat` fallback writes to `using_superpowers_content` on error**

Line 18: `using_superpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-superpowers/SKILL.md" 2>&1 || echo "Error reading using-superpowers skill")`. If the file is missing, the error text is injected directly into the JSON payload, which might confuse the LLM. A cleaner approach would be to detect the missing file explicitly and exit with a useful error, rather than injecting a raw error string.

**3. `BASH_SOURCE[0]` fallback is correct but unusual**

`${BASH_SOURCE[0]:-$0}` (line 7) is a defensive pattern for shells that do not set `BASH_SOURCE`. This is correct and reasonable.

**4. Exit 0 at the end is explicit and correct** — no issue.

**Severity:** Low overall; the JSON escape issue is a theoretical robustness concern.

---

### `.opencode/plugins/h-superpowers.js`

#### Quality Assessment: Good

**1. `getBootstrapContent` reads the skill file on every request**

`getBootstrapContent` (line 56) is called inside `experimental.chat.system.transform`, which fires for every chat message. It calls `fs.existsSync` and `fs.readFileSync` synchronously on every invocation with no caching. For a small file this is not a practical performance issue, but it is architecturally awkward — the content does not change between calls within a session.

**2. Regex in `extractAndStripFrontmatter` is stricter than `skills-core.js`**

Line 17 uses `/^---\n([\s\S]*?)\n---\n([\s\S]*)$/` which requires a trailing newline after the closing `---`. If the file ends with `---` followed by no newline, the regex will not match and the frontmatter will not be stripped. This is an inconsistency with the line-based parser in `skills-core.js`, which handles `---` with or without trailing content.

**3. Logical assignment `(output.system ||= []).push(bootstrap)` (line 91)**

The logical assignment operator (`||=`) is ES2021+ and requires Node 15+. This is fine for modern environments but worth noting for compatibility documentation.

**4. `configDir` is embedded in the prompt string**

Line 72 interpolates `configDir` into a template literal. If `configDir` contains backtick characters or special markdown, this could produce garbled output. In practice, configuration directories are controlled paths and this is not a real risk.

**5. No error handling on `fs.readFileSync` (line 61)**

If the SKILL.md file exists (the `existsSync` check passed) but cannot be read due to permissions, `readFileSync` will throw and propagate up, potentially crashing the plugin. A try/catch would be safer here.

**Severity:** Low overall; the uncached file read on every message is the most actionable item.

---

### `tests/claude-code/test-helpers.sh`

#### Quality Assessment: Good

**1. `output_file=$(mktemp)` without `-t` template (line 17)**

`mktemp` without a template works on both macOS and Linux, but using a template (e.g., `mktemp /tmp/claude-test.XXXXXX`) makes the file easier to identify in debugging. Minor style point.

**2. `assert_contains` and `assert_not_contains` pass `$pattern` directly to `grep -q`**

Patterns passed to these helpers are treated as basic regular expressions, not literal strings. If a test passes a pattern with regex metacharacters (e.g., `[PASS]`) the brackets would be interpreted as a character class. This is the intended behaviour (the functions are documented as "pattern" checks), but it is a potential source of confusing false passes/fails if callers expect literal matching.

**3. `assert_count` uses `grep -c` without `|| echo "0"` being reliable**

Line 101: `local actual=$(echo "$output" | grep -c "$pattern" || echo "0")`. When `grep -c` finds zero matches it exits with status 1. With `set -e` active in the test scripts, this would abort the script before `|| echo "0"` could run — except that command substitution does not propagate exit status with `set -e` in bash (the subshell's exit status is captured, not propagated). The `|| echo "0"` fallback is therefore technically unreachable by `set -e`. This works correctly today because `grep -c` prints `0` on no matches in GNU grep, but `|| echo "0"` creates a false impression of robustness.

**4. `create_test_plan` and `cleanup_test_project` are clean** — no issues.

**5. `sleep 2` in retry loop (line 43)**

Acceptable for a retry-on-empty-response pattern, but the 2-second sleep is hardcoded. This is minor.

**Severity:** Low.

---

### `tests/claude-code/run-skill-tests.sh`

#### Quality Assessment: Good

**1. `chmod +x` inside the runner (line 119)**

If a test file is not executable, the runner silently `chmod +x`es it. This mutates the repository checkout unexpectedly and could mask a misconfigured test. A warning and exit would be safer.

**2. Variable `output` is set but only used in the else branch (non-verbose)**

In the non-verbose path (line 162), `output=$()` captures the test output; this is then printed on failure. The verbose path does not capture. This is correct and intentional — no issue, just worth noting for clarity.

**3. Timeout durations are hardcoded (lines 28–29)**

`TIMEOUT=600` and `INTEGRATION_TIMEOUT=1800` are hardcoded constants. They can be overridden via `--timeout` but only for unit tests, not integration tests. The integration timeout is not configurable via CLI.

**Severity:** Low.

---

### `tests/claude-code/test-subagent-driven-development.sh`

#### Quality Assessment: Good

**1. Test patterns rely on Claude's exact phrasing**

Assertions like `assert_contains "$CLAUDE_OUTPUT" "once\|one time\|single"` are reasonable fuzzy patterns, but they depend on Claude's output vocabulary. Model updates could change phrasing and silently break tests without the test itself being wrong. This is inherent to LLM testing, not a code bug.

**2. No timeout per individual test case**

Each `run_claude` call passes a timeout (90s), but if `run_claude` hangs inside `timeout` for another reason (e.g., the `timeout` binary itself is not found), the entire test script could hang. Acceptable given the controlled CI environment.

**3. `FAILURES` counter pattern is correct** — no issues.

**Severity:** Low / Informational.

---

### `tests/claude-code/test-subagent-driven-development-integration.sh`

#### Quality Assessment: Moderate concern

**1. `cd` used without error checking (lines 37, 165, 269)**

Multiple bare `cd` calls can silently fail if the directory does not exist. With `set -euo pipefail`, a failed `cd` will abort the script, which is acceptable, but the error message would be cryptic. A `cd "$DIR" || { echo "Failed to cd to $DIR"; exit 1; }` pattern provides clearer diagnostics.

**2. `TAIL_PID` may not be killed if `timeout` exits non-zero**

Line 165: `cd "$TEST_PROJECT" && timeout 1800 ... || { echo "EXECUTION FAILED"; exit 1; }`. If execution fails and the script exits via the `||` branch, `TAIL_PID` is not killed before the EXIT trap runs. The `cleanup_test_project` trap will clean up the directory but the `tail -f` process may linger. The explicit `kill "$TAIL_PID"` on lines 173–174 is never reached. The kill should be moved into the trap or a `finally`-style block.

**3. Session transcript discovery is fragile**

Lines 183–188 construct the session directory path by replacing `/` with `-` in the temp directory path and searching for `.jsonl` files modified in the last 60 minutes. This is fragile: if the temp path contains characters that `sed` treats specially, or if two test runs overlap within 60 minutes, the wrong session could be analyzed.

**4. Tests 4 and 5 are missing**

The test numbering jumps from Test 3 (TodoWrite, line 229) directly to Test 6 (Implementation, line 239). Tests 4 and 5 are not present. This appears to be an oversight, either removed tests that left numbering gaps or tests not yet implemented. The gap in numbering is confusing for readers.

**5. `git config user.email` sets global-like config in test repo (lines 114–115)**

Using `git config` without `--local` inside the test repo directory should default to local scope, which is correct. No issue, but worth confirming this is intentional.

**Severity:** Moderate — the orphaned `tail` process and the missing tests 4–5 are the most actionable items.

---

### `tests/claude-code/test-team-driven-development.sh`

#### Quality Assessment: Good

No significant issues beyond what was noted for the sibling `test-subagent-driven-development.sh`. Pattern-based assertions are reasonable for LLM output.

---

### `tests/claude-code/test-team-driven-development-integration.sh`

#### Quality Assessment: Moderate concern

**1. Orphaned `tail -f` process risk (same as subagent integration test)**

The same `TAIL_PID` / `kill` ordering issue exists here (lines 178–192). If the `claude` invocation fails via the `||` path (line 185), `TAIL_PID` is never explicitly killed. The current `||` branch does not exit — it just prints "EXECUTION FAILED" and continues — so the kill on lines 191–192 is reached. However, if any subsequent step causes an early exit, the `tail` process may linger. Moving the kill into the EXIT trap would be more robust.

**2. `cat test-output.txt | sed ...` (line 396)**

`cat file | sed` is a useless use of cat; `sed 's/^/    /' test-output.txt` is equivalent and avoids an extra process.

**3. `wc -l | tr -d ' '` (line 403)**

Standard `wc -l` output format varies between macOS (leading spaces) and Linux (no leading spaces). The `tr -d ' '` corrects for this, which is correct cross-platform practice.

**4. Cleanup removes hardcoded team artifact paths (lines 45–46)**

`rm -rf "$HOME/.claude/teams/test-team-integration"` and the tasks counterpart are hardcoded path assumptions. If the Claude SDK changes where team artifacts are stored, cleanup will silently fail and leave artifacts behind.

**Severity:** Low-Moderate.

---

### `tests/opencode/setup.sh`

#### Quality Assessment: Good

**1. `export HOME="$TEST_HOME"` affects all child processes**

Overriding `HOME` in the test environment is intentional for isolation, but it means any shell built-in or tool that reads `HOME` (e.g., `git`, `npm`) will use the fake home. This is the desired behavior for isolation but could cause unexpected failures if tests invoke tools that depend on the real home (e.g., needing actual `~/.gitconfig`).

**2. `cp -r "$REPO_ROOT/lib"` copies the entire lib directory**

If new non-JS files are added to `lib/`, they will be copied into the test environment without review. This is minor but worth noting as the setup grows.

**3. `export -f cleanup_test_env`**

Exporting a function via `export -f` is bash-specific and will fail in `sh` or `dash`. Since the script uses `#!/usr/bin/env bash`, this is fine, but callers must also use bash (which they do, given `set -euo pipefail`).

**Severity:** Low / Informational.

---

### `tests/opencode/test-skills-core.sh`

#### Quality Assessment: Good, with one notable issue

**1. Node.js code embedded in shell heredocs with path interpolation — command injection risk**

Lines 67–68 (and similar patterns throughout the file):
```bash
result=$(node -e "
...
const result = extractFrontmatter('$TEST_HOME/test-skill/SKILL.md');
...
" 2>&1)
```

`$TEST_HOME` is interpolated directly into a double-quoted Node.js string passed to `node -e`. If `TEST_HOME` contained a single quote, backslash, or `${}` syntax, it could break or inject JavaScript. Since `TEST_HOME` is set by `mktemp -d`, which produces paths like `/tmp/tmp.XXXXXX`, the characters are controlled. However, the pattern itself is unsafe by construction — if the path ever contained `'` (e.g., a directory named `it's`), the Node.js code would be syntactically broken or exploitable. The safer approach is to pass the path as a command-line argument (`process.argv[2]`) rather than embedding it in the code string.

This same pattern appears at lines 114, 227, 316, 327, 333, 405, 409, 413.

**2. Functions are duplicated from `skills-core.js` rather than imported**

The test file re-implements `extractFrontmatter`, `stripFrontmatter`, `findSkillsInDir`, `resolveSkillPath`, and `checkForUpdates` inline in Node.js heredocs. This means changes to `skills-core.js` do not automatically update the tests — the tests could pass while the library has bugs, or vice versa. The comment on line 33 says "Inline the extractFrontmatter function for testing" to avoid ESM path resolution issues, but a better approach would be a CJS wrapper or a test-specific ESM loader.

**Severity:** Moderate for the path interpolation issue; High concern for the test-vs-library duplication.

---

### `tests/opencode/test-tools.sh`

#### Quality Assessment: Good

**1. `opencode run --print-logs` command not validated**

The test assumes `opencode run --print-logs` is a valid invocation. If the opencode CLI changes its interface, the tests would produce non-zero exit codes that are silently swallowed by `|| { echo "[WARN]..."; }`. The tests check exit code 124 (timeout) but treat other non-zero exits as warnings rather than failures.

**2. Output matching is very lenient**

Assertions check for patterns like `"h-superpowers:brainstorming\|Available skills"`. This is broad enough to match accidentally if those strings appear in error messages or logs unrelated to the tool functioning correctly.

**Severity:** Low / Informational.

---

### `tests/opencode/test-priority.sh`

#### Quality Assessment: Moderate concern

**1. Writes to the real `$HOME` before overriding it**

Lines 21–37 write test fixture files to `$HOME/.config/opencode/...` and `$HOME/.config/opencode/superpowers/...`. But `setup.sh` overrides `HOME` via `export HOME="$TEST_HOME"`. The priority test sources `setup.sh` at line 11 and then writes to `$HOME` — this uses the *already-overridden* fake home. However, lines 21–22 write to `$HOME/.config/opencode/superpowers/skills/priority-test/SKILL.md`, which is inside the test environment. This is actually correct behavior. The confusion arises because the path uses the superpowers hardcoded subdirectory (`superpowers/skills`) which may or may not be set up in the fake home by `setup.sh`. `setup.sh` does create `$HOME/.config/opencode/superpowers/` (line 16 of setup.sh), so this works — but the implicit dependency is fragile.

**2. `cd "$HOME"` and `cd "$TEST_HOME/test-project"` change the working directory permanently**

The script changes `cwd` multiple times (lines 105, 131, 158, 180) without returning to the original directory. With `set -euo pipefail`, this is safe as long as each `cd` succeeds, but if a test fails mid-script, the script exits from an unexpected directory. Since the EXIT trap handles cleanup, this is acceptable.

**3. Missing cleanup of files written to `$HOME/.config/opencode/skills/priority-test/`**

The personal-location fixture (lines 34–46) is written inside `$TEST_HOME` (overridden HOME), so it will be cleaned up by the `cleanup_test_env` trap. Correct.

**Severity:** Low; the implicit setup.sh dependency is the main concern.

---

### `tests/subagent-driven-dev/run-test.sh`

#### Quality Assessment: Moderate concern

**1. `--dangerously-skip-permissions` is used without documentation**

Line 78: `--dangerously-skip-permissions` bypasses Claude Code's permission prompts. This is acknowledged in a comment but is a security-relevant flag. It should be documented in the test's README explaining why it is needed (subagents don't inherit parent settings) and what the scope is.

**2. Unquoted `$PROMPT` in the `claude -p` invocation (line 76)**

```bash
claude -p "$PROMPT" \
```

`$PROMPT` is quoted here, which is correct. However, the `PROMPT` variable (line 63) contains `$PLAN_PATH` which in turn contains the output directory path from `mktemp`. If the path contained spaces (mktemp default does not produce spaces, but `/tmp/superpowers-tests/...` could if `mktemp` behavior varies), this would be fine because the outer quotes protect it. This is low-risk but worth noting.

**3. `ls -1 | grep -v` for listing tests (lines 40–41)**

```bash
ls -1 "$SCRIPT_DIR" | grep -v '\.sh$' | grep -v '\.md$'
```

This lists non-.sh/.md entries which is intended to show test directories. Using `find` or glob patterns would be more robust (e.g., if a file has no extension). Minor style issue.

**4. No verification step**

Unlike the integration tests in `tests/claude-code/`, this script does not verify that the generated project meets any requirements. It just runs claude and reports token usage. The "Next steps" output (lines 98–106) requires manual verification. This is by design for this type of exploratory test runner but limits automated regression detection.

**Severity:** Low.

---

### `tests/subagent-driven-dev/go-fractals/scaffold.sh` and `svelte-todo/scaffold.sh`

#### Quality Assessment: Good

Both scripts are functionally identical in structure. No significant issues beyond:

**1. `git init` without `--quiet` (line 15)**

`git init` produces output ("Initialized empty Git repository...") that may clutter test output. The integration tests use `--quiet`; these scripts do not.

**2. Scaffold scripts do not check if git is installed**

If git is not available, the script will fail with an unclear error from `git init`. A pre-check would improve the user experience.

**Severity:** Low / Style.

---

### `tests/explicit-skill-requests/run-test.sh`

#### Quality Assessment: Moderate concern

**1. `PROMPT=$(cat "$PROMPT_FILE")` — no quoting of PROMPT in heredoc line 71**

```bash
timeout 300 claude -p "$PROMPT" \
```

`$PROMPT` is quoted here. However, if the prompt file contained a shell special character like `!` and the script ran under a shell with history expansion, it could cause issues. With `set -e` and bash, `!` history expansion is disabled in non-interactive mode. This is safe in practice.

**2. `SKILL_PATTERN` regex is constructed with string interpolation (line 83)**

```bash
SKILL_PATTERN='"skill":"([^"]*:)?'"${SKILL_NAME}"'"'
```

If `SKILL_NAME` contained regex metacharacters (e.g., `.`, `*`, `+`), the pattern would behave incorrectly. Since skill names use only `[a-z-]` characters currently, this is low-risk but not hardened.

**3. `grep '"type":"tool_use"' "$LOG_FILE" | grep -v '"name":"Skill"'` (line 108)**

The premature-tool detection logic pipes `grep` into `grep`. This creates SIGPIPE issues in some environments if the second `grep` finds no matches and closes the pipe. The `|| true` at line 110 prevents script abort, which is the correct mitigation.

**4. `jq` invocation on line 126 assumes jq is available**

The script uses `jq -r` for JSON extraction but does not check if `jq` is installed. If `jq` is missing, the line fails silently (`|| echo "(could not extract)"`), which is acceptable for a debugging aid.

**Severity:** Low.

---

### `tests/explicit-skill-requests/run-all.sh`

#### Quality Assessment: Good, with one issue

**1. `echo -e "$RESULTS"` is not portable**

Line 62: `echo -e "$RESULTS"` — the `-e` flag for escape interpretation is not part of POSIX `echo` and behaves differently across shells and systems. On macOS, `/bin/sh`'s `echo` does not support `-e`. Since the shebang is `#!/bin/bash` and bash's built-in `echo -e` works, this is fine in practice. Using `printf '%b\n' "$RESULTS"` would be strictly more portable.

**2. Only 4 of the 9 prompt files are tested**

The `prompts/` directory contains 9 prompt files but `run-all.sh` only exercises 4 of them. The remaining prompts (`action-oriented.txt`, `after-planning-flow.txt`, `claude-suggested-it.txt`, `i-know-what-sdd-means.txt`, `skip-formalities.txt`) are not run automatically. This may be intentional (some are informational), but it is not documented.

**Severity:** Low.

---

### `skills/systematic-debugging/find-polluter.sh`

#### Quality Assessment: Moderate concern

**1. `TEST_FILES=$(find . -path "$TEST_PATTERN" | sort)` — unquoted glob in find**

`$TEST_PATTERN` is passed unquoted to `find -path`. If the pattern contains shell special characters or spaces, the `find` invocation could behave unexpectedly. The variable should be quoted: `find . -path "$TEST_PATTERN"`. (Note: it is actually unquoted in the current code on line 22.)

Actually reviewing the code again: line 22 reads `find . -path "$TEST_PATTERN"` — the variable IS double-quoted. However, the result is stored in `TEST_FILES` and then iterated with `for TEST_FILE in $TEST_FILES` (line 29) **without quotes**. Word-splitting on the unquoted `$TEST_FILES` means paths with spaces will be incorrectly split into multiple tokens. This is a real bug if test file paths contain spaces.

**2. `npm test "$TEST_FILE"` assumes npm is the test runner**

Line 42 hardcodes `npm test` as the test command. The script is presented as a general-purpose tool ("Usage: ./find-polluter.sh <file> <test_pattern>") but only works with npm-based projects. The test runner should be configurable or the scope should be clarified.

**3. `set -e` without `set -u` or `set -o pipefail`**

The script uses `set -e` but not `set -u` (unbound variable protection) or `set -o pipefail` (pipe failure detection). Best practice for bash scripts is `set -euo pipefail`.

**4. Emojis in output (lines 18, 34, 47, 53, 63)**

Emojis work fine in most modern terminals but can cause display issues in terminals with limited Unicode support or in log files. This is a minor style point.

**5. Exit code 1 on "FOUND POLLUTER" (line 58)**

The script exits with code 1 when it finds a polluter and code 0 when no polluter is found. This is inverted from the convention where exit 0 means success. The intention is that finding a polluter is "work done" from the debugging perspective, but callers expecting standard exit code conventions might be confused.

**Severity:** Moderate — the word-splitting bug on paths with spaces is a real correctness issue; the hardcoded npm dependency limits the tool's generality.

---

### `skills/writing-skills/render-graphs.js`

#### Quality Assessment: Good

**1. Uses `require()` (CommonJS) not `import`**

Lines 16–18: `const fs = require('fs')`, etc. The rest of the codebase (lib/skills-core.js, h-superpowers.js) uses ES module syntax (`import`). The shebang `#!/usr/bin/env node` and use of `require` means this file must be run as a CommonJS module. If the project ever adds `"type": "module"` to a `package.json` in the skills directory, this file would break. The inconsistency with the rest of the codebase is worth noting.

**2. `execSync('which dot', ...)` for dependency check (line 112)**

`which` is not available on all systems (Windows, some minimal Linux containers). `command -v dot` is the portable POSIX alternative when running in a shell, but from Node.js, the correct approach is to catch the error from the `dot -Tsvg` call itself. The current approach would produce a misleading error on non-`which` systems.

**3. `execSync('dot -Tsvg', ...)` passes untrusted content as stdin**

The `dot` command receives skill content via stdin. Since `execSync` with `input:` passes data via stdin (not a shell command), there is no shell injection risk. This is safe.

**4. `extractGraphBody` greedy regex (line 43)**

```js
const match = dotContent.match(/digraph\s+\w+\s*\{([\s\S]*)\}/);
```

The `[\s\S]*` is greedy and will match up to the *last* `}` in the content, not the first closing brace of the digraph. If the content has nested braces (e.g., node attribute blocks), this will work correctly because the outermost `}` closes the digraph. However, if the DOT source has trailing content after the closing `}`, the regex might capture it. In practice, DOT files are well-formed and this is not a real issue.

**5. No error handling if `diagrams/` directory creation fails (line 132)**

`fs.mkdirSync(outputDir)` (line 132) will throw if the directory already exists (when not using `{ recursive: true }`). This is partially guarded by the `if (!fs.existsSync(outputDir))` check on line 131, but this is a classic TOCTOU (time-of-check-time-of-use) race condition — if the directory is created between the check and the mkdir, the script will crash. Using `fs.mkdirSync(outputDir, { recursive: true })` eliminates this.

**Severity:** Low-Moderate. The TOCTOU issue is a real (if rare) bug; the `which` dependency is a portability issue.

---

### `tests/claude-code/analyze-token-usage.py`

#### Quality Assessment: Moderate concern

**1. Bare `except: pass` silently swallows all errors (line 67)**

```python
except:
    pass
```

This catches *everything*, including `KeyboardInterrupt`, `SystemExit`, and `MemoryError`. It will silently discard malformed JSON, I/O errors, and programming errors in the parsing logic. At minimum this should be `except Exception: pass`, and ideally it should log a warning with the line content and error for debugging.

**2. Token pricing is hardcoded and outdated**

`calculate_cost` (line 76) uses `input_cost_per_m=3.0, output_cost_per_m=15.0` — these are Sonnet-3 pricing tiers. As Claude models evolve, these numbers will be wrong. They should either be configurable via CLI argument or clearly documented as approximate/illustrative.

**3. Cache creation and cache read tokens are combined at 100% cost weight**

Line 79: `total_input = usage['input_tokens'] + usage['cache_creation'] + usage['cache_read']`. Cache creation and cache read have different pricing (cache reads are cheaper). Treating them at the same rate as input tokens overestimates cost.

**4. The output table uses fixed column widths that may overflow**

Column widths like `{agent_id:<15}` (line 122) will produce misaligned output if `agent_id` strings exceed 15 characters. This is a display concern, not a correctness issue.

**5. No validation that the file is actually a `.jsonl` format**

The script accepts any file path and processes it line-by-line as JSON. If given a non-JSONL file, the bare `except: pass` will silently skip every line and produce an empty report. A minimal format check (e.g., validating the first line) would improve usability.

**Severity:** Moderate — the bare `except` is the main concern; the pricing inaccuracies affect cost estimates.

---

## Cross-Cutting Concerns

### Security

1. **Path interpolation in Node.js code strings (test-skills-core.sh):** The pattern of embedding shell variables directly into `node -e "... '$VAR' ..."` strings is unsafe by construction. While the specific values (mktemp output) are currently safe, this pattern should be replaced with argument passing.

2. **`--dangerously-skip-permissions`:** Used in multiple test scripts. This is appropriate for automated testing but should be clearly documented and not used in non-test contexts.

3. **`resolveSkillPath` path traversal:** Low-risk with current callers, but `skillName` is not validated against traversal patterns.

### Shell Script Best Practices

The majority of shell scripts use `set -euo pipefail` (or `set -e`), which is good. Key gaps:

- `find-polluter.sh`: Uses only `set -e`; missing `-u` and `-o pipefail`
- `run-test.sh` (subagent-driven-dev): Uses `#!/bin/bash` with only `set -e`
- `scaffold.sh` files: Only `set -e`
- `run-multiturn-test.sh`, `run-haiku-test.sh`: Only `set -e`
- `run-all.sh`, `run-test.sh` (explicit-skill-requests): Only `set -e`

### Hardcoded Values

| File | Hardcoded Value | Concern |
|------|----------------|---------|
| `analyze-token-usage.py` | `$3.0/$15.0 per M tokens` | Stale pricing |
| `run-skill-tests.sh` | `TIMEOUT=600`, `INTEGRATION_TIMEOUT=1800` | Integration timeout not CLI-configurable |
| `test-team-driven-development-integration.sh` | `~/.claude/teams/test-team-integration` | SDK artifact path assumption |
| `find-polluter.sh` | `npm test` | Project type assumption |
| `test-subagent-driven-development-integration.sh` | Tests 4–5 missing | Incomplete test numbering |

### Cross-Platform Compatibility

- `readlink -f` (test-plugin-loading.sh, line 26): Not available on macOS without GNU coreutils. macOS `readlink -f` works on recent macOS (12+) but fails on older versions. `python3 -c "import os; print(os.path.realpath('...'))"` is a portable alternative.
- `wc -l | tr -d ' '`: The `tr -d ' '` workaround for macOS leading spaces is present in team integration test (line 403) but NOT in the subagent integration test (line 281: `wc -l`). The subagent integration test result may have leading spaces on macOS, causing arithmetic comparison to fail.
- `echo -e`: Not POSIX-portable (see `run-all.sh`).

---

## Top Issues Summary

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | Bare `except: pass` silently swallows all parsing errors | `analyze-token-usage.py:67` | Moderate |
| 2 | Path interpolation into Node.js code strings (injection risk by construction) | `test-skills-core.sh` (multiple lines) | Moderate |
| 3 | `wc -l` missing `tr -d ' '` on macOS in subagent integration test | `test-subagent-driven-development-integration.sh:281` | Moderate |
| 4 | Tests 4 and 5 missing from subagent integration test | `test-subagent-driven-development-integration.sh` | Moderate |
| 5 | `find-polluter.sh` word-splits paths with spaces | `find-polluter.sh:29` | Moderate |
| 6 | TOCTOU race in `render-graphs.js` `mkdirSync` | `render-graphs.js:131-132` | Low-Moderate |
| 7 | Test functions duplicated from library rather than imported | `test-skills-core.sh` | Low-Moderate |
| 8 | Hardcoded and inaccurate token pricing in cost calculator | `analyze-token-usage.py:76-81` | Low |
| 9 | `readlink -f` not universally portable to older macOS | `test-plugin-loading.sh:26` | Low |
| 10 | Missing `set -u` and `set -o pipefail` in several scripts | Multiple | Low |
