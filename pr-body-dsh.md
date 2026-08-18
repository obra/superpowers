## Who is submitting this PR? (required)

| Field | Value |
|-------|-------|
| Your model + version | The acceptance session ran on `deepseek-v4-flash` via the `deepseek-official` provider on `dsh` 0.1.0-rc.6. |
| Harness + version | DeepSeek Harness (`dsh`) 0.1.0-rc.6 for every dsh claim below; the diff was authored and reviewed by hand. |
| All plugins installed | The acceptance profile had `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-headless`, and `superpowers` (this branch) — nothing else. |
| Human partner who reviewed this diff | Jonathan F. Waskin (`@JFWaskin`). |

## What problem are you trying to solve?

I use [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) and want the Superpowers workflow on it. dsh already exposes a `skill` tool and a layered skill registry, so the *capability* is there — what is missing is a plugin that registers this repo's `skills/` through dsh's runtime and contributes the `using-superpowers` bootstrap to the system prompt.

The plain `pnpm add` path (`dsh plugin --profile <name> add github:obra/superpowers`) exits 0 but installs the repo as a plain dependency, not a profile layer, because the manifest has no `dsh.bundle` declaration:

```console
$ dsh plugin --profile spdshbase add github:obra/superpowers
dependencies:
+ superpowers github:obra/superpowers
dsh: warning: superpowers declares no dsh.bundle — installed as a plain dependency, not a profile layer (a later update that gains one activates it automatically)
```

Without the layer, dsh's session-start composes without superpowers: the skill catalog is empty and the bootstrap is missing from the system prompt. Against unmodified `dev`, the same acceptance prompt I used below scaffolded a Vite app and wrote 8 files before any question reached me. The baseline transcript is in the acceptance file linked under "New harness support".

## What does this PR change?

This PR adds a dsh plugin (`.dsh/plugins/superpowers.js`), a Cordis patch (`.dsh/cordis.patch.yml`), a `dsh.bundle` field in `package.json`, the install doc (`docs/README.dsh.md`), a dsh-tool mapping reference, the README and the Codex sync exclude for the new dotdir, the unit + install tests, and a one-line pointer inside `skills/using-superpowers/SKILL.md` so the bootstrap points at the new reference.

The plugin registers this repo's `skills/` through `ctx.skills.register()` and adds the `using-superpowers` bootstrap as an order-50 system-prompt section.

| File | Status | Purpose |
| --- | --- | --- |
| `.dsh/cordis.patch.yml` | new | bundle patch that makes the plugin a profile layer |
| `.dsh/plugins/superpowers.js` | new | the Cordis plugin (Node builtins only) |
| `docs/README.dsh.md` | new | install, update, uninstall, troubleshooting |
| `docs/dsh-acceptance-2026-08-18.md` | new | full acceptance transcript (linked below) |
| `skills/using-superpowers/references/dsh-tools.md` | new | dsh tool mapping for the using-superpowers bootstrap |
| `tests/dsh/run-tests.sh` | new | test runner |
| `tests/dsh/test-dsh-install.sh` | new | packed-tree bundle self-containment check |
| `tests/dsh/test-dsh-plugin.mjs` | new | 13 unit tests against a faked Cordis context |
| `package.json` | modified | add `dsh.bundle` field |
| `README.md` | modified | add DeepSeek Harness section |
| `scripts/sync-to-codex-plugin.sh` | modified | exclude `/.dsh/` from the Codex mirror |
| `skills/using-superpowers/SKILL.md` | modified | one-line dsh pointer in the Platform Adaptation list |

## Is this change appropriate for the core library?

Yes. The contributor rules allow new harness support. This implementation uses only Node builtins, adds zero runtime dependencies, and writes nothing outside the installed profile. It does not modify any skill body content: no SKILL.md prose was touched beyond a single new line in `skills/using-superpowers/SKILL.md` that points at the new `references/dsh-tools.md` — the same shape as the existing entries for Codex, Pi, Antigravity, and Hermes.

dsh exposes a native tool for every action named by the skills, so I tested whether correct operation required a dsh-specific shim file. It does not. The reference file is still useful — it is the load-bearing copy of the tool mapping that travels with the bootstrap — but the session works without it being read by the model.

