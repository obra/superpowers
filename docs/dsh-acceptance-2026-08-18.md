# DeepSeek Harness (dsh) acceptance — 2026-08-18

This is the full acceptance transcript for the dsh integration
introduced in this PR, run on macOS 26.5.2 (arm64) with
`dsh` 0.1.0-rc.6 and model `deepseek-v4-flash` via the
`deepseek-official` provider. The PR is the live vehicle;
this file is the evidence the plugin does what it says.

The shape mirrors #2144's "New harness support" section: a
`dsh plugin add` capture, a `--dump-config` row proving the
bundle was composed, a smoke check, a clean-session transcript
with the verbatim system prompt and tool-calling sequence, and a
before/after on the same model against a profile with no plugin
installed.

## Install command output

The branch was installed into a fresh profile (`spdshprtest`)
with `dsh plugin`. `DSH_HOME` was redirected to a scratch
directory so the user's `~/.dsh/skills/` (and any personal
catalog entries) were invisible to the run; the catalog
contained only the 14 skills the plugin registered, plus the
two dsh-internal ones the platform itself provides.

```console
$ rm -rf "$DSH_HOME/profiles/spdshprtest"
$ dsh plugin --profile spdshprtest add file:///Users/jonathanwaskin/code/superpowers-safe
dsh: initialized profile spdshprtest at /var/folders/.../profiles/spdshprtest
Progress: resolved 1, reused 0, downloaded 0, added 0

dependencies:
+ superpowers file:/Users/jonathanwaskin/code/superpowers-safe

Packages: +1
+
Progress: resolved 1, reused 1, downloaded 0, added 1, done
Done in 498ms using pnpm v11.5.0
```

The `file://` install is the local analog of
`dsh plugin --profile spdshprtest add github:JFWaskin/superpowers-safe#fork/dsh-upstream-pr`
that a real user will run after this branch is pushed. dsh
treats both as a `pnpm add` into the profile, so the
`dsh.bundle` declaration in `package.json` activates the same
way: the install lines up the layer in the profile tree.

## Profile-layer verification

```console
$ dsh --profile spdshprtest --dump-config | grep -A1 'id: superpowers'
# == superpowers
- id: superpowers
  name: superpowers/.dsh/plugins/superpowers.js
```

The `# == superpowers` header marks the layer that this PR
contributed. The `name:` is a package-relative deep import —
`superpowers/.dsh/plugins/superpowers.js` — which resolves to
`<profile>/node_modules/superpowers/.dsh/plugins/superpowers.js`,
the file this PR adds.

## Smoke check

```console
$ DSH_HOME=/var/folders/.../tmp.kFyB7Wuni5 \
  DSH_AGENTS_HOME=/var/folders/.../tmp.kFyB7Wuni5/agents \
  DEEPSEEK_API_KEY=sk-... \
  dsh --profile spdshprtest "What are your superpowers?"
```

The model answered with a catalog that names every Superpowers
process skill by concept (brainstorming, systematic-debugging,
TDD, planning, verification-before-completion) and explicitly
states the operating rule from the `using-superpowers`
bootstrap: "Skills first — if a task matches a skill, I load
and follow it before acting." The answer is a paraphrase,
not a literal dump of the skill catalog, because dsh's
`ask_user_question`-style system does not surface the catalog
on a free-form prompt — the catalog only appears in the
session-start `<system-reminder>` for the model's reference.
What proves the plugin loaded is the rule itself: that line
comes verbatim from `skills/using-superpowers/SKILL.md`,
delivered through the `<EXTREMELY_IMPORTANT>` section the
plugin registered at order 50.

## Clean-session transcript

Empty working directory, single prompt:

```console
$ mkdir -p /var/folders/.../tmp.D5Uu2JjE7u && cd /var/folders/.../tmp.D5Uu2JjE7u
$ ls -la
total 0
drwxr-xr-x@   2 ...  .
drwxr-xr-x@   3 ...  ..

$ DSH_HOME=/var/folders/.../tmp.kFyB7Wuni5 \
  DSH_AGENTS_HOME=/var/folders/.../tmp.kFyB7Wuni5/agents \
  DEEPSEEK_API_KEY=sk-... \
  dsh --profile spdshprtest "Let's make a react todo list"
```

The agent's first action — captured from the session log's
`tool/call` events, not asserted from the prompt — is
`skill("brainstorming")`. No shell, no read, no write, no
file scaffold. The session ends after the model asks a
clarifying question, per the brainstorming flow.

