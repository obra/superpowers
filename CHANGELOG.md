# Changelog

## [5.0.6] - 2026-03-24

### Added

- **ruby-commit-message skill**: New skill for writing idiomatic Ruby-style git commit messages. Covers tense, length limits, subject/body separation, and Ruby/Rails-specific conventions for referencing classes, methods, and modules. ([PR #1](https://github.com/lucianghinda/superpowers-ruby/pull/1))
- **superpowers:compound skill**: Captures freshly solved problems into structured `docs/solutions/` learning docs using parallel subagents. Ported from [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin), adapted to superpowers-ruby conventions: `name`/`description`-only frontmatter, CSO-compliant trigger-first description, compressed from 1901 to 690 words. ([PR #2](https://github.com/lucianghinda/superpowers-ruby/pull/2))
- **superpowers:compound-refresh skill**: Maintains `docs/solutions/` accuracy over time. Supports interactive and autonomous (`mode:autonomous`) modes. Four maintenance outcomes: Keep, Update, Replace, Archive. Includes Common Mistakes section covering Update/Replace confusion, Archive vs Replace with active problem domains, and autonomous report completeness. ([PR #2](https://github.com/lucianghinda/superpowers-ruby/pull/2))

### Improved

- **ruby skill — CSO description**: Rewrote description to be trigger-first (`Use when...`) instead of leading with a content summary. Added `raise vs fail` and `memoization` as keywords so the skill surfaces for the exact questions it uniquely answers. ([PR #3](https://github.com/lucianghinda/superpowers-ruby/pull/3))
- **ruby skill — Overview section**: Added 2-sentence overview clarifying the skill covers patterns agents miss by default — the Weirich raise/fail distinction, nil-safe memoization, result objects, and performance-conscious enumeration. ([PR #3](https://github.com/lucianghinda/superpowers-ruby/pull/3))
- **ruby skill — Common Mistakes table**: Added 6-entry table covering `raise` vs `fail`, `||=` nil caveat, `+=` vs `<<`, `rescue Exception`, deep `&.` chains, and missing `frozen_string_literal`. ([PR #3](https://github.com/lucianghinda/superpowers-ruby/pull/3))

### Tests

- Added skill-triggering test for `compound`: naive N+1 query scenario confirms the skill triggers from a natural prompt.
- Added explicit-skill-request test for `compound-refresh`: user-named invocation test (`disable-model-invocation: true` makes auto-triggering intentionally unavailable).
- Added skill-triggering test for `ruby`: `raise` vs `fail` question — confirmed by subagent testing to discriminate skill-loaded vs memory-only answers.

## [5.0.5] - 2026-03-17

### Fixed

- **Brainstorm server ESM fix**: Renamed `server.js` → `server.cjs` so the brainstorming server starts correctly on Node.js 22+ where the root `package.json` `"type": "module"` caused `require()` to fail. ([PR #784](https://github.com/obra/superpowers/pull/784) by @sarbojitrana, fixes [#774](https://github.com/obra/superpowers/issues/774), [#780](https://github.com/obra/superpowers/issues/780), [#783](https://github.com/obra/superpowers/issues/783))
- **Brainstorm owner-PID on Windows**: Skip `BRAINSTORM_OWNER_PID` lifecycle monitoring on Windows/MSYS2 where the PID namespace is invisible to Node.js. Prevents the server from self-terminating after 60 seconds. The 30-minute idle timeout remains as the safety net. ([#770](https://github.com/obra/superpowers/issues/770), docs from [PR #768](https://github.com/obra/superpowers/pull/768) by @lucasyhzhu-debug)
- **stop-server.sh reliability**: Verify the server process actually died before reporting success. Waits up to 2 seconds for graceful shutdown, escalates to `SIGKILL`, and reports failure if the process survives. ([#723](https://github.com/obra/superpowers/issues/723))

### Changed

- **Execution handoff**: Restore user choice between subagent-driven-development and executing-plans after plan writing. Subagent-driven is recommended but no longer mandatory. (Reverts `5e51c3e`)
