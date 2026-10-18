# Toolbelt

A personal agent-skills framework. It began as a fork of [Superpowers](https://github.com/obra/superpowers) — see the Credit section in the README — and has diverged enough to stand on its own. There is no upstream to merge back to.

Installed globally for Claude Code and Codex, and used across every project. That constraint shapes most of what follows.

## How it works

`skills/` holds behavior-shaping markdown. The frontmatter `description` is the highest-leverage line in any skill — it decides whether the skill fires at all.

`hooks/session-start` injects `using-toolbelt` at session start and after compaction. That bootstrap is what makes skills auto-trigger; without it the skills sit on disk and never load.

Two harnesses: Claude Code and Codex. The rest were removed. `docs/porting-to-a-new-harness.md` describes the hook contract a third harness would have to satisfy.

## Working on skills

Skills are code, not prose. They shape agent behavior, so edit them like code.

- **Keep them short.** Most of this content was written for models that needed the process restated three times. They don't anymore. Cut restatement; keep gates. Keep the instructions needed for the current task easy to find after compaction.
- **Forceful blocks are gates, not decoration.** `<HARD-GATE>` and `<ENTRY-GATE>` mark a step whose failure is expensive or irreversible. Keep them to two or three sentences: the condition, who owns the exception, and why. Rationalization tables exist only where a brief instruction measurably failed under pressure; today that is test-driven-development alone. Re-test them when the model changes.
- **One skill names exactly one next skill** and says "Do NOT invoke any other skill." Handoff chains leak otherwise.
- **"Your human partner" is deliberate.** Don't normalize it to "the user."
- **Split by trigger, not by size.** A distinct entry condition earns its own skill and its own `description`, however short the body is. One description straddling two entry conditions degrades both.

## Nothing may assume a specific project

This installs globally, so no file under `skills/` may hard-code anything about one repo. Per-project behavior comes from files in the consuming project, all optional:

- `.toolbelt/routing/<harness>.md` — plain-English agent routing per orchestrating harness
- `.toolbelt/pr-policy.md` — review providers to await, complexity lanes, timeouts
- `.toolbelt/worktree-policy.md` — port ranges, sidecar containers, per-worktree resources
- `docs/REVIEW-GUIDANCE.md` — review conventions, read when present
- `AGENTS.md` — entry-point summary, copied from `docs/AGENTS-SNIPPET.md`

Scripts are referenced relative to their own skill directory, never relative to a repo root. `scripts/review-package` is correct; `skills/subagent-driven-development/scripts/review-package` only works inside this checkout.

`.toolbelt/` is also where scratch lands in consuming projects — `sdd/`, `quick/`, `brainstorm/`.

## Verifying a change

Clean session, send exactly:

> Let's make a react todo list

`brainstorming` must auto-trigger before any code is written. If it doesn't, the bootstrap isn't loading and nothing else about the change matters. Run it in both harnesses after touching `hooks/`, the plugin manifests, or `using-toolbelt`.

**Both harnesses install from a copy, not from this checkout.** `~/.claude/plugins/cache/toolbelt-dev/toolbelt/<version>/` and `~/.codex/plugins/cache/toolbelt-dev/toolbelt/<version>/` are independent copies made at install time. Editing a file here changes nothing in a live session, and the acceptance test above will silently test the old copy. Refresh before trusting any result:

```bash
# Claude Code — install is a no-op at an unchanged version, so uninstall first
claude plugin marketplace update toolbelt-dev
claude plugin uninstall toolbelt@toolbelt-dev --scope user -y
claude plugin install toolbelt@toolbelt-dev --scope user

# Codex — add overwrites the cache in place
codex plugin marketplace upgrade && codex plugin add toolbelt@toolbelt-dev
```

The uninstall step is not optional: `claude plugin install` reports "already installed" and leaves the stale copy untouched when the version string hasn't changed, which is every edit between releases. Verify with `grep` against the cache before trusting a test result.

Then start a fresh session — the hook registers on load, never mid-session.

`tests/` holds plugin-infrastructure tests — packaging, hooks, the brainstorm server, the skills' scripts, and one structural check on skill content in `tests/toolbelt/test-doctrine.sh` (links, script paths, skill names, all-caps emphasis, filler phrases). No test pins skill wording.

`tests/toolbelt/` and `tests/hooks/` pass and are the ones worth keeping green. `tests/claude-code/` and `tests/explicit-skill-requests/` shell out to the `claude` CLI — they cost real money and time, so run them deliberately, not as a reflex.