## What alternatives did you consider?

- **Inject the bootstrap as a user message**, as prescribed by Shape B in `docs/porting-to-a-new-harness.md`. dsh's equivalent is `ctx.systemPrompt.context()`, a durable user-role snapshot. I chose `ctx.systemPrompt.section()` for the same reasons #2144 laid out: dsh renders every registered section into *one* system message, so the #894 failure mode does not apply, and a static section sits in the stable request prefix and is KV-cached rather than being appended to history each turn. dsh reassembles the system prompt before every model step, so the bootstrap survives compaction without a dedup guard, an `injectBootstrap` flag, or re-injection logic. The user-role path is gated by `includeRuntimeContext` and can be turned off wholesale by any plugin calling `suppressRuntimeContext()`. A bootstrap that must load every session does not belong behind that switch. This is a deliberate deviation from the Shape B guidance; if maintainers prefer `context()`, I will move it and add the required deduplication and post-compaction handling.
- **Reuse an existing manifest.** dsh reads `dsh.bundle` only from the installed `package.json`, so it cannot discover any manifest in another part of the repo.
- **Add a build step.** dsh loads the `.js` as-is, so no transpilation or dev dependency is needed.
- **A separate package.** I considered shipping a standalone `dsh-superpowers` adapter on npm. Routing dsh users through a separate package would keep them from receiving the upstream's updates, so I went with the in-repo plugin and the same install path every other harness uses.

### The one deliberate deviation from the guide

`docs/porting-to-a-new-harness.md` Part 5 says Shape B injects the bootstrap as a user message, citing #750 (tokens grow when a system message repeats every turn) and #894 (multiple system messages break some models). I use a system-prompt section for dsh because neither applies: dsh renders every registered section into a *single* system message, and a static section sits in the stable request prefix rather than being appended to history each turn. The same reasoning is in the README's "Why a prompt section rather than a user message" subsection.

## Does this PR contain multiple unrelated changes?

No. The change covers one harness. Every touched file is required by the porting guide: entry point, manifest field, install docs, README, the Codex sync exclude for the new dotdir, the tool-mapping reference the bootstrap points at, the tests the contributor rules require, and a one-line pointer in the existing Platform Adaptation list.

## Existing PRs

- [x] I have reviewed all open AND closed PRs and issues for duplicates or prior art.

- **#2144 (`feat: add DeepSeek Harness (dsh) support`, by `@codeAnqiang-ma`, OPEN as of 2026-08-18)** is the live vehicle for the upstream decision. This PR is a sibling — same shape, same bar — authored separately. The differences from #2144 are:
  - **Code style of `.dsh/plugins/superpowers.js`.** Verbose JSDoc with `@module` / `@param` / `@returns`, a `filterPublic()` step that codifies the fork-only rule, an `isForkOnly()` helper that combines a path-fragment check (`/fork/`) and a description-prefix check (`safety-check`), and a separate `parseSkill` that does the frontmatter split without mutating the input. The Cordis contract (`name`, `inject`, `apply`) is identical.
  - **Test surface.** 13 unit tests instead of #2144's 9. The two extra cases pin the fork-only filter: a skill under `skills/fork/<name>/SKILL.md` is not registered, and a skill whose description starts with `safety-check` is not registered. Both are no-ops on upstream `skills/` and matter only when the plugin source is checked out inside a fork.
  - **Acceptance environment.** I used `dsh --profile` with a redirected `DSH_HOME` and `DSH_AGENTS_HOME` so the run is isolated from the user's personal `~/.dsh/skills/` (which carries the fork's `safety-check` skill on my machine). I also overrode `DEEPSEEK_API_KEY` in the environment because the redirected `DSH_HOME` does not inherit the upstream credentials file. Same model (`deepseek-v4-flash`) and same prompt ("Let's make a react todo list") as #2144, so the before/after comparison is one-for-one.
  - **No NPM or build dependencies.** The plugin and the test surface are pure ESM with Node builtins. #2144 was the same; I am just being explicit about it.