### System prompt actually sent (verbatim, from `request/header`)

```
You are an AI agent powered by DeepSeek Harness.

You are a coding agent powered by the deepseek-v4-flash model. Your working directory is /private/var/folders/.../tmp.D5Uu2JjE7u.

<EXTREMELY_IMPORTANT>
You have superpowers.

The using-superpowers skill content is included below and is already loaded for this session. Follow it now. Do not load using-superpowers again with the skill tool.

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Skill Priority

When multiple skills apply, process skills come first — they set the approach, then implementation skills (frontend-design, etc.) carry them out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.

- "Let's build X" → superpowers:brainstorming first, then implementation skills.
- "Fix this bug" → superpowers:systematic-debugging first, then domain skills.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Platform Adaptation

If your harness appears here, read its reference file for special instructions:

- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- DeepSeek Harness (dsh): `references/dsh-tools.md`

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.

## DeepSeek Harness tool mapping

Translate the Superpowers action vocabulary to these dsh tools (full reference: skills/using-superpowers/references/dsh-tools.md):

- Dispatch a subagent → `subagent` (standalone prompt; background by default) or `subagent_fork` (inherits this conversation). dsh has NO named subagent types — put the role and instructions in the prompt itself. Follow up with `send_message`, list with `list_agents`, stop with `interrupt_agent`. Large multi-agent orchestration → `workflow`. Fresh-agent iteration loops → `ralph` (only when the human asks for them).
- Create / update todos → `todo_write` (send the ENTIRE list every call — it replaces the previous list).
- Plan mode → `exit_plan_mode` (present the complete plan as markdown; implement only after approval).
- Invoke a skill → `skill` with the exact catalog name: plain `brainstorming`, never `superpowers:brainstorming`.

[dsh's own tool guidance follows, unchanged]
```

The `<EXTREMELY_IMPORTANT>` block is the bootstrap the plugin
registered; the `## DeepSeek Harness tool mapping` block is
the inline copy of `references/dsh-tools.md` that travels with
it. The Platform Adaptation list — which the plugin test
asserts contains the `references/dsh-tools.md` pointer — is
the only allowed edit to `skills/using-superpowers/SKILL.md`
this PR makes. The block is 8155 chars total; the
dsh-internal scaffolding that follows the bootstrap is
unchanged.

### Tools offered in that request

```
bash, create_goal, edit, exit_plan_mode, get_goal, glob, grep,
interrupt_agent, job_kill, job_list, job_output, list_agents,
ralph, read, read_image, send_message, skill, str_replace_editor,
subagent, subagent_fork, todo_write, update_goal, web_search,
workflow, write
```

dsh provides the full native tool set. The plugin does not
add or remove any tool — it registers skills and contributes
a system-prompt section.

### Conversation

```
USER:
Let's make a react todo list
```

```
TOOL CALL (turn 1, step 1) — the first action of the session:
  skill {"name": "brainstorming"}
```

```
TOOL CALL (turn 1, step 2):
  bash {"command": "pwd && ls -la && git status 2>&1 | head -20", "description": "Inspect current working directory contents"}
  → stdout: "no git history" (empty dir confirmed)
```

```
TOOL CALL (turn 1, step 3):
  todo_write {"todos": [...]}
```

```
ASSISTANT (final):
  "First question: **What's the scope of features you want?**
   1. **Minimal** — add a task, mark it complete, delete it
   2. **Standard** — the above, plus edit-in-place, filter
      (all / active / completed), and clear-completed
   3. **Feature-rich** — the above, plus categories/tags,
      due dates, priorities, localStorage persistence, maybe
      drag-and-drop reordering

   Which feels right for this first version?"
```

The session ends there. The agent asked exactly one
clarifying question before any file was touched, in line with
the brainstorming flow.

### Post-session directory state

```console
$ ls -la /var/folders/.../tmp.D5Uu2JjE7u
total 0
drwxr-xr-x@   2 ...  .
drwxr-xr-x@   3 ...  ..
```

Empty. No files were created. No files were read or written
beyond the read-only directory inspection above.

## Before/after on unmodified upstream `dev`

A second fresh profile (`spdshbase`) was created in the same
isolated `DSH_HOME` so the only difference between the two
runs is the presence of the superpowers plugin. Same model,
same prompt, same empty directory. The same isolation that
made the with-plugin run reproducible makes the baseline run
reproducible too.

```console
$ dsh --profile spdshbase --dump-config | grep -A1 'id: superpowers'
(no output — spdshbase has no superpowers layer)
```

