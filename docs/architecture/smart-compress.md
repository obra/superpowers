# Smart Compress

How the plugin automatically reduces token usage by compressing noisy Bash output before it enters Claude's context.

---

## The Problem

Every time Claude runs a shell command, the full raw output flows into its context window. Most of that output is noise:

- `git add .` produces nothing useful — Claude already knows what it staged
- `git status` includes 4-5 hint lines ("use git add...", "use git restore...") that serve no purpose for an AI
- `npm install` dumps hundreds of "added package X" lines when all Claude needs is "installed, 150 packages, no errors"
- Passing test suites print every individual test name when "42 tests passed" conveys the same information

In a typical 30-minute session, Claude runs ~80 Bash commands. The raw output from those commands can consume 50,000-120,000 tokens — often more than the actual code Claude reads and writes.

These tokens cost money and consume context window space that could be used for reasoning about your code.

---

## What Smart Compress Does

Smart compress is a `PreToolUse` hook that intercepts Bash commands before they execute. When it recognizes a command that produces noisy output, it rewrites the command to run through a compressor that:

1. Executes the original command exactly as-is (same shell, same arguments, same working directory)
2. Captures the output
3. Applies command-specific compression rules to remove noise while preserving signal
4. Returns the compressed output with a transparency marker
5. Preserves the original exit code

```
Without smart compress:

  Claude  ──git status──>  bash  ──>  git
    ^                                  |
    |         14 lines (raw)           |
    +----------------------------------+

With smart compress:

  Claude  ──git status──>  hook  ──>  optimizer  ──>  bash  ──>  git
    ^                                    |                        |
    |      10 lines (hint lines          |   compress + marker    |
    |      removed, marker added)        +------------------------+
    +------------------------------------+
```

---

## What Gets Compressed