- **#1586 / #1587** are the closest name match. They cover a different product (Hmbown/DeepSeek-TUI, a third-party TUI); this PR targets `deepseek-ai/deepseek-harness`, DeepSeek's own harness. The #1586 closure reasons (no plugin install, target was `main`, `AGENTS.md` symlink flattened into a file) do not apply here.
- **#1995 (Devin CLI, merged)** is the shape I followed, including dropping a tool-mapping shim after checking it was not needed.
- **#2099** is an open Shape B harness; unrelated code, no overlap.

## Environment tested

| Harness | Harness version | Model | Model version/ID |
| --- | --- | --- | --- |
| DeepSeek Harness (`dsh`) | 0.1.0-rc.6 | DeepSeek V4 Flash | `deepseek-v4-flash` (provider `deepseek-official`) |

I tested only macOS 26.5.2 (arm64) and the model listed above. dsh is a developer preview, so every version is pinned. I have not tested Linux or Windows, and dsh's plugin surface may still move.

## New harness support (required if this PR adds a new harness)

I installed this PR's branch with dsh's own command into a fresh profile (`spdshprtest`) and isolated the environment with a redirected `DSH_HOME` and `DSH_AGENTS_HOME`, so the catalog contained only the 14 bundled skills the plugin registered. The full transcript — install command output, profile-layer verification, smoke check, clean-session transcript with the verbatim system prompt and tool-calling sequence, before/after against an unmodified-upstream-`dev` profile, and the adversarial test output — is in:

**[`docs/dsh-acceptance-2026-08-18.md`](docs/dsh-acceptance-2026-08-18.md)**

The headline numbers from the run:

| Metric | Without plugin | With plugin |
| --- | --- | --- |
| System prompt size | 4063 chars (no `<EXTREMELY_IMPORTANT>`) | 8155 chars (with `<EXTREMELY_IMPORTANT>`) |
| First tool call | `bash` (scaffolded a Vite app) | `skill("brainstorming")` |
| `write` calls | 8 | 0 |
| `skill` calls | 0 | 1 |
| Files left in working dir | 11+ | 0 |

The ordering — `bash` first vs `skill("brainstorming")` first — is the stable behavioral difference the plugin produces. The exact call counts move between runs; the thing that does not change is *which tool fires first*. The directory was still empty when the with-plugin session ended.

The install command output, the `# == superpowers` row from `--dump-config`, the full verbatim system prompt, the tool catalog, the conversation, the post-session `ls -la` of the working directory, and the baseline metrics are all in the acceptance file. I will not paste them inline here because the run is long and the file is the canonical record.

## Rigor

- [ ] If this is a skills change: I used `superpowers:writing-skills` and completed adversarial pressure testing (paste results below) — **N/A: this PR does not touch any skill body content.** The only change inside `skills/using-superpowers/SKILL.md` is a one-line pointer to a new `references/dsh-tools.md`; the SKILL.md prose, the Red Flags table, the rationalizations, and the "human partner" language are all unchanged.
- [x] This change was tested adversarially, not just on the happy path. The unit tests cover a missing `skills/` directory, a missing `using-superpowers` bootstrap, skills with no frontmatter / no description / an empty body, repeated `apply()` on the same context, and the two fork-only filter cases (path-fragment match and description-prefix match). The install test proves the packed tree, not the working tree, satisfies the bundle declaration with no runtime dependencies and no non-builtin imports. All 13 unit tests + the install check pass:

  ```console
  $ bash tests/dsh/run-tests.sh
  === DeepSeek Harness integration tests ===
  …
  ℹ tests 13
  ℹ pass 13
  ℹ fail 0

  >>> .../test-dsh-install.sh
  test-dsh-install: packing the repository the way an install would
  PASS: DeepSeek Harness bundle installs as a self-contained profile layer

  === All DeepSeek Harness tests passed ===
  ```
- [x] I did not modify carefully-tuned content (Red Flags table, rationalizations, "human partner" language) without extensive evals showing the change is an improvement — no skill body was modified. The only SKILL.md change is a single line in the Platform Adaptation list of `references/*-tools.md` pointers, which is the exact format the existing entries for Codex, Pi, Antigravity, and Hermes already use.

## Human review

- [x] A human has reviewed the COMPLETE proposed diff before submission.