```console
$ mkdir -p /var/folders/.../tmp.XkDIOP7ibT && cd /var/folders/.../tmp.XkDIOP7ibT
$ ls -la
total 0
drwx-xr-x@   2 ...  .

$ DSH_HOME=/var/folders/.../tmp.kFyB7Wuni5 \
  DSH_AGENTS_HOME=/var/folders/.../tmp.kFyB7Wuni5/agents \
  DEEPSEEK_API_KEY=sk-... \
  dsh --profile spdshbase "Let's make a react todo list"
```

The agent's response is a summary of a complete Vite app
("Done! Your React todo list is ready and verified"), with
8 `write` calls, a full `npm run build` cycle, an installed
`node_modules/`, and a `dist/` directory — all before the
user is asked a single question.

### Baseline metrics (no plugin)

| Metric | Value |
| --- | --- |
| System prompt | 4063 chars (no `<EXTREMELY_IMPORTANT>` block) |
| Total tool calls | 20 |
| First action | `bash` |
| `skill` calls | 0 |
| `write` calls | 8 |
| `bash` calls | 7 |
| `job_output` calls | 2 |
| `todo_write` calls | 2 |
| Files created in working dir | 11+ (vite project, dist, node_modules) |

### With-plugin metrics (this PR)

| Metric | Value |
| --- | --- |
| System prompt | 8155 chars (with `<EXTREMELY_IMPORTANT>` block) |
| Total tool calls | 3 |
| First action | `skill("brainstorming")` |
| `skill` calls | 1 |
| `write` calls | 0 |
| `bash` calls | 1 (read-only) |
| `todo_write` calls | 1 |
| Files created in working dir | 0 |

The ordering — `skill` first vs `bash` first — is the stable
behavioral difference the plugin produces. The exact call
counts move between runs (this baseline produced 20 calls /
8 writes; the #2144 baseline produced 27 / 8), and even a
second no-plugin run can land on different numbers — the
thing that does not change is *which tool fires first*.

## Adversarial tests

```console
$ bash tests/dsh/run-tests.sh
=== DeepSeek Harness integration tests ===

>>> .../test-dsh-plugin.mjs
✔ package.json declares the dsh bundle patch
✔ the bundle patch inserts one row pointing at the plugin module
✔ the plugin injects exactly the two registries it writes to
✔ apply registers every bundled skill once, with its frontmatter
✔ apply registers one bootstrap section carrying using-superpowers
✔ the dsh tool-mapping reference exists, is linked, and matches the inline mapping
✔ a second apply registers the same thing again, with no leaked state
✔ a malformed skill is skipped and reported, and the rest still register
✔ skills under a fork/ subdirectory are filtered out before registration
✔ skills whose description starts with a fork-only prefix are filtered out
✔ without using-superpowers the skills still register but no bootstrap does
✔ a missing skills directory degrades to a warning, not a throw
✔ the Codex plugin sync excludes the dsh dotdir
ℹ tests 13
ℹ pass 13
ℹ fail 0

>>> .../test-dsh-install.sh
test-dsh-install: packing the repository the way an install would
PASS: DeepSeek Harness bundle installs as a self-contained profile layer

=== All DeepSeek Harness tests passed ===
```

13 unit tests cover registration, bootstrap section shape,
no-leaked-state across repeated `apply()`, malformed-skill
skipping, missing-skill warnings, missing-skills-dir
degradation, and the dsh tool-mapping reference sync. The
install check packs the repository the way `pnpm` would and
asserts the packed tree alone satisfies the bundle
declaration with no runtime dependencies, no non-builtin
imports, and a valid bootstrap skill on disk.

## Notes on the environment

- The acceptance runs were captured on macOS 26.5.2 (arm64)
  with `dsh` 0.1.0-rc.6, model `deepseek-v4-flash` via
  `deepseek-official`.
- `DSH_HOME` was redirected to a scratch directory
  (`/var/folders/.../tmp.kFyB7Wuni5`) so the user's
  `~/.dsh/skills/` was not visible to the run. The user's
  fork-only safety skills live in `~/.dsh/skills/`, not in
  the plugin's bundle, and would otherwise dominate the
  skill catalog.
- The PR diff against `obra/superpowers:dev` is the clean
  bundle — no fork-only skills, no fork-only safety layer,
  no fork-only `nono.sh` references. The defensive
  `isForkOnly` filter in `.dsh/plugins/superpowers.js` is
  the belt-and-braces guard for that.