╔═══════════════════════════════════════════
║   smart-compress Implementation Summary   
╠═══════════════════════════════════════════
║ Compression rules: 17 
║ Never-compress patterns: 9 
║ Min output threshold: 200 chars 
╠═══════════════════════════════════════════
║ Tier 1 (near-lossless): 9 
║   - git-add                               
║   - git-commit                            
║   - git-push                              
║   - git-pull                              
║   - git-clone                             
║   - git-fetch                             
║   - npm-install                           
║   - pip-install                           
║   - cargo-install                         
║ Tier 2 (smart filtering): 8 
║   - git-status                            
║   - git-log                               
║   - test-pass                             
║   - build-success                         
║   - lint-output                           
║   - ls-large                              
║   - find-large                            
║   - docker-build                          
╠═══════════════════════════════════════════
║ Never-compress patterns:                  
║   - ^git\s+diff\b                         
║   - ^diff\b                               
║   - ^\s*(cat|head|tail|less|bat|more|type)\ 
║   - \|\s*(grep|rg|awk|sed|sort|uniq|wc|cut| 
║   - \s--(verbose|debug)\b                 
║   - ^\s*(curl|wget|httpie|http)\s+        
║   - ^\s*(vim|nano|emacs|vi)\s+            
║   - ^\s*(node|python3?|ruby|php|perl)\s+-e\ 
║   - ^\s*(echo|printf)\s+                  
╚═══════════════════════════════════════════

### Tier 1: Near-Lossless

These commands produce output where the signal can be captured in one line. The compression is safe to apply unconditionally — no meaningful information is lost.

| Command | Raw output | Compressed output | Savings |
|---|---|---|---|
| `git add .` | Empty or CRLF warnings | `ok` or `ok (2 warning(s))` | ~90% |
| `git commit -m "msg"` | Branch info, file stats, create mode lines | `committed: abc1234 on main, 3 files changed` | ~85% |
| `git push` | Counting objects, writing objects, remote messages | `ok main -> github.com:user/repo.git` | ~90% |
| `git pull` | Remote info, unpacking, file stats | `ok, 3 files changed, +10, -2` | ~85% |
| `git clone` | Cloning, receiving, resolving deltas | `cloned -> my-repo` | ~90% |
| `git fetch` | Remote counting, unpacking | `ok: up to date` or `fetched: 3 update(s)` | ~85% |
| `npm install` / `yarn` / `pnpm` | Hundreds of package resolution lines | `ok, added 150 packages, in 12s` | ~80% |
| `pip install` / `uv pip` | Download progress, dependency resolution | `ok: installed 5 package(s): flask, requests...` | ~80% |
| `cargo install` | Compiling, downloading crates | `ok: installed my-tool` | ~85% |

### Tier 2: Smart Filtering

These commands produce output where some lines are signal and others are noise. The compressor removes the noise and keeps the signal.

| Command | What's removed | What's kept |
|---|---|---|
| `git status` | Hint lines ("use git add...", "use git restore..."), "no changes added to commit" | Branch info, file lists |
| `git log` (>40 lines) | Entries beyond the first 30 | First 30 entries + count of remaining |
| Test runners (passing) | Individual "PASS" lines | Summary lines ("Tests: 100 passed, 100 total") + warnings |
| Build commands (success) | Compilation progress, bundling steps | Summary + warnings |
| Lint output (>30 lines) | Repeated similar warnings | Error/warning counts, all errors shown, first 5 warnings |
| `ls` (>50 entries) | Entries beyond 50 | First 50 + count of remaining |
| `find` (>60 results) | Results beyond 60 | First 60 + count of remaining |
| `docker build` (success) | Layer download/extract progress | Step headers + final result |

---

## What Is NEVER Compressed

These commands always pass through with raw, unmodified output — regardless of length:

| Command type | Why |
|---|---|
| `git diff` (any variant) | Every line is signal for code review and debugging |
| `cat`, `head`, `tail`, `less`, `bat` | Claude explicitly requested file content |
| Commands with pipes (`\| grep`, `\| awk`, `\| sed`) | User already applied their own filter |
| Commands with `--verbose` or `--debug` flags | User explicitly asked for detail |
| `curl`, `wget`, `httpie` | API responses should not be truncated |
| `echo`, `printf` | User is constructing specific output |
| `node -e`, `python -e`, `ruby -e` | Inline script output is the point |
| **Any command that fails** (non-zero exit code) | Error output must be seen in full |
| Output shorter than 200 characters | Not worth the compression overhead |

The "never compress on failure" rule is the most important safety feature. When tests fail, builds break, or commands error out, you get the complete raw output — stack traces, assertion details, error messages, everything.

---

## Transparency Markers

Every compressed output includes a marker at the end:

```
On branch main
Changes not staged for commit:
	modified:   hooks/hooks.json

Untracked files:
	hooks/bash-compress-hook.js

[compressed: 14->10 lines | git-status]
```

The marker tells Claude (and you, if you're reading the output):
- How many lines were in the original output
- How many lines remain after compression
- Which compression rule was applied

This is a deliberate design choice. Unlike external tools that silently truncate output, smart compress always tells Claude that information was removed. If the compressed output is insufficient, Claude can re-run the command — and the adaptive re-run system will pass it through uncompressed (see below).

---

## Adaptive Re-Run Detection

If Claude runs the exact same command twice within 60 seconds, the second run passes through **uncompressed**. This handles the scenario where Claude re-runs a command because the compressed output didn't contain what it needed.

| Run | Behavior | Reasoning |
|---|---|---|
| 1st | Compressed | Default behavior — remove noise |
| 2nd (within 60s) | Raw/uncompressed | Claude is likely retrying for more info |
| 3rd | Compressed | Back to normal — this is now a routine check |

This tracking is session-scoped (stored in a temp file) and automatically cleaned up.

---

## Token Savings

### Measured (verified by test suite)

These numbers come from running the test suite against this repository — a small plugin project with a short git history and a modest number of files. Real-world savings on larger codebases will be higher because there's more noise to remove.

| Command | Raw tokens | Compressed tokens | Savings |
|---|---|---|---|
| `git status` | ~203 | ~146 | **28%** |
| `git log --oneline -50` | ~672 | ~404 | **40%** |
| `npm install` (80-package output) | ~418 | ~18 | **96%** |
| `ls -la` (small dir, below 50-entry threshold) | ~396 | ~396 | 0% — correctly skipped |
| `find hooks/ -type f` (below 60-result threshold) | ~106 | ~106 | 0% — correctly skipped |

The 0% cases are intentional — the output was already short enough that compression overhead wasn't worth it. On a larger project with a `node_modules/` tree, `find` and `ls` results would compress significantly.

### Projected (30-minute session estimates)

Savings accumulate across all Bash calls in a session. These are projections based on typical usage patterns and the per-command rates measured above:

| Scenario | Raw tokens | With smart compress | Savings |
|---|---|---|---|
| Git-heavy workflow (commit, push, pull, status) | ~12,000 | ~2,500 | ~80% |
| Test-driven development (frequent test runs) | ~30,000 | ~4,000 | ~87% |
| Package installation (npm/pip/cargo) | ~15,000 | ~2,000 | ~87% |
| Build-heavy workflow (compile, lint, build) | ~20,000 | ~5,000 | ~75% |
| Mixed session (typical) | ~50,000 | ~12,000 | ~76% |

Commands that aren't covered by compression rules (or hit the never-compress list) pass through unchanged with zero overhead.

---

## Performance Overhead

| Component | Time | Notes |
|---|---|---|
| PreToolUse hook (classification) | ~40ms | Node.js startup + regex matching |
| Optimizer startup | ~40ms | Node.js startup (only for compressed commands) |
| Compression logic | <5ms | String operations |
| **Total per compressed command** | **~85ms** | Only for commands that match a rule |
| **Total per non-compressed command** | **~40ms** | Classification only, no optimizer |

For a typical session with ~80 Bash calls (~40 compressible), total overhead is approximately 5 seconds across the entire session. This is a fraction of a second per command — imperceptible compared to the time Claude spends reasoning.

---

## Cross-Platform Support

Smart compress works on all three platforms supported by Claude Code:

| Platform | Shell used | How it's found |
|---|---|---|
| **macOS** | `/bin/bash` | Always present (ships with macOS) |
| **Linux** | `/bin/bash` or `/usr/bin/bash` | Always present; falls back to `bash` in PATH |
| **Windows** | Git Bash | Checked at `Program Files\Git\bin\bash.exe`; falls back to `bash` in PATH |

Additional cross-platform handling:
- **Line endings:** Windows `\r\n` output is normalized to `\n` before compression
- **File paths:** All internal paths use `path.join()` and are converted to forward slashes for bash compatibility
- **Temp files:** Session tracking uses `os.tmpdir()` which resolves correctly on all platforms
- **Base64 encoding:** Commands are encoded in base64 to avoid shell quoting issues across platforms

---

## How to Disable

If you need to disable compression for any reason:

**For a single project:**
Create an empty file named `.sp-no-compress` in the project root:
```bash
touch .sp-no-compress
```

**For all projects (environment variable):**
```bash
export SP_NO_COMPRESS=1
```

**For a single command:**
There's no per-command disable — but commands on the never-compress list already pass through raw. If you need full output for a command that would normally be compressed, add a pipe: `git status | cat` (the pipe triggers the never-compress rule).

---

## Why Smart Compress Instead of RTK

[RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) is an excellent open-source tool that achieves 60-90% token savings on Bash output. We studied it carefully before building smart compress. Here's why we built our own:

**Zero dependencies.** RTK requires installing a Rust binary and `jq`. Smart compress uses only Node.js, which is already required by the plugin. Install the plugin, and compression works — nothing else to download, no PATH configuration, no version management.

**Safer defaults.** RTK compresses `git diff` output by 75%. That means Claude reviews partial diffs without knowing lines were removed. Smart compress never compresses diffs, file reads, or failed command output. We'd rather save fewer tokens than silently degrade the quality of Claude's reasoning.

**Transparency.** RTK's compressed output looks like normal output — Claude doesn't know information was removed and treats it as complete. Smart compress adds a `[compressed: 120->10 lines | git-status]` marker to every compressed output. Claude always knows when and how much was filtered, and can re-run the command if it needs more.

**Adaptive behavior.** If Claude re-runs the same command within 60 seconds, smart compress passes it through uncompressed — it assumes Claude is retrying because the compressed output wasn't enough. RTK applies the same compression every time regardless.

**The trade-off we accepted.** RTK covers 100+ commands with <10ms overhead (Rust). Smart compress covers 17 commands with ~85ms overhead (Node.js). We're slower and narrower — but those 17 commands account for the vast majority of token waste in typical sessions, and the safety guarantees matter more than covering edge cases.

### Coexistence with RTK

If you also have RTK installed, smart compress detects commands that already start with `rtk` and skips them — no double-compression. The two tools can coexist safely, though running both provides diminishing returns since they target the same output.

---

## Architecture

Smart compress consists of three files:

```
hooks/
├── bash-compress-hook.js     PreToolUse/Bash hook — classifies commands,
│                             decides whether to compress, rewrites the
│                             command to run through the optimizer
│
├── bash-optimizer.js         Executes the original command via spawnSync,
│                             applies compression, outputs result with
│                             transparency marker, preserves exit codes
│
└── compression-rules.js      Rule definitions — command patterns, tier
                              classification, compression functions,
                              and the never-compress list
```

### Hook Pipeline Order

```
PreToolUse/Bash hooks execute in this order:

  1. block-dangerous-commands.js   →  May DENY (stops pipeline)
  2. protect-secrets.js            →  May DENY (stops pipeline)
  3. bash-compress-hook.js         →  May REWRITE command (transparent)
```

Safety hooks always run first. If a command is blocked by safety, the compressor never sees it. If a command passes safety checks, the compressor may rewrite it to run through the optimizer.

### Fail-Open Design

Every layer is designed to fail open — if anything goes wrong, the original command runs unmodified:

- Hook crashes or produces invalid JSON → original command executes normally
- Optimizer can't find bash → warning to stderr, exits with error
- Compression function throws → raw output passes through
- Compression function returns `null` → raw output passes through (used intentionally for short output or failed commands)
- Base64 decode fails → error message, exits

No compression failure can prevent a command from executing.
